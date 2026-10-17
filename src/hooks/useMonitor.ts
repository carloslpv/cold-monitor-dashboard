import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchEquipment,
  fetchHistory,
  fetchOpenOutages,
  fetchOutOfRange,
  readingStreamUrl,
  verifySession,
} from '../lib/api'
import type { ConnectionState, Equipment, Reading, SensorOutage } from '../lib/types'

/** How many out-of-range readings the alert table keeps. */
export const OUT_OF_RANGE_LIMIT = 100

/** Delay before reopening a stream the browser gave up on (e.g. the backend was down when it reconnected). */
const RESTART_DELAY_MS = 5000

export interface MonitorState {
  equipment: Equipment[]
  /** Readings per equipment id, oldest first, covering the selected window. */
  readings: Record<string, Reading[]>
  /** Out-of-range readings across all equipment, newest first. */
  outOfRange: Reading[]
  /** Open sensor outages per equipment id: equipment the backend flagged as not sending readings. */
  offline: Record<string, SensorOutage>
  connection: ConnectionState
  /** Goes up whenever the stream reports an equipment registered or changed, anywhere. */
  equipmentVersion: number
  loading: boolean
  error: string | null
}

function time(reading: Reading): number {
  return new Date(reading.recordedAt).getTime()
}

/** Union of two reading lists without duplicates, oldest first, dropping anything before `from`. */
function mergeReadings(a: Reading[], b: Reading[], from: number): Reading[] {
  const byId = new Map<string, Reading>()
  for (const reading of a) byId.set(reading.id, reading)
  for (const reading of b) byId.set(reading.id, reading)
  return [...byId.values()].filter((r) => time(r) >= from).sort((x, y) => time(x) - time(y))
}

function mergeOutOfRange(a: Reading[], b: Reading[], from: number): Reading[] {
  return mergeReadings(a, b, from).reverse().slice(0, OUT_OF_RANGE_LIMIT)
}

/**
 * Loads equipment and reading history for the last `windowMs`, then keeps it current from the backend's
 * Server-Sent Events stream. History is reloaded after a reconnect so readings missed while offline are filled in.
 */
export function useMonitor(windowMs: number): MonitorState {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [readings, setReadings] = useState<Record<string, Reading[]>>({})
  const [outOfRange, setOutOfRange] = useState<Reading[]>([])
  const [offline, setOffline] = useState<Record<string, SensorOutage>>({})
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [equipmentVersion, setEquipmentVersion] = useState(0)

  const windowRef = useRef(windowMs)
  const knownEquipment = useRef(new Set<string>())

  useEffect(() => {
    windowRef.current = windowMs
  }, [windowMs])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  // initial load, and again whenever the window changes or the stream reconnects
  useEffect(() => {
    const controller = new AbortController()
    const from = Date.now() - windowMs
    const key = `${windowMs}:${reloadToken}`

    async function load() {
      const list = await fetchEquipment(controller.signal)
      const fromDate = new Date(from)
      const [histories, alerts, outages] = await Promise.all([
        Promise.all(list.map((e) => fetchHistory(e.id, fromDate, controller.signal))),
        fetchOutOfRange(fromDate, OUT_OF_RANGE_LIMIT, controller.signal),
        fetchOpenOutages(controller.signal),
      ])
      knownEquipment.current = new Set(list.map((e) => e.id))
      setEquipment(list)
      // keep readings that streamed in while the history was loading
      setReadings((previous) =>
        Object.fromEntries(list.map((e, i) => [e.id, mergeReadings(histories[i], previous[e.id] ?? [], from)])),
      )
      setOutOfRange((previous) => mergeOutOfRange(alerts, previous, from))
      setOffline(Object.fromEntries(outages.map((o) => [o.equipmentId, o])))
      setError(null)
    }

    load()
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : String(e))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedKey(key)
      })
    return () => controller.abort()
  }, [windowMs, reloadToken])

  // live stream
  useEffect(() => {
    let source: EventSource | null = null
    let restartTimer: number | undefined
    let dropped = false

    const onReading = (event: MessageEvent<string>) => {
      const reading = JSON.parse(event.data) as Reading
      const from = Date.now() - windowRef.current
      if (!knownEquipment.current.has(reading.equipmentId)) {
        // equipment registered after the page loaded
        knownEquipment.current.add(reading.equipmentId)
        reload()
      }
      setReadings((previous) => {
        const current = previous[reading.equipmentId] ?? []
        const last = current.at(-1)
        const next =
          last && time(last) > time(reading)
            ? mergeReadings(current, [reading], from)
            : [...current.filter((r) => time(r) >= from), reading]
        return { ...previous, [reading.equipmentId]: next }
      })
      if (reading.status !== 'IN_RANGE') {
        setOutOfRange((previous) => mergeOutOfRange(previous, [reading], from))
      }
    }

    const onOutage = (event: MessageEvent<string>) => {
      const outage = JSON.parse(event.data) as SensorOutage
      setOffline((previous) => {
        const next = { ...previous }
        if (outage.endedAt === null) {
          next[outage.equipmentId] = outage
        } else {
          delete next[outage.equipmentId]
        }
        return next
      })
    }

    // new thresholds, or equipment activated or deactivated: reload so panels and history match
    const onEquipment = () => {
      setEquipmentVersion((version) => version + 1)
      reload()
    }

    const open = () => {
      source = new EventSource(readingStreamUrl(), { withCredentials: true })
      source.addEventListener('reading', onReading)
      source.addEventListener('sensor-outage', onOutage)
      source.addEventListener('equipment', onEquipment)
      source.onopen = () => {
        setConnection('live')
        if (dropped) {
          dropped = false
          reload()
        }
      }
      source.onerror = () => {
        dropped = true
        setConnection('reconnecting')
        // the browser retries on its own unless the stream failed outright
        if (source?.readyState === EventSource.CLOSED) {
          source.close()
          // EventSource hides the HTTP status, so ask whether the session expired (that shows the login form)
          verifySession().catch(() => {})
          restartTimer = window.setTimeout(open, RESTART_DELAY_MS)
        }
      }
    }

    open()
    return () => {
      window.clearTimeout(restartTimer)
      source?.close()
    }
  }, [reload])

  const loading = loadedKey !== `${windowMs}:${reloadToken}`
  return { equipment, readings, outOfRange, offline, connection, equipmentVersion, loading, error }
}

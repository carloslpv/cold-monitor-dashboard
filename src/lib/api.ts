import type { Equipment, Page, Reading, SensorOutage } from './types'

/** Backend base URL; empty when the dashboard is served by the same origin as the API (behind the nginx proxy). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** Where the data comes from, for error messages. */
export const API_ORIGIN = API_URL || window.location.origin

/** Largest page the backend serves (Spring Data's default `max-page-size`). */
const PAGE_SIZE = 2000

/** Stops a history fetch from pulling an unbounded number of pages. */
const MAX_PAGES = 10

async function get<T>(path: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<T> {
  const url = new URL(`${API_URL}/api/v1${path}`, window.location.origin)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`GET ${url.pathname} failed with HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

export function fetchEquipment(signal?: AbortSignal): Promise<Equipment[]> {
  return get<Equipment[]>('/equipment', { active: 'true' }, signal)
}

/** All readings of one equipment since `from`, oldest first. */
export async function fetchHistory(equipmentId: string, from: Date, signal?: AbortSignal): Promise<Reading[]> {
  const readings: Reading[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await get<Page<Reading>>(
      `/equipment/${equipmentId}/readings`,
      { from: from.toISOString(), size: String(PAGE_SIZE), page: String(page) },
      signal,
    )
    readings.push(...result.content)
    if (page + 1 >= result.totalPages) {
      break
    }
  }
  return readings.reverse()
}

/** The most recent out-of-range readings across all equipment since `from`, newest first. */
export async function fetchOutOfRange(from: Date, limit: number, signal?: AbortSignal): Promise<Reading[]> {
  const result = await get<Page<Reading>>(
    '/readings/out-of-range',
    { from: from.toISOString(), size: String(limit) },
    signal,
  )
  return result.content
}

/** Equipment the backend currently considers offline (no readings for its configured time). */
export function fetchOpenOutages(signal?: AbortSignal): Promise<SensorOutage[]> {
  return get<SensorOutage[]>('/sensor-outages', { open: 'true' }, signal)
}

export function readingStreamUrl(): string {
  return `${API_URL}/api/v1/readings/stream`
}

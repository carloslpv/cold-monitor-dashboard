import type { Equipment, EquipmentInput, Page, Reading, SensorOutage } from './types'

/** Backend base URL; empty when the dashboard is served by the same origin as the API (behind the nginx proxy). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** Where the data comes from, for error messages. */
export const API_ORIGIN = API_URL || window.location.origin

/** Largest page the backend serves (Spring Data's default `max-page-size`). */
const PAGE_SIZE = 2000

/** Stops a history fetch from pulling an unbounded number of pages. */
const MAX_PAGES = 10

/** An error response from the API, with the RFC 9457 problem detail and per-field validation messages. */
export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string>

  constructor(message: string, status: number, errors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

function apiUrl(path: string): URL {
  return new URL(`${API_URL}/api/v1${path}`, window.location.origin)
}

async function failure(method: string, url: URL, response: Response): Promise<ApiError> {
  let detail = `${method} ${url.pathname} failed with HTTP ${response.status}`
  let errors: Record<string, string> = {}
  try {
    const problem = (await response.json()) as { detail?: string; errors?: Record<string, string> }
    detail = problem.detail ?? detail
    errors = problem.errors ?? {}
  } catch {
    // not a problem+json body
  }
  return new ApiError(detail, response.status, errors)
}

async function get<T>(path: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<T> {
  const url = apiUrl(path)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw await failure('GET', url, response)
  }
  return (await response.json()) as T
}

async function send<T>(method: 'POST' | 'PUT', path: string, body: unknown): Promise<T> {
  const url = apiUrl(path)
  const response = await fetch(url, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw await failure(method, url, response)
  }
  return (await response.json()) as T
}

export function fetchEquipment(signal?: AbortSignal): Promise<Equipment[]> {
  return get<Equipment[]>('/equipment', { active: 'true' }, signal)
}

/** Active and inactive equipment, sorted by name. */
export function fetchAllEquipment(signal?: AbortSignal): Promise<Equipment[]> {
  return get<Equipment[]>('/equipment', {}, signal)
}

export function createEquipment(input: EquipmentInput): Promise<Equipment> {
  return send<Equipment>('POST', '/equipment', input)
}

export function updateEquipment(id: string, input: EquipmentInput): Promise<Equipment> {
  return send<Equipment>('PUT', `/equipment/${id}`, input)
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

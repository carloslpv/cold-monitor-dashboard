export type EquipmentType = 'REFRIGERATOR' | 'FREEZER' | 'COLD_ROOM' | 'OTHER'

export type ReadingStatus = 'IN_RANGE' | 'BELOW_MIN' | 'ABOVE_MAX'

/** Equipment as returned by `GET /api/v1/equipment`. */
export interface Equipment {
  id: string
  code: string
  name: string
  location: string | null
  type: EquipmentType
  minTemperature: number
  maxTemperature: number
  active: boolean
  createdAt: string
  updatedAt: string
}

/** A reading as returned by the readings endpoints and the live stream. */
export interface Reading {
  id: string
  equipmentId: string
  equipmentCode: string
  temperature: number
  recordedAt: string
  receivedAt: string
  status: ReadingStatus
  minTemperature: number
  maxTemperature: number
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type ConnectionState = 'connecting' | 'live' | 'reconnecting'

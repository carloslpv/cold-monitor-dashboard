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

/** Body of `POST /api/v1/equipment` and `PUT /api/v1/equipment/{id}`. */
export interface EquipmentInput {
  code: string
  name: string
  location: string | null
  type: EquipmentType
  minTemperature: number
  maxTemperature: number
  active: boolean
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

/** A stretch without readings, as returned by `GET /api/v1/sensor-outages` and the `sensor-outage` stream event. */
export interface SensorOutage {
  id: string
  equipmentId: string
  equipmentCode: string
  /** Arrival of the last reading before the silence. */
  lastReadingAt: string
  lastTemperature: number
  detectedAt: string
  /** Arrival of the first reading after it; null while the sensor is still silent. */
  endedAt: string | null
  endTemperature: number | null
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type ConnectionState = 'connecting' | 'live' | 'reconnecting'

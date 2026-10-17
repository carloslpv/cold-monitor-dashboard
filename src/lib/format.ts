import type { EquipmentType, ReadingStatus } from './types'

const LOCALE = 'pt-BR'

const temperatureFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const thresholdFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const shortTimeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export function formatTemperature(value: number): string {
  return `${temperatureFormat.format(value)} °C`
}

export function formatRange(min: number, max: number): string {
  return `${thresholdFormat.format(min)} a ${thresholdFormat.format(max)} °C`
}

export function formatTime(value: number | string | Date): string {
  return timeFormat.format(new Date(value))
}

export function formatShortTime(value: number): string {
  return shortTimeFormat.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value))
}

/** "agora", "há 12 s", "há 3 min", "há 2 h". */
export function formatAge(timestamp: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(timestamp).getTime()) / 1000))
  if (seconds < 2) return 'agora'
  if (seconds < 60) return `há ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  return `há ${Math.floor(minutes / 60)} h`
}

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  IN_RANGE: 'Na faixa',
  BELOW_MIN: 'Abaixo do mínimo',
  ABOVE_MAX: 'Acima do máximo',
}

export const TYPE_LABEL: Record<EquipmentType, string> = {
  REFRIGERATOR: 'Geladeira',
  FREEZER: 'Freezer',
  COLD_ROOM: 'Câmara fria',
  OTHER: 'Outro',
}

import type { Equipment, EquipmentInput, EquipmentType } from './types'

/** The equipment form as typed: temperatures stay text so "2,5" and half-typed values survive re-renders. */
export interface EquipmentFormValues {
  code: string
  name: string
  location: string
  type: EquipmentType
  minTemperature: string
  maxTemperature: string
}

export type EquipmentField = keyof EquipmentFormValues

export type EquipmentFormErrors = Partial<Record<EquipmentField, string>>

/** Same limits the backend enforces (see EquipmentRequest). */
export const CODE_MAX = 50
export const NAME_MAX = 120
export const LOCATION_MAX = 120
const TEMPERATURE_LIMIT = 100

/** Up to three integer digits and two decimals, with a comma or a dot. */
const TEMPERATURE_PATTERN = /^[-+]?\d{1,3}([.,]\d{1,2})?$/

export const EMPTY_FORM: EquipmentFormValues = {
  code: '',
  name: '',
  location: '',
  type: 'REFRIGERATOR',
  minTemperature: '',
  maxTemperature: '',
}

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, useGrouping: false })

export function formFromEquipment(equipment: Equipment): EquipmentFormValues {
  return {
    code: equipment.code,
    name: equipment.name,
    location: equipment.location ?? '',
    type: equipment.type,
    minTemperature: decimal.format(equipment.minTemperature),
    maxTemperature: decimal.format(equipment.maxTemperature),
  }
}

function parseTemperature(text: string): number | null {
  const value = text.trim()
  return TEMPERATURE_PATTERN.test(value) ? Number(value.replace(',', '.')) : null
}

function temperatureError(text: string): string | undefined {
  if (text.trim() === '') return 'Informe a temperatura.'
  const value = parseTemperature(text)
  if (value === null) return 'Use um número com até duas casas decimais, como 2 ou -18,5.'
  if (Math.abs(value) > TEMPERATURE_LIMIT) return `Use um valor entre -${TEMPERATURE_LIMIT} e ${TEMPERATURE_LIMIT} °C.`
  return undefined
}

export function validateEquipment(values: EquipmentFormValues): EquipmentFormErrors {
  const errors: EquipmentFormErrors = {}
  const code = values.code.trim()
  const name = values.name.trim()
  if (code === '') errors.code = 'Informe o código.'
  else if (code.length > CODE_MAX) errors.code = `Use no máximo ${CODE_MAX} caracteres.`
  if (name === '') errors.name = 'Informe o nome.'
  else if (name.length > NAME_MAX) errors.name = `Use no máximo ${NAME_MAX} caracteres.`
  if (values.location.trim().length > LOCATION_MAX) errors.location = `Use no máximo ${LOCATION_MAX} caracteres.`

  const minError = temperatureError(values.minTemperature)
  const maxError = temperatureError(values.maxTemperature)
  if (minError) errors.minTemperature = minError
  if (maxError) errors.maxTemperature = maxError
  if (!minError && !maxError) {
    const min = parseTemperature(values.minTemperature)!
    const max = parseTemperature(values.maxTemperature)!
    if (min >= max) errors.maxTemperature = 'A máxima precisa ser maior que a mínima.'
  }
  return errors
}

/** Converts a form that passed {@link validateEquipment} into the API payload. */
export function toEquipmentInput(values: EquipmentFormValues, active: boolean): EquipmentInput {
  const location = values.location.trim()
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    location: location === '' ? null : location,
    type: values.type,
    minTemperature: parseTemperature(values.minTemperature)!,
    maxTemperature: parseTemperature(values.maxTemperature)!,
    active,
  }
}

/** The API payload for an existing equipment with only `active` changed. */
export function withActive(equipment: Equipment, active: boolean): EquipmentInput {
  return {
    code: equipment.code,
    name: equipment.name,
    location: equipment.location,
    type: equipment.type,
    minTemperature: equipment.minTemperature,
    maxTemperature: equipment.maxTemperature,
    active,
  }
}

const FIELDS: EquipmentField[] = ['code', 'name', 'location', 'type', 'minTemperature', 'maxTemperature']

/** Maps the backend's per-field validation messages onto the form; anything else goes under `general`. */
export function serverErrors(errors: Record<string, string>): { fields: EquipmentFormErrors; general: string[] } {
  const fields: EquipmentFormErrors = {}
  const general: string[] = []
  for (const [key, message] of Object.entries(errors)) {
    if ((FIELDS as string[]).includes(key)) {
      fields[key as EquipmentField] = `Valor recusado pelo servidor: ${message}`
    } else if (key === 'thresholdRangeValid') {
      fields.maxTemperature = 'A máxima precisa ser maior que a mínima.'
    } else {
      general.push(message)
    }
  }
  return { fields, general }
}

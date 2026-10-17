import { useState, type FormEvent } from 'react'
import { ApiError, createEquipment, updateEquipment } from '../lib/api'
import {
  CODE_MAX,
  EMPTY_FORM,
  formFromEquipment,
  LOCATION_MAX,
  NAME_MAX,
  serverErrors,
  toEquipmentInput,
  validateEquipment,
  type EquipmentField,
  type EquipmentFormErrors,
  type EquipmentFormValues,
} from '../lib/equipmentForm'
import { TYPE_LABEL } from '../lib/format'
import type { Equipment, EquipmentType } from '../lib/types'
import { Dialog } from './Dialog'

interface Props {
  /** The equipment to edit, or undefined to register a new one. */
  equipment?: Equipment
  onClose: () => void
  onSaved: (equipment: Equipment) => void
}

export function EquipmentForm({ equipment, onClose, onSaved }: Props) {
  const [values, setValues] = useState<EquipmentFormValues>(() =>
    equipment ? formFromEquipment(equipment) : EMPTY_FORM,
  )
  const [errors, setErrors] = useState<EquipmentFormErrors>({})
  const [general, setGeneral] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const editing = equipment !== undefined

  const set = (field: EquipmentField) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    // clear the message once the user starts fixing the field
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateEquipment(values)
    setErrors(found)
    setGeneral([])
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0]
      document.getElementById(`equipment-${first}`)?.focus()
      return
    }
    setSaving(true)
    try {
      // new equipment starts active; editing keeps whatever it was
      const input = toEquipmentInput(values, equipment?.active ?? true)
      const saved = editing ? await updateEquipment(equipment.id, input) : await createEquipment(input)
      onSaved(saved)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErrors({ code: 'Já existe um equipamento com este código.' })
      } else if (e instanceof ApiError && e.status === 400 && Object.keys(e.errors).length > 0) {
        const mapped = serverErrors(e.errors)
        setErrors(mapped.fields)
        setGeneral(mapped.general)
      } else if (e instanceof ApiError && e.status === 404) {
        setGeneral(['Este equipamento não existe mais. Feche e atualize a lista.'])
      } else {
        setGeneral([`Não foi possível salvar: ${e instanceof Error ? e.message : String(e)}`])
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog title={editing ? `Editar ${equipment.name}` : 'Novo equipamento'} onClose={onClose}>
      <form className="form" onSubmit={submit} noValidate>
        {general.length > 0 && (
          <div className="error" role="alert">
            {general.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <div className="form-row">
          <TextField
            field="code"
            label="Código"
            hint="Identifica o sensor, como FRZ-01. Precisa ser único."
            value={values.code}
            error={errors.code}
            maxLength={CODE_MAX}
            onChange={set('code')}
          />
          <div className="field">
            <label htmlFor="equipment-type">Tipo</label>
            <select
              id="equipment-type"
              value={values.type}
              onChange={(event) => set('type')(event.target.value as EquipmentType)}
            >
              {(Object.keys(TYPE_LABEL) as EquipmentType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TextField
          field="name"
          label="Nome"
          value={values.name}
          error={errors.name}
          maxLength={NAME_MAX}
          onChange={set('name')}
        />
        <TextField
          field="location"
          label="Local"
          optional
          value={values.location}
          error={errors.location}
          maxLength={LOCATION_MAX}
          onChange={set('location')}
        />

        <fieldset className="form-row">
          <legend>Faixa permitida (°C)</legend>
          <TextField
            field="minTemperature"
            label="Mínima"
            decimal
            value={values.minTemperature}
            error={errors.minTemperature}
            onChange={set('minTemperature')}
          />
          <TextField
            field="maxTemperature"
            label="Máxima"
            decimal
            value={values.maxTemperature}
            error={errors.maxTemperature}
            onChange={set('maxTemperature')}
          />
        </fieldset>
        {editing && (
          <p className="muted">Mudar a faixa vale para as próximas leituras; as já gravadas mantêm a faixa da época.</p>
        )}

        <div className="form-actions">
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Salvando…' : editing ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

interface TextFieldProps {
  field: EquipmentField
  label: string
  value: string
  error: string | undefined
  onChange: (value: string) => void
  hint?: string
  optional?: boolean
  maxLength?: number
  /** Accepts a comma as decimal separator and shows a numeric keyboard on phones. */
  decimal?: boolean
}

function TextField({ field, label, value, error, onChange, hint, optional, maxLength, decimal }: TextFieldProps) {
  const id = `equipment-${field}`
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="muted"> (opcional)</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode={decimal ? 'decimal' : undefined}
        autoComplete="off"
        value={value}
        maxLength={maxLength}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

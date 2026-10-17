import { formatAge, formatRange, formatTemperature, TYPE_LABEL } from '../lib/format'
import type { Equipment, Reading } from '../lib/types'
import { StatusBadge } from './StatusBadge'
import { TemperatureChart } from './TemperatureChart'

/** A sensor that has been quiet this long is flagged, whatever its last status was. */
export const STALE_AFTER_MS = 60_000

interface Props {
  equipment: Equipment
  readings: Reading[]
  from: number
  now: number
}

export function EquipmentPanel({ equipment, readings: all, from, now }: Props) {
  // the window slides between reloads, so drop what has scrolled out of it
  const readings = all.filter((r) => new Date(r.recordedAt).getTime() >= from)
  const latest = readings.at(-1)
  const stale = !latest || now - new Date(latest.recordedAt).getTime() > STALE_AFTER_MS
  const excursions = readings.filter((r) => r.status !== 'IN_RANGE').length
  const outOfRange = latest !== undefined && latest.status !== 'IN_RANGE'
  const details = [equipment.code, equipment.location, TYPE_LABEL[equipment.type]].filter(Boolean).join(' · ')

  return (
    <article className={`panel${outOfRange ? ' panel-alert' : ''}`} aria-labelledby={`eq-${equipment.id}`}>
      <header className="panel-header">
        <div className="panel-title">
          <h2 id={`eq-${equipment.id}`}>{equipment.name}</h2>
          <p className="muted">{details}</p>
        </div>
        <div className="panel-current">
          <span className="current-temperature">{latest ? formatTemperature(latest.temperature) : '--'}</span>
          {latest && <StatusBadge status={latest.status} />}
        </div>
      </header>

      <dl className="panel-facts">
        <div>
          <dt>Faixa permitida</dt>
          <dd>{formatRange(equipment.minTemperature, equipment.maxTemperature)}</dd>
        </div>
        <div>
          <dt>Última leitura</dt>
          <dd className={stale ? 'warning-text' : undefined}>
            {latest ? formatAge(latest.recordedAt, now) : 'sem leituras'}
            {latest && stale && ' (sem sinal)'}
          </dd>
        </div>
        <div>
          <dt>Fora da faixa no período</dt>
          <dd className={excursions > 0 ? 'critical-text' : undefined}>{excursions}</dd>
        </div>
      </dl>

      <TemperatureChart equipment={equipment} readings={readings} from={from} to={now} />
    </article>
  )
}

import { formatAge, formatDateTime, formatRange, formatTemperature, TYPE_LABEL } from '../lib/format'
import type { Equipment, Reading, SensorOutage } from '../lib/types'
import { OfflineBadge, StatusBadge } from './StatusBadge'
import { TemperatureChart } from './TemperatureChart'

interface Props {
  equipment: Equipment
  readings: Reading[]
  /** Set while the backend has flagged this equipment as not sending readings. */
  outage: SensorOutage | undefined
  from: number
  now: number
}

export function EquipmentPanel({ equipment, readings: all, outage, from, now }: Props) {
  // the window slides between reloads, so drop what has scrolled out of it
  const readings = all.filter((r) => new Date(r.recordedAt).getTime() >= from)
  const latest = readings.at(-1)
  const offline = outage !== undefined
  const excursions = readings.filter((r) => r.status !== 'IN_RANGE').length
  const outOfRange = !offline && latest !== undefined && latest.status !== 'IN_RANGE'
  const details = [equipment.code, equipment.location, TYPE_LABEL[equipment.type]].filter(Boolean).join(' · ')
  // an outage knows the last reading even after it scrolled out of the window
  const lastTemperature = outage?.lastTemperature ?? latest?.temperature
  const panelClass = offline ? ' panel-offline' : outOfRange ? ' panel-alert' : ''

  return (
    <article className={`panel${panelClass}`} aria-labelledby={`eq-${equipment.id}`}>
      <header className="panel-header">
        <div className="panel-title">
          <h2 id={`eq-${equipment.id}`}>{equipment.name}</h2>
          <p className="muted">{details}</p>
        </div>
        <div className="panel-current">
          <span className={`current-temperature${offline ? ' muted' : ''}`}>
            {lastTemperature !== undefined ? formatTemperature(lastTemperature) : '--'}
          </span>
          {offline ? <OfflineBadge /> : latest && <StatusBadge status={latest.status} />}
        </div>
      </header>

      <dl className="panel-facts">
        <div>
          <dt>Faixa permitida</dt>
          <dd>{formatRange(equipment.minTemperature, equipment.maxTemperature)}</dd>
        </div>
        <div>
          <dt>Última leitura</dt>
          {outage ? (
            <dd className="warning-text" title={`Desde ${formatDateTime(outage.lastReadingAt)}`}>
              {formatAge(outage.lastReadingAt, now)} (sem sinal)
            </dd>
          ) : (
            <dd>{latest ? formatAge(latest.recordedAt, now) : 'sem leituras'}</dd>
          )}
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

import { formatDateTime, formatRange, formatTemperature } from '../lib/format'
import type { Equipment, Reading } from '../lib/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  readings: Reading[]
  equipment: Equipment[]
}

export function OutOfRangeTable({ readings, equipment }: Props) {
  const names = new Map(equipment.map((e) => [e.id, e.name]))

  return (
    <section className="alerts" aria-labelledby="alerts-title">
      <h2 id="alerts-title">Leituras fora da faixa</h2>
      {readings.length === 0 ? (
        <p className="muted empty">Nenhuma leitura fora da faixa no período.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Horário</th>
                <th scope="col">Equipamento</th>
                <th scope="col" className="numeric">
                  Temperatura
                </th>
                <th scope="col">Faixa permitida</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading.id}>
                  <td className="numeric-cell">{formatDateTime(reading.recordedAt)}</td>
                  <td>
                    {names.get(reading.equipmentId) ?? reading.equipmentCode}
                    <span className="muted code"> {reading.equipmentCode}</span>
                  </td>
                  <td className="numeric">{formatTemperature(reading.temperature)}</td>
                  <td>{formatRange(reading.minTemperature, reading.maxTemperature)}</td>
                  <td>
                    <StatusBadge status={reading.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

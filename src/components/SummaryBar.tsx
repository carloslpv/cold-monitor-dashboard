import type { Equipment, Reading, SensorOutage } from '../lib/types'

interface Props {
  equipment: Equipment[]
  readings: Record<string, Reading[]>
  outOfRange: Reading[]
  outOfRangeLimit: number
  offline: Record<string, SensorOutage>
}

export function SummaryBar({ equipment, readings, outOfRange, outOfRangeLimit, offline }: Props) {
  // a silent sensor's last status says nothing about now, so it only counts as offline
  const silent = equipment.filter((e) => offline[e.id]).length
  const latest = equipment.filter((e) => !offline[e.id]).map((e) => readings[e.id]?.at(-1))
  const alertingNow = latest.filter((r) => r && r.status !== 'IN_RANGE').length
  const inRange = latest.filter((r) => r?.status === 'IN_RANGE').length
  const alerts = outOfRange.length >= outOfRangeLimit ? `${outOfRangeLimit}+` : String(outOfRange.length)

  return (
    <section className="summary" aria-label="Resumo">
      <div className="tile">
        <span className="tile-label">Equipamentos</span>
        <span className="tile-value">{equipment.length}</span>
      </div>
      <div className="tile">
        <span className="tile-label">Na faixa agora</span>
        <span className="tile-value">{inRange}</span>
      </div>
      <div className={`tile${alertingNow > 0 ? ' tile-alert' : ''}`}>
        <span className="tile-label">Fora da faixa agora</span>
        <span className="tile-value">{alertingNow}</span>
      </div>
      <div className={`tile${silent > 0 ? ' tile-warning' : ''}`}>
        <span className="tile-label">Sem leituras agora</span>
        <span className="tile-value">{silent}</span>
      </div>
      <div className="tile">
        <span className="tile-label">Leituras fora da faixa no período</span>
        <span className="tile-value">{alerts}</span>
      </div>
    </section>
  )
}

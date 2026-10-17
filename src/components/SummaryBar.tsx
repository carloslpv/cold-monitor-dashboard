import type { Equipment, Reading } from '../lib/types'

interface Props {
  equipment: Equipment[]
  readings: Record<string, Reading[]>
  outOfRange: Reading[]
  outOfRangeLimit: number
}

export function SummaryBar({ equipment, readings, outOfRange, outOfRangeLimit }: Props) {
  const latest = equipment.map((e) => readings[e.id]?.at(-1))
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
      <div className="tile">
        <span className="tile-label">Leituras fora da faixa no período</span>
        <span className="tile-value">{alerts}</span>
      </div>
    </section>
  )
}

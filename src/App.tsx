import { useState } from 'react'
import { EquipmentPanel } from './components/EquipmentPanel'
import { Header, type WindowOption } from './components/Header'
import { OutOfRangeTable } from './components/OutOfRangeTable'
import { SummaryBar } from './components/SummaryBar'
import { useMonitor, OUT_OF_RANGE_LIMIT } from './hooks/useMonitor'
import { useNow } from './hooks/useNow'
import { API_ORIGIN } from './lib/api'

const MINUTE = 60_000

const WINDOWS: WindowOption[] = [
  { label: '15 min', ms: 15 * MINUTE },
  { label: '1 h', ms: 60 * MINUTE },
  { label: '6 h', ms: 6 * 60 * MINUTE },
  { label: '24 h', ms: 24 * 60 * MINUTE },
]

export default function App() {
  const [windowMs, setWindowMs] = useState(WINDOWS[0].ms)
  const { equipment, readings, outOfRange, offline, connection, loading, error } = useMonitor(windowMs)
  const now = useNow(1000)
  const from = now - windowMs

  return (
    <div className="app">
      <Header connection={connection} windows={WINDOWS} windowMs={windowMs} onWindowChange={setWindowMs} />

      {error && (
        <p className="error" role="alert">
          Não foi possível carregar os dados de {API_ORIGIN}: {error}
        </p>
      )}

      <SummaryBar
        equipment={equipment}
        readings={readings}
        outOfRange={outOfRange}
        outOfRangeLimit={OUT_OF_RANGE_LIMIT}
        offline={offline}
      />

      {equipment.length === 0 && !loading && !error && (
        <p className="muted empty">Nenhum equipamento ativo cadastrado.</p>
      )}

      <main className="panels" aria-busy={loading}>
        {equipment.map((e) => (
          <EquipmentPanel
            key={e.id}
            equipment={e}
            readings={readings[e.id] ?? []}
            outage={offline[e.id]}
            from={from}
            now={now}
          />
        ))}
      </main>

      <OutOfRangeTable readings={outOfRange} equipment={equipment} />
    </div>
  )
}

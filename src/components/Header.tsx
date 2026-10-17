import type { ConnectionState } from '../lib/types'

export interface WindowOption {
  label: string
  ms: number
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  live: 'Ao vivo',
  reconnecting: 'Reconectando…',
}

interface Props {
  connection: ConnectionState
  windows: WindowOption[]
  windowMs: number
  onWindowChange: (ms: number) => void
}

export function Header({ connection, windows, windowMs, onWindowChange }: Props) {
  return (
    <header className="app-header">
      <div>
        <h1>cold-monitor</h1>
        <p className="muted">Temperatura dos equipamentos da cadeia fria</p>
      </div>
      <div className="header-controls">
        <div className="segmented" role="radiogroup" aria-label="Período exibido">
          {windows.map((option) => (
            <button
              key={option.ms}
              type="button"
              role="radio"
              aria-checked={option.ms === windowMs}
              className={option.ms === windowMs ? 'selected' : undefined}
              onClick={() => onWindowChange(option.ms)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className={`connection connection-${connection}`} role="status">
          <span className="connection-dot" aria-hidden="true" />
          {CONNECTION_LABEL[connection]}
        </span>
      </div>
    </header>
  )
}

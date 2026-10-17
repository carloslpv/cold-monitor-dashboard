import type { ReactNode } from 'react'
import { VIEW_HASH, type View } from '../hooks/useView'
import type { ConnectionState, CurrentUser } from '../lib/types'

export interface WindowOption {
  label: string
  ms: number
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  live: 'Ao vivo',
  reconnecting: 'Reconectando…',
}

const VIEW_LABEL: Record<View, string> = {
  monitor: 'Monitoramento',
  equipment: 'Equipamentos',
}

interface Props {
  view: View
  connection: ConnectionState
  user: CurrentUser
  onLogout: () => void
  /** Controls specific to the current page, shown before the connection status. */
  children?: ReactNode
}

export function Header({ view, connection, user, onLogout, children }: Props) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div>
          <h1>cold-monitor</h1>
          <p className="muted">Temperatura dos equipamentos da cadeia fria</p>
        </div>
        <nav className="tabs" aria-label="Páginas">
          {(Object.keys(VIEW_LABEL) as View[]).map((option) => (
            <a key={option} href={VIEW_HASH[option]} aria-current={option === view ? 'page' : undefined}>
              {VIEW_LABEL[option]}
            </a>
          ))}
        </nav>
      </div>
      <div className="header-controls">
        {children}
        <span className={`connection connection-${connection}`} role="status">
          <span className="connection-dot" aria-hidden="true" />
          {CONNECTION_LABEL[connection]}
        </span>
        <span className="user">
          <span className="muted" title="Usuário conectado">
            {user.username}
          </span>
          <button type="button" className="button button-small" onClick={onLogout}>
            Sair
          </button>
        </span>
      </div>
    </header>
  )
}

interface WindowSelectorProps {
  windows: WindowOption[]
  windowMs: number
  onWindowChange: (ms: number) => void
}

export function WindowSelector({ windows, windowMs, onWindowChange }: WindowSelectorProps) {
  return (
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
  )
}

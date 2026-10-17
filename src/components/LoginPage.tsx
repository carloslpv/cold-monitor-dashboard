import { useState, type FormEvent } from 'react'
import { ApiError, login } from '../lib/api'
import type { CurrentUser } from '../lib/types'

interface Props {
  /** The previous session stopped working (expired, or logged out in another tab). */
  expired: boolean
  onLogin: (user: CurrentUser) => void
}

export function LoginPage({ expired, onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (username.trim() === '' || password === '') {
      setError('Informe o usuário e a senha.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      onLogin(await login(username.trim(), password))
    } catch (e) {
      setPassword('')
      if (e instanceof ApiError && e.status === 401) {
        setError('Usuário ou senha incorretos.')
      } else {
        setError(`Não foi possível entrar: ${e instanceof Error ? e.message : String(e)}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login">
      <form className="login-card form" onSubmit={submit} noValidate>
        <div>
          <h1>cold-monitor</h1>
          <p className="muted">Entre para ver a temperatura dos equipamentos.</p>
        </div>
        {expired && !error && (
          <p className="notice-warning" role="status">
            Sua sessão terminou. Entre de novo para continuar.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="login-username">Usuário</label>
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit" className="button button-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

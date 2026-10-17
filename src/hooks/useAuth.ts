import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentUser, logout as apiLogout, setUnauthorizedHandler } from '../lib/api'
import type { CurrentUser } from '../lib/types'

export type AuthState =
  | { status: 'checking' }
  | { status: 'error'; message: string }
  /** `expired` is set when a session the user had stopped working, so the form can say why it is back. */
  | { status: 'anonymous'; expired: boolean }
  | { status: 'authenticated'; user: CurrentUser }

export interface Auth {
  state: AuthState
  loggedIn: (user: CurrentUser) => void
  logout: () => Promise<void>
  retry: () => void
}

/** Tracks the login session: checks it on load and drops back to the login form whenever the API answers 401. */
export function useAuth(): Auth {
  const [state, setState] = useState<AuthState>({ status: 'checking' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setState(user ? { status: 'authenticated', user } : { status: 'anonymous', expired: false })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    setUnauthorizedHandler(() =>
      setState((previous) => (previous.status === 'authenticated' ? { status: 'anonymous', expired: true } : previous)),
    )
    return () => setUnauthorizedHandler(() => {})
  }, [])

  const loggedIn = useCallback((user: CurrentUser) => setState({ status: 'authenticated', user }), [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setState({ status: 'anonymous', expired: false })
    }
  }, [])

  const retry = useCallback(() => {
    setState({ status: 'checking' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, loggedIn, logout, retry }
}

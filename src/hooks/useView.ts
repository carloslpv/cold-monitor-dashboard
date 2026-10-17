import { useSyncExternalStore } from 'react'

/** The dashboard's pages, addressed by the URL hash so they can be bookmarked and survive a reload. */
export type View = 'monitor' | 'equipment'

export const VIEW_HASH: Record<View, string> = {
  monitor: '#/',
  equipment: '#/equipamentos',
}

function currentView(): View {
  return window.location.hash === VIEW_HASH.equipment ? 'equipment' : 'monitor'
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useView(): View {
  return useSyncExternalStore(subscribe, currentView)
}

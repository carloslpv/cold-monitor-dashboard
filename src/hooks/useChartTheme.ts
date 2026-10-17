import { useSyncExternalStore } from 'react'

/** Chart colors as plain hex: SVG presentation attributes do not resolve CSS variables. */
export interface ChartTheme {
  surface: string
  series: string
  grid: string
  axis: string
  muted: string
  good: string
  critical: string
}

const LIGHT: ChartTheme = {
  surface: '#fcfcfb',
  series: '#2a78d6',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  good: '#0ca30c',
  critical: '#d03b3b',
}

const DARK: ChartTheme = {
  surface: '#1a1a19',
  series: '#3987e5',
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
  good: '#0ca30c',
  critical: '#d03b3b',
}

const query = window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void) {
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useChartTheme(): ChartTheme {
  const dark = useSyncExternalStore(subscribe, () => query.matches)
  return dark ? DARK : LIGHT
}

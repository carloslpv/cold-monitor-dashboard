import { useMemo } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../hooks/useChartTheme'
import { downsample } from '../lib/downsample'
import { formatShortTime, formatTemperature, formatTime } from '../lib/format'
import type { Equipment, Reading, ReadingStatus } from '../lib/types'
import { StatusBadge } from './StatusBadge'

/** Enough points to draw a smooth line at dashboard widths without slowing re-renders. */
const MAX_POINTS = 600

interface Point {
  t: number
  temperature: number
  status: ReadingStatus
}

interface Props {
  equipment: Equipment
  readings: Reading[]
  from: number
  to: number
}

const axisNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

const NICE_STEPS = [0.5, 1, 2, 5, 10, 20, 50]

const MINUTE = 60_000
const TIME_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 180, 240, 360].map((m) => m * MINUTE)

/** Y ticks on a round step covering the thresholds and every point, with a little headroom. */
function yTicks(points: Point[], min: number, max: number): number[] {
  let low = min
  let high = max
  for (const point of points) {
    low = Math.min(low, point.temperature)
    high = Math.max(high, point.temperature)
  }
  const step = NICE_STEPS.find((s) => (high - low) / s <= 5) ?? NICE_STEPS[NICE_STEPS.length - 1]
  const start = Math.floor(low / step) * step - (low % step === 0 ? step : 0)
  const end = Math.ceil(high / step) * step + (high % step === 0 ? step : 0)
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(2)))
  return ticks
}

/** Time ticks on whole minutes or hours, about five across the window. */
function xTicks(from: number, to: number): number[] {
  const step = TIME_STEPS.find((s) => (to - from) / s <= 6) ?? TIME_STEPS[TIME_STEPS.length - 1]
  // align to the local clock, not to UTC
  const offset = new Date(from).getTimezoneOffset() * MINUTE
  const ticks: number[] = []
  for (let t = Math.ceil((from - offset) / step) * step + offset; t <= to; t += step) ticks.push(t)
  return ticks
}

export function TemperatureChart({ equipment, readings, from, to }: Props) {
  const theme = useChartTheme()
  const { minTemperature: min, maxTemperature: max } = equipment

  const points = useMemo(() => {
    const all = readings.map((r) => ({ t: new Date(r.recordedAt).getTime(), temperature: r.temperature, status: r.status }))
    return downsample(all, MAX_POINTS, (p) => p.t, (p) => p.temperature)
  }, [readings])

  const ticks = yTicks(points, min, max)

  return (
    <div className="chart" role="img" aria-label={`Temperatura de ${equipment.name} no período, faixa permitida de ${min} a ${max} °C`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.grid} />
          <ReferenceArea y1={min} y2={max} fill={theme.good} fillOpacity={0.08} stroke="none" ifOverflow="hidden" />
          <ReferenceLine
            y={max}
            stroke={theme.good}
            strokeOpacity={0.7}
            label={{ value: `máx ${axisNumber.format(max)}`, position: 'insideTopLeft', fill: theme.muted, fontSize: 11 }}
          />
          <ReferenceLine
            y={min}
            stroke={theme.good}
            strokeOpacity={0.7}
            label={{ value: `mín ${axisNumber.format(min)}`, position: 'insideBottomLeft', fill: theme.muted, fontSize: 11 }}
          />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[from, to]}
            allowDataOverflow
            ticks={xTicks(from, to)}
            tickFormatter={formatShortTime}
            stroke={theme.axis}
            tick={{ fill: theme.muted, fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            domain={[ticks[0], ticks[ticks.length - 1]]}
            ticks={ticks}
            allowDataOverflow
            tickFormatter={(v: number) => axisNumber.format(v)}
            width={36}
            stroke={theme.axis}
            tick={{ fill: theme.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: theme.axis, strokeWidth: 1 }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
              if (!point) return null
              return (
                <div className="tooltip">
                  <div className="tooltip-time">{formatTime(point.t)}</div>
                  <div className="tooltip-value">{formatTemperature(point.temperature)}</div>
                  <StatusBadge status={point.status} />
                </div>
              )
            }}
          />
          <Line
            dataKey="temperature"
            type="linear"
            stroke={theme.series}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            isAnimationActive={false}
            activeDot={{ r: 5, fill: theme.series, stroke: theme.surface, strokeWidth: 2 }}
            dot={(props: { cx?: number; cy?: number; index?: number; payload?: Point }) => {
              const key = `dot-${props.index}`
              if (props.payload?.status === 'IN_RANGE' || props.cx == null || props.cy == null) {
                return <g key={key} />
              }
              return (
                <circle key={key} cx={props.cx} cy={props.cy} r={4} fill={theme.critical} stroke={theme.surface} strokeWidth={2} />
              )
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

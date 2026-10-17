import { STATUS_LABEL } from '../lib/format'
import type { ReadingStatus } from '../lib/types'

const ICON: Record<ReadingStatus, string> = {
  IN_RANGE: '✓',
  BELOW_MIN: '▼',
  ABOVE_MAX: '▲',
}

/** Status always pairs its color with an icon and a label, so it never relies on color alone. */
export function StatusBadge({ status }: { status: ReadingStatus }) {
  const tone = status === 'IN_RANGE' ? 'good' : 'critical'
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-icon" aria-hidden="true">
        {ICON[status]}
      </span>
      {STATUS_LABEL[status]}
    </span>
  )
}

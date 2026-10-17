/**
 * Thins a time series to at most about `maxPoints` by splitting it into equal time buckets and keeping the lowest
 * and highest point of each. Peaks survive, so a short excursion past a threshold stays visible on a long window.
 */
export function downsample<T>(points: T[], maxPoints: number, time: (p: T) => number, value: (p: T) => number): T[] {
  if (points.length <= maxPoints) {
    return points
  }
  const buckets = Math.max(1, Math.floor(maxPoints / 2))
  const start = time(points[0])
  const span = time(points[points.length - 1]) - start || 1
  const result: T[] = []
  let bucket = -1
  let low: T | undefined
  let high: T | undefined

  const flush = () => {
    if (low === undefined || high === undefined) return
    if (low === high) result.push(low)
    else if (time(low) <= time(high)) result.push(low, high)
    else result.push(high, low)
  }

  for (const point of points) {
    const index = Math.min(buckets - 1, Math.floor(((time(point) - start) / span) * buckets))
    if (index !== bucket) {
      flush()
      bucket = index
      low = point
      high = point
      continue
    }
    if (value(point) < value(low!)) low = point
    if (value(point) > value(high!)) high = point
  }
  flush()
  return result
}

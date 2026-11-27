import { DNF, averageOf, bestAverage, effective, mean } from '@/features/timer/stats'
import type { Solve } from '@/features/timer/types'

export type Trend = { kind: 'better' | 'worse' | 'steady'; deltaMs: number; firstMs: number; lastMs: number; window: number }

/**
 * Is the cuber getting faster? Compares the mean of their first solves with the
 * mean of their latest ones (DNFs left out). Needs at least 6 finished solves;
 * the window is up to 12 solves at each end, never overlapping.
 */
export function trend(solves: Solve[]): Trend | null {
  const done = [...solves].sort((a, b) => a.at.localeCompare(b.at)).filter((s) => effective(s) !== DNF)
  if (done.length < 6) return null
  const window = Math.min(12, Math.floor(done.length / 2))
  const avg = (xs: Solve[]) => xs.reduce((t, s) => t + effective(s), 0) / xs.length
  const firstMs = avg(done.slice(0, window))
  const lastMs = avg(done.slice(-window))
  const deltaMs = firstMs - lastMs
  // Within 2% counts as steady: small swings are just normal variation.
  const kind = Math.abs(deltaMs) < firstMs * 0.02 ? 'steady' : deltaMs > 0 ? 'better' : 'worse'
  return { kind, deltaMs: Math.abs(deltaMs), firstMs, lastMs, window }
}

export type EventSummary = {
  count: number
  dnfs: number
  best: Solve | null
  mean: number | null
  ao5: number | null
  ao12: number | null
  bestAo5: number | null
  bestAo12: number | null
  first: string | null
  last: string | null
}

/** Everything the profile shows for one event, from that event's solves (any session). */
export function summarize(solves: Solve[]): EventSummary {
  const sorted = [...solves].sort((a, b) => a.at.localeCompare(b.at))
  let bestSolve: Solve | null = null
  for (const s of sorted) if (effective(s) !== DNF && (!bestSolve || effective(s) < effective(bestSolve))) bestSolve = s
  return {
    count: sorted.length,
    dnfs: sorted.filter((s) => effective(s) === DNF).length,
    best: bestSolve,
    mean: mean(sorted),
    ao5: averageOf(sorted, 5),
    ao12: averageOf(sorted, 12),
    bestAo5: bestAverage(sorted, 5),
    bestAo12: bestAverage(sorted, 12),
    first: sorted[0]?.at ?? null,
    last: sorted[sorted.length - 1]?.at ?? null,
  }
}

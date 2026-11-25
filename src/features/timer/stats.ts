/**
 * Solve statistics, following WCA conventions:
 * - A +2 adds 2000 ms. A DNF counts as worse than any time.
 * - Average of N (ao5, ao12): drop the single best and single worst, mean the rest.
 *   More than one DNF in the window makes the average a DNF.
 * - Singles are shown truncated to hundredths; averages are rounded to hundredths.
 * Tests: stats.test.ts.
 */
import type { Solve } from './types'

export const DNF = Number.POSITIVE_INFINITY

/** Time that counts, in ms (Infinity for a DNF). */
export function effective(s: Pick<Solve, 'ms' | 'penalty'>): number {
  if (s.penalty === 'dnf') return DNF
  return s.ms + (s.penalty === '+2' ? 2000 : 0)
}

/** Best single, or null with no successful solves. */
export function best(solves: Solve[]): number | null {
  const ok = solves.map(effective).filter((t) => t !== DNF)
  return ok.length ? Math.min(...ok) : null
}

/** Worst finished single, or null. */
export function worst(solves: Solve[]): number | null {
  const ok = solves.map(effective).filter((t) => t !== DNF)
  return ok.length ? Math.max(...ok) : null
}

/** Mean of finished solves (DNFs left out, as session means usually do), or null. */
export function mean(solves: Solve[]): number | null {
  const ok = solves.map(effective).filter((t) => t !== DNF)
  return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null
}

/**
 * WCA-style average of the LAST n solves (solves are oldest first).
 * Returns null when there are fewer than n solves, DNF when 2+ DNFs.
 */
export function averageOf(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null
  return trimmedMean(solves.slice(-n).map(effective))
}

export function trimmedMean(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b)
  const trim = Math.max(1, Math.ceil(times.length * 0.05))
  const kept = sorted.slice(trim, sorted.length - trim)
  if (kept.some((t) => t === DNF)) return DNF
  return kept.reduce((a, b) => a + b, 0) / kept.length
}

/** Rolling average of n at every point (null until there are n solves). */
export function rollingAverage(solves: Solve[], n: number): Array<number | null> {
  return solves.map((_, i) => (i + 1 < n ? null : trimmedMean(solves.slice(i + 1 - n, i + 1).map(effective))))
}

/** Best average of n anywhere in the list. */
export function bestAverage(solves: Solve[], n: number): number | null {
  const all = rollingAverage(solves, n).filter((v): v is number => v !== null && v !== DNF)
  return all.length ? Math.min(...all) : null
}

/**
 * Format milliseconds for display.
 * mode 'single' truncates to hundredths (WCA singles), 'average' rounds.
 * 75432 -> "1:15.43", 9870 -> "9.87".
 */
export function formatTime(ms: number | null, mode: 'single' | 'average' = 'single'): string {
  if (ms === null) return '-'
  if (ms === DNF) return 'DNF'
  const cs = mode === 'single' ? Math.floor(ms / 10) : Math.round(ms / 10)
  const minutes = Math.floor(cs / 6000)
  const rest = cs - minutes * 6000
  const s = Math.floor(rest / 100)
  const hund = String(rest % 100).padStart(2, '0')
  return minutes ? `${minutes}:${String(s).padStart(2, '0')}.${hund}` : `${s}.${hund}`
}

/** A solve's display, with its penalty marked. */
export function formatSolve(s: Solve): string {
  if (s.penalty === 'dnf') return 'DNF'
  const t = formatTime(effective(s))
  return s.penalty === '+2' ? `${t}+` : t
}

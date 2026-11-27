import { describe, expect, it } from 'vitest'
import type { Penalty, Solve } from '@/features/timer/types'
import { summarize, trend } from './insights'

let n = 0
const solve = (sec: number, penalty: Penalty = 'none'): Solve => {
  n += 1
  return { id: String(n), sessionId: 's', event: '333', ms: sec * 1000, penalty, scramble: '', at: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString() }
}

describe('trend', () => {
  it('needs at least 6 finished solves', () => {
    expect(trend([30, 29, 28, 27, 26].map((s) => solve(s)))).toBeNull()
  })
  it('says better when the latest solves are faster than the first ones', () => {
    const t = trend([40, 38, 36, 30, 28, 26].map((s) => solve(s)))!
    expect(t.kind).toBe('better')
    expect(t.firstMs).toBe(38000)
    expect(t.lastMs).toBe(28000)
    expect(t.deltaMs).toBe(10000)
  })
  it('says worse when the latest solves are slower', () => {
    expect(trend([20, 21, 20, 30, 31, 30].map((s) => solve(s)))!.kind).toBe('worse')
  })
  it('calls small changes steady and ignores DNFs', () => {
    expect(trend([30, 30, 30, 30.2, 30, 30, 1].map((s, i) => solve(s, i === 6 ? 'dnf' : 'none')))!.kind).toBe('steady')
  })
  it('works in solve order even if the list is not sorted', () => {
    const list = [40, 38, 36, 30, 28, 26].map((s) => solve(s)).reverse()
    expect(trend(list)!.kind).toBe('better')
  })
})

describe('summarize', () => {
  it('finds the best single (with +2 counted) and counts DNFs', () => {
    const s = summarize([solve(20), solve(18, '+2'), solve(19), solve(5, 'dnf')])
    expect(s.count).toBe(4)
    expect(s.dnfs).toBe(1)
    expect(s.best?.ms).toBe(19000)
    expect(s.ao5).toBeNull()
  })
})

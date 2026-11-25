import { describe, expect, it } from 'vitest'
import { averageOf, best, bestAverage, DNF, effective, formatSolve, formatTime, mean, rollingAverage } from './stats'
import { HOLD_MS, initialTimer, inspectionDisplay, inspectionPenalty, timerReducer, type TimerAction, type TimerState } from './engine'
import type { Penalty, Solve } from './types'

const solve = (ms: number, penalty: Penalty = 'none'): Solve => ({ id: String(ms), sessionId: 's', event: '333', ms, penalty, scramble: '', at: '' })
const run = (actions: TimerAction[], from: TimerState = initialTimer) => actions.reduce(timerReducer, from)

describe('penalties', () => {
  it('+2 adds two seconds, DNF is worse than anything', () => {
    expect(effective(solve(10000, '+2'))).toBe(12000)
    expect(effective(solve(10000, 'dnf'))).toBe(DNF)
  })
})

describe('averages follow WCA rules', () => {
  it('ao5 drops the best and the worst', () => {
    // 10, 11, 12, 13, 50 -> mean of 11, 12, 13
    expect(averageOf([10, 11, 12, 13, 50].map((s) => solve(s * 1000)), 5)).toBe(12000)
  })
  it('ao5 needs five solves', () => {
    expect(averageOf([solve(1000), solve(2000)], 5)).toBeNull()
  })
  it('one DNF is dropped as the worst; two DNFs make a DNF average', () => {
    expect(averageOf([solve(10000), solve(11000), solve(12000), solve(13000), solve(1, 'dnf')], 5)).toBe(12000)
    expect(averageOf([solve(10000), solve(11000), solve(12000), solve(1, 'dnf'), solve(1, 'dnf')], 5)).toBe(DNF)
  })
  it('ao12 drops one best and one worst and uses the last 12', () => {
    const times = [99, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 50].map((s) => solve(s * 1000))
    // last 12: 10..20 and 50; drop 10 and 50 -> mean of 11..20 = 15.5
    expect(averageOf(times, 12)).toBe(15500)
  })
  it('best, mean, best average and the rolling line', () => {
    const list = [12, 9, 15, 11, 10, 13].map((s) => solve(s * 1000))
    expect(best(list)).toBe(9000)
    expect(mean([...list, solve(1, 'dnf')])).toBeCloseTo(11666.67, 1)
    expect(rollingAverage(list, 5).slice(0, 4)).toEqual([null, null, null, null])
    // windows: [12,9,15,11,10] -> 11; [9,15,11,10,13] -> 11.33
    expect(bestAverage(list, 5)).toBe(11000)
  })
})

describe('time formatting', () => {
  it('singles truncate to hundredths, averages round', () => {
    expect(formatTime(9879)).toBe('9.87')
    expect(formatTime(9879, 'average')).toBe('9.88')
    expect(formatTime(75432)).toBe('1:15.43')
    expect(formatTime(DNF)).toBe('DNF')
    expect(formatTime(null)).toBe('-')
  })
  it('a +2 is marked', () => {
    expect(formatSolve(solve(9000, '+2'))).toBe('11.00+')
    expect(formatSolve(solve(9000, 'dnf'))).toBe('DNF')
  })
})

describe('timer state machine (hold to arm, release to start, press to stop)', () => {
  it('a full solve measures from release to press', () => {
    const s = run([
      { type: 'press', at: 0 },
      { type: 'tick', at: HOLD_MS + 1 },
      { type: 'release', at: 1000 },
      { type: 'tick', at: 5000 },
      { type: 'press', at: 13456 },
    ])
    expect(s.phase).toBe('stopped')
    expect(s.result).toBe(12456)
  })
  it('releasing before the hold time does not start', () => {
    const s = run([{ type: 'press', at: 0 }, { type: 'tick', at: HOLD_MS - 50 }, { type: 'release', at: HOLD_MS - 10 }])
    expect(s.phase).toBe('idle')
  })
  it('a quick tap never starts it, even if a late frame already showed ready', () => {
    // press at 0, the page was busy so the first frame ran at 400 ms, but the key went up at 100 ms
    const s = run([{ type: 'press', at: 0 }, { type: 'tick', at: 400 }, { type: 'release', at: 100 }])
    expect(s.phase).toBe('idle')
  })
  it('a hold released exactly at the hold time starts it', () => {
    expect(run([{ type: 'press', at: 0 }, { type: 'release', at: HOLD_MS }]).phase).toBe('running')
  })
  it('it only turns ready after the hold time', () => {
    expect(run([{ type: 'press', at: 0 }, { type: 'tick', at: HOLD_MS - 1 }]).phase).toBe('holding')
    expect(run([{ type: 'press', at: 0 }, { type: 'tick', at: HOLD_MS }]).phase).toBe('ready')
  })
  it('after stopping, the stopping key must be released before a new hold', () => {
    let s = run([{ type: 'press', at: 0 }, { type: 'tick', at: 400 }, { type: 'release', at: 500 }, { type: 'press', at: 2500 }])
    expect(s.phase).toBe('stopped')
    s = run([{ type: 'press', at: 2600 }], s) // still holding the key: ignored
    expect(s.phase).toBe('stopped')
    s = run([{ type: 'release', at: 2700 }, { type: 'press', at: 3000 }], s)
    expect(s.phase).toBe('holding')
    expect(s.result).toBe(2000) // the last result stays visible while holding
  })
  it('cancel (Escape) during a hold goes back without starting', () => {
    expect(run([{ type: 'press', at: 0 }, { type: 'tick', at: 400 }, { type: 'cancel' }]).phase).toBe('idle')
  })
})

describe('WCA inspection', () => {
  const inspectThenStart = (inspectFor: number) =>
    run([
      { type: 'press', at: 0, inspect: true },
      { type: 'release', at: 80 },
      { type: 'press', at: inspectFor - HOLD_MS - 10 },
      { type: 'release', at: inspectFor },
    ])

  it('a tap starts inspection, and its release does not arm the clock', () => {
    const s = run([{ type: 'press', at: 0, inspect: true }, { type: 'release', at: 500 }])
    expect(s.phase).toBe('inspecting')
    expect(s.inspectStart).toBe(0)
    expect(s.awaitRelease).toBe(false)
  })

  it('hold and release during inspection starts the solve, with no penalty inside 15 s', () => {
    const s = inspectThenStart(9000)
    expect(s.phase).toBe('running')
    expect(s.start).toBe(9000)
    expect(s.penalty).toBe('none')
    expect(s.inspectStart).toBeNull()
  })

  it('starting after 15 s is +2, after 17 s is DNF (WCA A3a / 10e)', () => {
    expect(inspectThenStart(15_000).penalty).toBe('none')
    expect(inspectThenStart(15_001).penalty).toBe('+2')
    expect(inspectThenStart(17_000).penalty).toBe('+2')
    expect(inspectThenStart(17_001).penalty).toBe('dnf')
    expect(inspectionPenalty(16_000)).toBe('+2')
  })

  it('the penalty stays with the solve once it is stopped', () => {
    const s = run([{ type: 'press', at: 26_000 }], inspectThenStart(16_000))
    expect(s.phase).toBe('stopped')
    expect(s.result).toBe(10_000)
    expect(s.penalty).toBe('+2')
  })

  it('an early release during inspection goes back to inspecting, not idle', () => {
    const s = run([
      { type: 'press', at: 0, inspect: true },
      { type: 'release', at: 50 },
      { type: 'press', at: 3000 },
      { type: 'release', at: 3100 },
    ])
    expect(s.phase).toBe('inspecting')
    expect(s.inspectStart).toBe(0)
  })

  it('Escape abandons inspection, even mid-hold', () => {
    const base = run([{ type: 'press', at: 0, inspect: true }, { type: 'release', at: 50 }])
    expect(run([{ type: 'cancel' }], base).phase).toBe('idle')
    expect(run([{ type: 'press', at: 2000 }, { type: 'cancel' }], base).phase).toBe('idle')
  })

  it('a normal start (inspection off) never carries a penalty', () => {
    const s = run([{ type: 'press', at: 0 }, { type: 'release', at: 20_000 }])
    expect(s.phase).toBe('running')
    expect(s.penalty).toBe('none')
  })

  it('the clock counts down, then shows +2 and DNF, with calls at 8 and 12 s', () => {
    expect(inspectionDisplay(0)).toEqual({ text: '15', stage: 'ok' })
    expect(inspectionDisplay(400)).toEqual({ text: '15', stage: 'ok' })
    expect(inspectionDisplay(8000)).toEqual({ text: '7', stage: '8' })
    expect(inspectionDisplay(12_500)).toEqual({ text: '3', stage: '12' })
    expect(inspectionDisplay(14_999).text).toBe('1')
    expect(inspectionDisplay(15_000)).toEqual({ text: '+2', stage: '+2' })
    expect(inspectionDisplay(17_001)).toEqual({ text: 'DNF', stage: 'dnf' })
  })
})

describe('releases', () => {
  it('releasing the stop key ends the wait even if it is not Space', () => {
    const running = run([{ type: 'press', at: 0 }, { type: 'release', at: 400 }])
    const s = run([{ type: 'press', at: 2000 }, { type: 'release', at: 2010, trigger: false }], running)
    expect(s.phase).toBe('stopped')
    expect(s.awaitRelease).toBe(false)
    // so the next Space works straight away
    expect(run([{ type: 'press', at: 3000 }], s).phase).toBe('holding')
  })
  it('a non-trigger key release never starts the clock', () => {
    const s = run([{ type: 'press', at: 0 }, { type: 'release', at: 500, trigger: false }])
    expect(s.phase).toBe('holding')
  })
})

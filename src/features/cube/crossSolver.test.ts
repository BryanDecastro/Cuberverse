import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState, type CubeState } from './model'
import { parseAlg, randomSequence } from './moves'
import { crossColor, isCrossSolved, isDaisy, petalCount, planCrossFromDaisy, planDaisy, planWhiteCross, solvedCrossEdges } from './crossSolver'
import { WC_CASES, WC_DAISY, WC_MIXED_DAISY, WC_HOLD } from '../learn/whiteCross/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const flat = (steps: ReturnType<typeof planWhiteCross>) => steps.flatMap((s) => s.moves)

/** Find the white edge sticker at a slot. */
function whiteAt(s: CubeState, pos: number[], normal: number[]) {
  const c = crossColor(s)
  return s.some((x) => x.color === c && x.pos.join() === pos.join() && x.normal.join() === normal.join())
}

describe('holding the cube yellow-up', () => {
  it('x2 puts white on the bottom and yellow on top', () => {
    const s = at(WC_HOLD)
    expect(crossColor(s)).toBe('U') // the white color id
    expect(isCrossSolved(s)).toBe(true)
  })
})

describe('lesson positions are what the copy says they are', () => {
  it('the full daisy has 4 petals', () => {
    expect(isDaisy(at(WC_DAISY))).toBe(true)
    expect(solvedCrossEdges(at(WC_DAISY))).toBe(0)
  })
  it('the mixed daisy has 4 petals, not all aligned', () => {
    const s = at(WC_MIXED_DAISY)
    expect(isDaisy(s)).toBe(true)
    expect(planCrossFromDaisy(s).some((x) => x.kind === 'align')).toBe(true)
  })
  it('case "bottom": white edge on the bottom front, facing down; the spot above is taken', () => {
    const s = at(WC_CASES.bottom.setup)
    expect(whiteAt(s, [0, -1, 1], [0, -1, 0])).toBe(true)
    expect(whiteAt(s, [0, 1, 1], [0, 1, 0])).toBe(true)
    expect(petalCount(s)).toBe(3)
  })
  it('case "middle": white edge between front and right, facing front; the spot above right is taken', () => {
    const s = at(WC_CASES.middle.setup)
    expect(whiteAt(s, [1, 0, 1], [0, 0, 1])).toBe(true)
    expect(whiteAt(s, [1, 1, 0], [0, 1, 0])).toBe(true)
    expect(petalCount(s)).toBe(3)
  })
  it('case "flipped": white edge on top front, white facing front', () => {
    const s = at(WC_CASES.flipped.setup)
    expect(whiteAt(s, [0, 1, 1], [0, 0, 1])).toBe(true)
    expect(petalCount(s)).toBe(3)
  })
  for (const [name, c] of Object.entries(WC_CASES)) {
    it(`case "${name}": the taught moves complete the daisy, and match the planner`, () => {
      const s = at(c.setup)
      expect(isDaisy(applyMoves(s, parseAlg(c.solution)))).toBe(true)
      expect(flat(planDaisy(s)).join(' ')).toBe(c.solution)
    })
  }
})

describe('the planner solves any scramble with the daisy method', () => {
  it('500 random scrambles: daisy, then a solved white cross', () => {
    let seed = 11
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    let longest = 0
    for (let i = 0; i < 500; i++) {
      const s = applyMoves(at(WC_HOLD), randomSequence(20, rand))
      const daisy = planDaisy(s)
      const mid = applyMoves(s, flat(daisy))
      expect(isDaisy(mid)).toBe(true)
      const all = planWhiteCross(s)
      const end = applyMoves(s, flat(all))
      expect(isCrossSolved(end)).toBe(true)
      longest = Math.max(longest, flat(all).length)
    }
    expect(longest).toBeLessThan(45)
  })
  it('taking only the first step and re-planning each time still finishes (how "Show me" works)', () => {
    let seed = 3
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < 300; i++) {
      let s = applyMoves(at(WC_HOLD), randomSequence(12, rand))
      let n = 0
      while (!isCrossSolved(s) && n < 60) {
        s = applyMoves(s, planWhiteCross(s)[0].moves)
        n++
      }
      expect(isCrossSolved(s)).toBe(true)
    }
  })
  it('a solved cross needs no steps', () => {
    expect(planWhiteCross(at(WC_HOLD))).toEqual([])
  })
})

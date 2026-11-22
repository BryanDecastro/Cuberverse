import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState } from './model'
import { parseAlg } from './moves'
import { isSecondLayerSolved } from './secondLayer'
import { EDGE_FLIP, isYellowCross, planYellowCross, seededRandom, topScramble, topShape } from './yellowCross'
import { YC_CASES, YC_DONE, YC_LINE_READY } from '../learn/yellowCross/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const kinds = (moves: string) => planYellowCross(at(moves)).map((p) => p.kind)

describe('F R U R\' U\' F\' keeps the first two layers', () => {
  it('stays two-layer solved after 1 to 6 repeats', () => {
    let s = at(YC_DONE)
    for (let i = 0; i < 6; i++) {
      s = applyMoves(s, EDGE_FLIP)
      expect(isSecondLayerSolved(s)).toBe(true)
    }
  })
})

describe('lesson positions match their descriptions', () => {
  it('the goal shows the yellow cross', () => expect(isYellowCross(at(YC_DONE))).toBe(true))
  it('dot case: no yellow edges up; goes dot, turn, L, line', () => {
    expect(topShape(at(YC_CASES.dot.setup))).toBe('dot')
    expect(isSecondLayerSolved(at(YC_CASES.dot.setup))).toBe(true)
    expect(kinds(YC_CASES.dot.setup)).toEqual(['dot', 'alignL', 'l', 'line'])
  })
  it('L case: an L that needs a top turn first', () => {
    expect(topShape(at(YC_CASES.l.setup))).toBe('l')
    expect(kinds(YC_CASES.l.setup)).toEqual(['alignL', 'l', 'line'])
  })
  it('the L shown in Part 1 already sits at the back-left (no top turn needed)', () => {
    expect(kinds(`${YC_CASES.l.setup} U'`)).toEqual(['l', 'line'])
  })
  it('line case: a line that needs a top turn first', () => {
    expect(topShape(at(YC_CASES.line.setup))).toBe('line')
    expect(kinds(YC_CASES.line.setup)).toEqual(['alignLine', 'line'])
  })
  it('the ready line needs only the algorithm', () => {
    expect(kinds(YC_LINE_READY)).toEqual(['line'])
    expect(isYellowCross(applyMoves(at(YC_LINE_READY), EDGE_FLIP))).toBe(true)
  })
})

describe('the planner always reaches the yellow cross', () => {
  it('500 mixes: the shape only moves forward (dot, L, line, cross) and two layers stay solved', () => {
    const order: Record<string, number> = { dot: 0, l: 1, line: 2, cross: 3 }
    const rand = seededRandom(3)
    for (let i = 0; i < 500; i++) {
      let s = applyMoves(solvedState(), topScramble(rand))
      for (const step of planYellowCross(s)) {
        const before = topShape(s)
        s = applyMoves(s, step.moves)
        expect(isSecondLayerSolved(s)).toBe(true)
        if (step.moves === EDGE_FLIP) expect(order[topShape(s)]).toBe(order[before] + 1)
      }
      expect(isYellowCross(s)).toBe(true)
    }
  })
  it('taking only the first step and re-planning each time still finishes', () => {
    const rand = seededRandom(6)
    for (let i = 0; i < 300; i++) {
      let s = applyMoves(solvedState(), topScramble(rand))
      let n = 0
      while (!isYellowCross(s) && n < 20) {
        s = applyMoves(s, planYellowCross(s)[0].moves)
        n++
      }
      expect(isYellowCross(s)).toBe(true)
    }
  })
})

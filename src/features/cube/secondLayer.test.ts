import { describe, expect, it } from 'vitest'
import { applyMoves, centerColor, solvedState, type CubeState } from './model'
import { parseAlg } from './moves'
import { isFirstLayerSolved } from './firstLayer'
import { isSecondLayerSolved, LEFT_ALG, middleScramble, planSecondLayer, RIGHT_ALG, seededRandom, solvedMiddleEdges } from './secondLayer'
import { SL_CASES, SL_DONE, SL_FULL } from '../learn/secondLayer/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const flat = (steps: { moves: string[] }[]) => steps.flatMap((s) => s.moves) as ReturnType<typeof parseAlg>

/** The edge at top-front: [front sticker color, top sticker color]. */
function topFront(s: CubeState) {
  const f = s.find((x) => x.pos.join() === '0,1,1' && x.normal.join() === '0,0,1')!
  const u = s.find((x) => x.pos.join() === '0,1,1' && x.normal.join() === '0,1,0')!
  return { front: f.color, top: u.color }
}

describe('the two algorithms keep the first layer', () => {
  for (const [name, alg] of [['right', RIGHT_ALG], ['left', LEFT_ALG]] as const) {
    it(`${name}: the first layer stays solved, even after 6 repeats in a row`, () => {
      let s = at(SL_DONE)
      for (let i = 0; i < 6; i++) {
        s = applyMoves(s, alg)
        expect(isFirstLayerSolved(s)).toBe(true)
      }
    })
  }
})

describe('lesson positions match their descriptions', () => {
  it('the goal has both layers solved', () => expect(isSecondLayerSolved(at(SL_DONE))).toBe(true))
  it('case "right": upside-down T on the front, top color matches the right center', () => {
    const s = at(SL_CASES.right.setup)
    const e = topFront(s)
    expect(isFirstLayerSolved(s)).toBe(true)
    expect(solvedMiddleEdges(s)).toBe(3)
    expect(e.front).toBe(centerColor(s, 'F'))
    expect(e.top).toBe(centerColor(s, 'R'))
    expect(flat(planSecondLayer(s)).join(' ')).toBe(RIGHT_ALG.join(' '))
  })
  it('case "left": upside-down T on the front, top color matches the left center', () => {
    const s = at(SL_CASES.left.setup)
    const e = topFront(s)
    expect(e.front).toBe(centerColor(s, 'F'))
    expect(e.top).toBe(centerColor(s, 'L'))
    expect(flat(planSecondLayer(s)).join(' ')).toBe(LEFT_ALG.join(' '))
  })
  it('case "stuck": the front-right edge is in its slot but flipped; the plan pops it out first', () => {
    const s = at(SL_CASES.stuck.setup)
    const fr = s.filter((x) => x.pos.join() === '1,0,1')
    expect(fr.map((x) => x.color).sort()).toEqual([centerColor(s, 'F'), centerColor(s, 'R')].sort())
    expect(fr.every((x) => x.color !== centerColor(s, x.normal[0] === 1 ? 'R' : 'F'))).toBe(true)
    const plan = planSecondLayer(s)
    expect(plan[0].kind).toBe('eject')
    expect(isSecondLayerSolved(applyMoves(s, flat(plan)))).toBe(true)
  })
  it('the full demo has all four edges out and uses every kind of step', () => {
    const s = at(SL_FULL)
    expect(isFirstLayerSolved(s)).toBe(true)
    expect(solvedMiddleEdges(s)).toBe(0)
    expect([...new Set(planSecondLayer(s).map((p) => p.kind))].sort()).toEqual(['align', 'eject', 'left', 'right', 'turn'])
  })
})

describe('the planner finishes the second layer', () => {
  it('500 mixes, every step keeps the first layer', () => {
    const rand = seededRandom(4)
    for (let i = 0; i < 500; i++) {
      let s = applyMoves(solvedState(), middleScramble(rand))
      for (const step of planSecondLayer(s)) {
        s = applyMoves(s, step.moves)
        expect(isFirstLayerSolved(s)).toBe(true)
      }
      expect(isSecondLayerSolved(s)).toBe(true)
    }
  })
  it('taking only the first step and re-planning each time still finishes', () => {
    const rand = seededRandom(8)
    for (let i = 0; i < 300; i++) {
      let s = applyMoves(solvedState(), middleScramble(rand))
      let n = 0
      while (!isSecondLayerSolved(s) && n < 60) {
        s = applyMoves(s, planSecondLayer(s)[0].moves)
        n++
      }
      expect(isSecondLayerSolved(s)).toBe(true)
    }
  })
})

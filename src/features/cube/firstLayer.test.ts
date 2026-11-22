import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState, type CubeState } from './model'
import { parseAlg } from './moves'
import { crossColor, isCrossSolved } from './crossSolver'
import { cornerScramble, frontRightSolved, isFirstLayerSolved, planFirstLayer, seededRandom, SEXY, solvedCorners } from './firstLayer'
import { FL_CASES, FL_DONE, FL_FULL, FL_QUIZ_ALIGN, FL_QUIZ_INSERT } from '../learn/firstLayer/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const flat = (steps: { moves: string[] }[]) => steps.flatMap((s) => s.moves) as ReturnType<typeof parseAlg>

/** Where the white sticker of the corner at front-right-top faces, or null if no white corner is there. */
function whiteAtTopFrontRight(s: CubeState): string | null {
  const c = crossColor(s)
  const st = s.find((x) => x.color === c && x.pos.join() === '1,1,1')
  if (!st) return null
  return { '1,0,0': 'right', '0,1,0': 'up', '0,0,1': 'front' }[st.normal.join()] ?? 'other'
}

describe('R U R\' U\' keeps the rest of the bottom layer', () => {
  it('after any number of rounds the cross and the other three corners stay solved', () => {
    for (let k = 1; k <= 6; k++) {
      const s = applyMoves(at(FL_DONE), Array.from({ length: k }, () => SEXY).flat())
      expect(isCrossSolved(s)).toBe(true)
      expect(solvedCorners(s)).toBeGreaterThanOrEqual(3)
    }
  })
  it('six rounds bring the cube back to where it started', () => {
    expect(isFirstLayerSolved(applyMoves(at(FL_DONE), Array.from({ length: 6 }, () => SEXY).flat()))).toBe(true)
  })
})

describe('lesson positions match their descriptions', () => {
  it('the goal is a solved first layer', () => expect(isFirstLayerSolved(at(FL_DONE))).toBe(true))
  for (const [name, dir] of [['right', 'right'], ['up', 'up'], ['front', 'front']] as const) {
    it(`case "${name}": white corner above its spot, white facing ${dir}`, () => {
      const s = at(FL_CASES[name].setup)
      expect(isCrossSolved(s)).toBe(true)
      expect(whiteAtTopFrontRight(s)).toBe(dir)
      expect(solvedCorners(s)).toBe(3)
    })
  }
  it('case "stuck": the corner is in its spot but twisted, nothing white on top front-right', () => {
    const s = at(FL_CASES.stuck.setup)
    expect(whiteAtTopFrontRight(s)).toBeNull()
    expect(frontRightSolved(s)).toBe(false)
    expect(solvedCorners(s)).toBe(3)
  })
  for (const [name, c] of Object.entries(FL_CASES)) {
    it(`case "${name}": the planner uses ${c.rounds} round(s) of R U R' U'`, () => {
      const plan = planFirstLayer(at(c.setup))
      expect(plan.filter((p) => p.kind === 'insert')).toHaveLength(c.rounds)
      expect(plan.some((p) => p.kind === 'eject')).toBe(name === 'stuck')
      expect(isFirstLayerSolved(applyMoves(at(c.setup), flat(plan)))).toBe(true)
    })
  }
  it('the full demo has all four corners out and uses every kind of step', () => {
    const s = at(FL_FULL)
    expect(isCrossSolved(s)).toBe(true)
    expect(solvedCorners(s)).toBe(0)
    const kinds = new Set(planFirstLayer(s).map((p) => p.kind))
    expect([...kinds].sort()).toEqual(['align', 'eject', 'insert', 'turn'])
  })
  it('quiz 3: one R U R\' U\' places the corner', () => {
    expect(frontRightSolved(applyMoves(at(FL_QUIZ_INSERT), SEXY))).toBe(true)
  })
  it("quiz 4: U then one R U R' U' places the corner, and the planner agrees", () => {
    expect(isFirstLayerSolved(applyMoves(at(FL_QUIZ_ALIGN), parseAlg("U R U R' U'")))).toBe(true)
    expect(flat(planFirstLayer(at(FL_QUIZ_ALIGN))).join(' ')).toBe("U R U R' U'")
  })
})

describe('the planner finishes the first layer from any cross-solved scramble', () => {
  it('500 scrambles, every step keeps the cross', () => {
    const rand = seededRandom(5)
    for (let i = 0; i < 500; i++) {
      let s = applyMoves(solvedState(), cornerScramble(rand))
      for (const step of planFirstLayer(s)) {
        s = applyMoves(s, step.moves)
        expect(isCrossSolved(s)).toBe(true)
      }
      expect(isFirstLayerSolved(s)).toBe(true)
    }
  })
  it('taking only the first step and re-planning each time still finishes', () => {
    const rand = seededRandom(9)
    for (let i = 0; i < 300; i++) {
      let s = applyMoves(solvedState(), cornerScramble(rand))
      let n = 0
      while (!isFirstLayerSolved(s) && n < 80) {
        s = applyMoves(s, planFirstLayer(s)[0].moves)
        n++
      }
      expect(isFirstLayerSolved(s)).toBe(true)
    }
  })
})

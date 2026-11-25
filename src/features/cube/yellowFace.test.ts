import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState, type CubeState } from './model'
import { parseAlg, type Move } from './moves'
import { isSecondLayerSolved } from './secondLayer'
import { isYellowCross } from './yellowCross'
import {
  cornersUp,
  cornerTwistScramble,
  holdFor,
  isYellowFace,
  planYellowFace,
  readyForSune,
  seededRandom,
  SUNE,
  topCorners,
  yellowDir,
} from './yellowFace'
import { YF_CASE_IDS, YF_CASES, YF_DONE, YF_FULL, YF_MIX, YF_TURN_TASK } from '../learn/yellowFace/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]
const key = (s: CubeState) => JSON.stringify(topCorners(s))

/** Every top reachable with Sunes and top turns: all 27 corner orientations. */
function allTops(): CubeState[] {
  const seen = new Map<string, CubeState>()
  let frontier = [at('x2')]
  seen.set(key(frontier[0]), frontier[0])
  while (frontier.length) {
    const next: CubeState[] = []
    for (const s of frontier)
      for (const t of TURNS) {
        const n = applyMoves(s, [...t, ...SUNE])
        if (!seen.has(key(n))) {
          seen.set(key(n), n)
          next.push(n)
        }
      }
    frontier = next
  }
  return [...seen.values()]
}

describe('the Sune', () => {
  it('is R U R′ U R U2 R′ and never touches the first two layers', () => {
    expect(SUNE.join(' ')).toBe("R U R' U R U2 R'")
    const rand = seededRandom(3)
    for (let i = 0; i < 50; i++) {
      const s = applyMoves(at(cornerTwistScramble(rand).join(' ')), SUNE)
      expect(isSecondLayerSolved(s) && isYellowCross(s)).toBe(true)
    }
  })
  it('six Sunes in a row bring the cube back', () => {
    expect(isYellowFace(applyMoves(at(YF_DONE), Array.from({ length: 6 }, () => SUNE).flat()))).toBe(true)
  })
})

describe('the rule finishes every possible top', () => {
  const tops = allTops()
  it('there are 27 corner orientations (the solved one included)', () => expect(tops.length).toBe(27))

  it('for every top, a top turn reaches the Sune position', () => {
    for (const s of tops) {
      if (cornersUp(s) === 4) continue
      expect(TURNS.some((t) => readyForSune(applyMoves(s, t)))).toBe(true)
    }
  })

  it('whichever valid top turn the learner picks, it is done within three Sunes', () => {
    const finishes = (s: CubeState, left: number): boolean => {
      if (cornersUp(s) === 4) return true
      if (!left) return false
      const opts = TURNS.filter((t) => readyForSune(applyMoves(s, t)))
      return opts.length > 0 && opts.every((t) => finishes(applyMoves(s, [...t, ...SUNE]), left - 1))
    }
    for (const s of tops) expect(finishes(s, 3)).toBe(true)
  })

  it('the planner follows the rule and always finishes', () => {
    for (const s of tops) {
      let cur = s
      for (const step of planYellowFace(s)) {
        if (step.kind === 'sune') expect(readyForSune(cur)).toBe(true)
        cur = applyMoves(cur, step.moves)
      }
      expect(isYellowFace(cur)).toBe(true)
    }
  })
})

describe('the seven cases shown in the lesson', () => {
  it('each one is held ready for the Sune and looks as drawn', () => {
    for (const id of YF_CASE_IDS) {
      const c = YF_CASES[id]
      const s = at(c.setup)
      expect(isSecondLayerSolved(s) && isYellowCross(s), id).toBe(true)
      expect(cornersUp(s), id).toBe(c.up)
      expect(topCorners(s), id).toEqual(c.top)
      expect(yellowDir(s, 'FL'), id).toBe(holdFor(c.up))
      expect(planYellowFace(s).filter((p) => p.kind === 'sune').length, id).toBe(c.sunes)
      expect(planYellowFace(s)[0].kind, id).toBe('sune') // already held right: no turn first
    }
  })
  it('the seven cases are all different, and together with the turns cover every top', () => {
    const shapes = new Set<string>()
    for (const id of YF_CASE_IDS) {
      const s = at(YF_CASES[id].setup)
      // a case's shape is the set of its four rotations
      shapes.add(TURNS.map((t) => key(applyMoves(s, t))).sort().join('|'))
    }
    expect(shapes.size).toBe(7)
    const covered = new Set([...shapes].flatMap((x) => x.split('|')))
    for (const s of allTops()) if (cornersUp(s) < 4) expect(covered.has(key(s))).toBe(true)
  })
  it('the goal, the full demo and the quiz position', () => {
    expect(isYellowFace(at(YF_DONE))).toBe(true)
    expect(cornersUp(at(YF_FULL))).toBe(0)
    expect(isYellowFace(at(YF_MIX))).toBe(false)
    const q = at(YF_TURN_TASK)
    expect(cornersUp(q)).toBe(2)
    expect(readyForSune(q)).toBe(false)
    expect(TURNS.filter((t) => readyForSune(applyMoves(q, t)))).toEqual([["U'"]])
  })
})

describe('practice mixes', () => {
  it('500 mixes: the plan always ends with a yellow top and both layers intact', () => {
    const rand = seededRandom(2)
    for (let i = 0; i < 500; i++) {
      let s = at(cornerTwistScramble(rand).join(' '))
      const plan = planYellowFace(s)
      expect(plan.filter((p) => p.kind === 'sune').length).toBeLessThanOrEqual(3)
      for (const p of plan) s = applyMoves(s, p.moves)
      expect(isYellowFace(s)).toBe(true)
    }
  })
  it('re-planning after every step still finishes', () => {
    const rand = seededRandom(5)
    for (let i = 0; i < 300; i++) {
      let s = at(cornerTwistScramble(rand).join(' '))
      let n = 0
      while (!isYellowFace(s) && n < 10) {
        s = applyMoves(s, planYellowFace(s)[0].moves)
        n++
      }
      expect(isYellowFace(s)).toBe(true)
    }
  })
})

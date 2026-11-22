/**
 * Beginner yellow face (corner orientation of the last layer), held yellow on top.
 *
 *   1. Put a twisted corner (yellow facing sideways) at the top front-right.
 *   2. Repeat R' D' R D until its yellow faces up (2 or 4 rounds).
 *   3. Turn ONLY the top (U) to bring the next twisted corner to the front-right.
 *      Never turn the whole cube during this step.
 * The bottom two layers look broken in the middle and come back by themselves
 * once the last corner is done. Tests: yellowFace.test.ts.
 */
import { applyMoves, solvedState, centerColor, type CubeState } from './model'
import { isSecondLayerSolved, seededRandom } from './secondLayer'
import { isYellowCross } from './yellowCross'
import { parseAlg, type Move } from './moves'

export const TWIST: Move[] = parseAlg("R' D' R D")
const SUNE: Move[] = parseAlg("R U R' U R U2 R'")
const ANTI_SUNE: Move[] = parseAlg("R U2 R' U' R U' R'")

export type FaceStepKind = 'twist' | 'next'
export type FaceStep = { kind: FaceStepKind; moves: Move[]; round?: number }

const CORNERS = ['1,1,1', '-1,1,1', '1,1,-1', '-1,1,-1']

function yellowUpAt(state: CubeState, pos: string): boolean {
  const yellow = centerColor(state, 'U')
  return state.some((s) => s.pos.join() === pos && s.normal[1] === 1 && s.color === yellow)
}

/** Does the corner at the top front-right show yellow on top? */
export function frontRightUp(state: CubeState): boolean {
  return yellowUpAt(state, '1,1,1')
}

/** Which way the yellow of the top front-right corner faces. */
export function frontRightYellow(state: CubeState): 'up' | 'right' | 'front' {
  const yellow = centerColor(state, 'U')
  const s = state.find((x) => x.pos.join() === '1,1,1' && x.color === yellow)
  if (!s) throw new Error('No yellow on the front-right corner')
  return s.normal[1] === 1 ? 'up' : s.normal[0] === 1 ? 'right' : 'front'
}

export function cornersUp(state: CubeState): number {
  return CORNERS.filter((p) => yellowUpAt(state, p)).length
}

/** The whole top is yellow and the first two layers are back in place. */
export function isYellowFace(state: CubeState): boolean {
  return isYellowCross(state) && cornersUp(state) === 4 && isSecondLayerSolved(state)
}

const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]

/**
 * Works from the start AND from any point in the middle (when the bottom looks
 * broken), as long as the learner only used R' D' R D at the front-right and U turns.
 */
export function planYellowFace(start: CubeState): FaceStep[] {
  if (!isYellowCross(start)) throw new Error('The yellow face needs the yellow cross')
  const steps: FaceStep[] = []
  let state = start
  let round = 0
  for (let guard = 0; guard < 30 && cornersUp(state) < 4; guard++) {
    if (!yellowUpAt(state, '1,1,1')) {
      round += 1
      if (round > 5) throw new Error('Corner did not turn up within 5 rounds')
      steps.push({ kind: 'twist', moves: TWIST, round })
      state = applyMoves(state, TWIST)
    } else {
      round = 0
      const u = TURNS.find((m) => m.length && !yellowUpAt(applyMoves(state, m), '1,1,1'))!
      steps.push({ kind: 'next', moves: u })
      state = applyMoves(state, u)
    }
  }
  if (!isYellowFace(state)) throw new Error('Yellow face planner did not finish with the bottom restored')
  return steps
}

/** A practice mix: two layers solved, yellow cross on top, corners twisted. */
function cornerTwistScrambleOnce(rand: () => number, rounds: number): Move[] {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const out: Move[] = ['x2']
  for (let i = 0; i < rounds; i++) out.push(...pick(TURNS), ...(rand() < 0.5 ? SUNE : ANTI_SUNE))
  out.push(...pick(TURNS))
  return out
}

export { seededRandom }

/** Same mix, but never one that cancelled itself out into an already-finished step. */
export function cornerTwistScramble(rand: () => number = Math.random, rounds = 4): Move[] {
  for (;;) {
    const m = cornerTwistScrambleOnce(rand, rounds)
    if (!isYellowFace(applyMoves(solvedState(), m))) return m
  }
}

/**
 * Beginner yellow cross (edge orientation of the last layer), held yellow on top.
 *
 * Look only at the four top edges: which ones show yellow on top?
 *   dot   (none)            -> F R U R' U' F'  (becomes an L)
 *   L     (two neighbours)  -> turn U so the L sits back-left, then F R U R' U' F' (becomes a line)
 *   line  (two opposite)    -> turn U so it runs left-right, then F R U R' U' F' (becomes the cross)
 *   cross (all four)        -> done
 *
 * The algorithm keeps the first two layers. Side colors of the top edges do
 * not matter yet. Tests: yellowCross.test.ts.
 */
import { applyMoves, solvedState, centerColor, type CubeState } from './model'
import { isSecondLayerSolved, seededRandom } from './secondLayer'
import { parseAlg, type Move } from './moves'

export const EDGE_FLIP: Move[] = parseAlg("F R U R' U' F'")
const SUNE: Move[] = parseAlg("R U R' U R U2 R'")

/** 'mixed' only happens partway through an algorithm (1 or 3 yellow edges up). */
export type TopShape = 'dot' | 'l' | 'line' | 'cross' | 'mixed'
export type YellowStepKind = 'alignL' | 'alignLine' | 'dot' | 'l' | 'line'
export type YellowStep = { kind: YellowStepKind; moves: Move[] }

/** Top-edge slots, by direction: back, right, front, left. */
const SLOTS = { b: '0,1,-1', r: '1,1,0', f: '0,1,1', l: '-1,1,0' } as const

function upEdges(state: CubeState): Set<keyof typeof SLOTS> {
  const yellow = centerColor(state, 'U')
  const out = new Set<keyof typeof SLOTS>()
  for (const [k, pos] of Object.entries(SLOTS) as [keyof typeof SLOTS, string][]) {
    if (state.some((s) => s.pos.join() === pos && s.normal[1] === 1 && s.color === yellow)) out.add(k)
  }
  return out
}

export function topShape(state: CubeState): TopShape {
  const up = upEdges(state)
  if (up.size === 4) return 'cross'
  if (up.size === 0) return 'dot'
  if (up.size !== 2) return 'mixed'
  return (up.has('l') && up.has('r')) || (up.has('f') && up.has('b')) ? 'line' : 'l'
}

/** Ready for the algorithm: L at back-left, or the line left-to-right. */
function placed(state: CubeState): boolean {
  const up = upEdges(state)
  const shape = topShape(state)
  if (shape === 'l') return up.has('b') && up.has('l')
  if (shape === 'line') return up.has('l') && up.has('r')
  return true
}

export function isYellowCross(state: CubeState): boolean {
  return topShape(state) === 'cross'
}

const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]

export function planYellowCross(start: CubeState): YellowStep[] {
  if (!isSecondLayerSolved(start)) throw new Error('The yellow cross needs two solved layers')
  const steps: YellowStep[] = []
  let state = start
  for (let guard = 0; guard < 6 && !isYellowCross(state); guard++) {
    const shape = topShape(state)
    if (shape === 'mixed') throw new Error('Plan from a finished algorithm, not from the middle of one')
    if (shape !== 'dot') {
      const u = TURNS.find((m) => placed(applyMoves(state, m)))!
      if (u.length) {
        steps.push({ kind: shape === 'l' ? 'alignL' : 'alignLine', moves: u })
        state = applyMoves(state, u)
      }
    }
    steps.push({ kind: shape as 'dot' | 'l' | 'line', moves: EDGE_FLIP })
    state = applyMoves(state, EDGE_FLIP)
  }
  if (!isYellowCross(state) || !isSecondLayerSolved(state)) throw new Error('Yellow cross planner did not finish')
  return steps
}

/** A practice mix that keeps two layers solved and scrambles the top. */
function topScrambleOnce(rand: () => number, rounds: number): Move[] {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const out: Move[] = ['x2']
  for (let i = 0; i < rounds; i++) out.push(...pick(TURNS), ...(rand() < 0.5 ? EDGE_FLIP : SUNE))
  out.push(...pick(TURNS))
  return out
}

export { seededRandom }

/** Same mix, but never one that cancelled itself out into an already-finished step. */
export function topScramble(rand: () => number = Math.random, rounds = 5): Move[] {
  for (;;) {
    const m = topScrambleOnce(rand, rounds)
    if (!isYellowCross(applyMoves(solvedState(), m))) return m
  }
}

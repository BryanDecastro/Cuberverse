/**
 * Beginner final solve (permutation of the last layer), held yellow on top
 * with the whole yellow face done.
 *
 * Corners:
 *   Find "headlights": two top corners on one side showing the same color.
 *   Turn the top so they are at the BACK, then  R' F R' B2 R F' R' B2 R2.
 *   No headlights? Do the algorithm once from anywhere; headlights appear.
 *   Then turn the top until the corners match the centers.
 * Edges:
 *   Find a finished side (corners and edge all match). Turn the whole cube so it
 *   is at the BACK, then  R U' R U R U R U' R' U' R2  (once or twice).
 *   No finished side? Do it once; one appears.
 *
 * Both algorithms keep the first two layers and the yellow face.
 * Tests: lastLayer.test.ts.
 */
import { applyMoves, centerColor, FACE_NORMAL, solvedState, type CubeState, type Vec3 } from './model'
import { isYellowFace, seededRandom } from './yellowFace'
import { parseAlg, type Face, type Move } from './moves'

export const CORNER_SWAP: Move[] = parseAlg("R' F R' B2 R F' R' B2 R2")
export const EDGE_CYCLE: Move[] = parseAlg("R U' R U R U R U' R' U' R2")

export type LastStepKind = 'alignHeadlights' | 'corners' | 'cornersAny' | 'alignCorners' | 'turnBar' | 'edges' | 'edgesAny'
export type LastStep = { kind: LastStepKind; moves: Move[]; round?: number }

const SIDES: Face[] = ['F', 'R', 'B', 'L']
const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]
const ROTS: Move[][] = [[], ['y'], ['y2'], ["y'"]]

/** Every face shows one color. Works however the cube is held. */
export function isCubeSolved(state: CubeState): boolean {
  return (Object.keys(FACE_NORMAL) as Face[]).every((f) => {
    const n = FACE_NORMAL[f]
    const c = centerColor(state, f)
    return state.filter((s) => s.normal.every((v, i) => v === n[i])).every((s) => s.color === c)
  })
}

/** The colors a top-layer side face shows on its three stickers: [left corner, edge, right corner] as seen from outside. */
function topRow(state: CubeState, side: Face): [Face, Face, Face] {
  const n = FACE_NORMAL[side]
  const at = (p: Vec3) => state.find((s) => s.pos.every((v, i) => v === p[i]) && s.normal.every((v, i) => v === n[i]))!.color
  // Two corners and the edge of this side in the top layer.
  const other: Vec3 = n[0] !== 0 ? [0, 0, 1] : [1, 0, 0]
  const base: Vec3 = [n[0], 1, n[2]]
  const a = at([base[0] - other[0], 1, base[2] - other[2]])
  const e = at(base)
  const b = at([base[0] + other[0], 1, base[2] + other[2]])
  return [a, e, b]
}

const headlightsOn = (s: CubeState, side: Face) => {
  const [a, , b] = topRow(s, side)
  return a === b
}

/** Corners are in the right places relative to each other (one top turn from matching). */
export function cornersPlaced(state: CubeState): boolean {
  return SIDES.every((f) => headlightsOn(state, f))
}

/** Corners match the centers below them. */
function cornersMatch(state: CubeState): boolean {
  return SIDES.every((f) => {
    const [a, , b] = topRow(state, f)
    const c = centerColor(state, f)
    return a === c && b === c
  })
}

/** A side whose whole top row matches its center. */
const sideFinished = (s: CubeState, side: Face) => topRow(s, side).every((c) => c === centerColor(s, side))

export function finishedSides(state: CubeState): number {
  return SIDES.filter((f) => sideFinished(state, f)).length
}

export function planLastLayer(start: CubeState): LastStep[] {
  if (!isYellowFace(start)) throw new Error('The final step needs the yellow face')
  const steps: LastStep[] = []
  let state = start
  const push = (kind: LastStepKind, moves: Move[], round?: number) => {
    if (!moves.length) return
    steps.push({ kind, moves, ...(round ? { round } : {}) })
    state = applyMoves(state, moves)
  }

  // Corners
  for (let guard = 0; guard < 4 && !cornersPlaced(state); guard++) {
    const u = TURNS.find((m) => headlightsOn(applyMoves(state, m), 'B'))
    if (u) {
      push('alignHeadlights', u)
      push('corners', CORNER_SWAP)
    } else {
      push('cornersAny', CORNER_SWAP)
    }
  }
  if (!cornersPlaced(state)) throw new Error('Corners not placed')
  push('alignCorners', TURNS.find((m) => cornersMatch(applyMoves(state, m)))!)

  // Edges
  let round = 0
  for (let guard = 0; guard < 4 && !isCubeSolved(state); guard++) {
    const y = ROTS.find((m) => sideFinished(applyMoves(state, m), 'B'))
    if (y) {
      push('turnBar', y)
      round += 1
      push('edges', EDGE_CYCLE, round)
    } else {
      push('edgesAny', EDGE_CYCLE)
    }
  }
  if (!isCubeSolved(state)) throw new Error('Last layer planner did not finish')
  return steps
}

/** A practice mix: yellow face done, last layer pieces in the wrong places. */
function lastLayerScrambleOnce(rand: () => number, rounds: number): Move[] {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const out: Move[] = ['x2']
  for (let i = 0; i < rounds; i++) out.push(...pick(TURNS), ...pick(ROTS), ...(rand() < 0.5 ? CORNER_SWAP : EDGE_CYCLE))
  out.push(...pick(TURNS))
  return out
}

/** Same mix, but never one that is already solved. */
export function lastLayerScramble(rand: () => number = Math.random, rounds = 4): Move[] {
  for (;;) {
    const m = lastLayerScrambleOnce(rand, rounds)
    if (!isCubeSolved(applyMoves(solvedState(), m))) return m
  }
}

export { seededRandom }

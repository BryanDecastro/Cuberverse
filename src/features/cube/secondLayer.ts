/**
 * Beginner second layer: the four middle edges, held yellow on top.
 *
 * For each edge in the top layer that has no yellow:
 *   1. Turn U until its side color matches the center below it (an upside-down T).
 *   2. Turn the whole cube (y) so that side faces you.
 *   3. If its top color matches the RIGHT center: U R U' R' U' F' U F.
 *      If it matches the LEFT center:            U' L' U L U F U' F'.
 * An edge stuck in the middle layer (wrong slot or flipped) is turned to the
 * front-right with y and popped out with the right-hand algorithm.
 *
 * Both algorithms leave the white cross and the white corners in place.
 * Tests: secondLayer.test.ts.
 */
import { applyMoves, solvedState, centerColor, FACE_NORMAL, type CubeState, type Sticker, type Vec3 } from './model'
import { isFirstLayerSolved, seededRandom } from './firstLayer'
import { parseAlg, type Face, type Move } from './moves'

export const RIGHT_ALG: Move[] = parseAlg("U R U' R' U' F' U F")
export const LEFT_ALG: Move[] = parseAlg("U' L' U L U F U' F'")

export type EdgeStepKind = 'align' | 'turn' | 'right' | 'left' | 'eject'

export type EdgeStep = {
  kind: EdgeStepKind
  moves: Move[]
  /** The edge's two colors: [side/front color, top color] when on top. */
  colors: [Face, Face]
}

const eq = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
const faceAt = (n: Vec3) => (Object.keys(FACE_NORMAL) as Face[]).find((f) => eq(FACE_NORMAL[f], n))!

type Edge = { pos: Vec3; a: Sticker; b: Sticker }

/** Edges with neither the top (yellow) nor the bottom (white) color: the middle-layer edges. */
function middleEdges(state: CubeState): Edge[] {
  const top = centerColor(state, 'U')
  const bottom = centerColor(state, 'D')
  const byPos = new Map<string, Sticker[]>()
  for (const s of state) {
    if (s.pos.filter((v) => v === 0).length !== 1) continue
    const k = s.pos.join()
    byPos.set(k, [...(byPos.get(k) ?? []), s])
  }
  const out: Edge[] = []
  for (const [a, b] of byPos.values()) {
    if ([a.color, b.color].some((c) => c === top || c === bottom)) continue
    out.push({ pos: a.pos, a, b })
  }
  return out
}

const idOf = (e: Edge) => [e.a.color, e.b.color].sort().join('')

function isEdgeSolved(state: CubeState, e: Edge): boolean {
  return e.pos[1] === 0 && [e.a, e.b].every((s) => s.color === centerColor(state, faceAt(s.normal)))
}

export function solvedMiddleEdges(state: CubeState): number {
  return middleEdges(state).filter((e) => isEdgeSolved(state, e)).length
}

export function isSecondLayerSolved(state: CubeState): boolean {
  return isFirstLayerSolved(state) && solvedMiddleEdges(state) === 4
}

const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]
const ROTS: Move[][] = [[], ['y'], ['y2'], ["y'"]]
const find = (state: CubeState, id: string) => middleEdges(state).find((e) => idOf(e) === id)!
/** On top: [side sticker, top sticker]. */
const split = (e: Edge): [Sticker, Sticker] => (e.a.normal[1] === 1 ? [e.b, e.a] : [e.a, e.b])

export function planSecondLayer(start: CubeState): EdgeStep[] {
  if (!isFirstLayerSolved(start)) throw new Error('The second layer needs a solved first layer')
  const steps: EdgeStep[] = []
  let state = start
  const push = (kind: EdgeStepKind, moves: Move[], colors: [Face, Face]) => {
    if (!moves.length) return
    steps.push({ kind, moves, colors })
    state = applyMoves(state, moves)
  }

  for (let guard = 0; guard < 12 && solvedMiddleEdges(state) < 4; guard++) {
    const open = middleEdges(state).filter((e) => !isEdgeSolved(state, e))
    const top = open.find((e) => e.pos[1] === 1)
    if (top) {
      const id = idOf(top)
      // 1. Side color over its own center.
      const u = TURNS.find((m) => {
        const s = applyMoves(state, m)
        const [side] = split(find(s, id))
        return side.color === centerColor(s, faceAt(side.normal))
      })!
      const [side0, top0] = split(find(applyMoves(state, u), id))
      const colors: [Face, Face] = [side0.color, top0.color]
      push('align', u, colors)
      // 2. That side to the front.
      const y = ROTS.find((m) => {
        const [side] = split(find(applyMoves(state, m), id))
        return eq(side.normal, [0, 0, 1])
      })!
      push('turn', y, colors)
      // 3. Right or left, by the top color.
      const [, topSticker] = split(find(state, id))
      const goesRight = topSticker.color === centerColor(state, 'R')
      push(goesRight ? 'right' : 'left', goesRight ? RIGHT_ALG : LEFT_ALG, colors)
      if (!isEdgeSolved(state, find(state, id))) throw new Error('Edge not placed')
    } else {
      // Stuck in the middle layer: bring its slot to front-right and pop it out.
      const e = open[0]
      const id = idOf(e)
      const colors: [Face, Face] = [e.a.color, e.b.color]
      const y = ROTS.find((m) => eq(find(applyMoves(state, m), id).pos, [1, 0, 1]))!
      push('turn', y, colors)
      push('eject', RIGHT_ALG, colors)
    }
  }
  if (!isSecondLayerSolved(state)) throw new Error('Second layer planner did not finish')
  return steps
}

/** A practice mix that keeps the first layer: top turns, whole-cube turns and the two algorithms. */
function middleScrambleOnce(rand: () => number, rounds: number): Move[] {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const out: Move[] = ['x2']
  for (let i = 0; i < rounds; i++) out.push(...pick(TURNS), ...pick(ROTS), ...(rand() < 0.5 ? RIGHT_ALG : LEFT_ALG))
  out.push(...pick(TURNS))
  return out
}

export { seededRandom }

/** Same mix, but never one that cancelled itself out into an already-finished step. */
export function middleScramble(rand: () => number = Math.random, rounds = 6): Move[] {
  for (;;) {
    const m = middleScrambleOnce(rand, rounds)
    if (!isSecondLayerSolved(applyMoves(solvedState(), m))) return m
  }
}

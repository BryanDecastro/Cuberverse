/**
 * Beginner first layer: the four white corners, held yellow on top.
 *
 * For each white corner:
 *   1. If it is in the top layer, turn U until it sits right above its spot
 *      (the bottom corner between the two centers matching its other colors).
 *   2. Turn the whole cube (y) so that spot is front-right-bottom.
 *   3. Repeat R U R' U' until the corner drops in, white facing down
 *      (1, 3 or 5 times depending on how it is twisted).
 * A white corner stuck in the bottom layer (wrong spot or twisted) is brought
 * to front-right with y, then popped out to the top with one R U R' U'.
 *
 * R U R' U' only disturbs the front-right-bottom corner of the bottom layer,
 * so the white cross and corners already placed stay put. Tests: firstLayer.test.ts.
 */
import { applyMoves, solvedState, centerColor, FACE_NORMAL, type CubeState, type Sticker, type Vec3 } from './model'
import { isCrossSolved, crossColor } from './crossSolver'
import { parseAlg, type Face, type Move } from './moves'

export type CornerStepKind = 'align' | 'turn' | 'insert' | 'eject'

export type CornerStep = {
  kind: CornerStepKind
  moves: Move[]
  /** The corner's two non-white colors (color ids), for explanations. */
  colors: [Face, Face]
  /** For 'insert': which round of R U R' U' this is (1-based). */
  round?: number
}

export const SEXY: Move[] = parseAlg("R U R' U'")
const FRONT_RIGHT: Vec3 = [1, -1, 1]

const eq = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

type Corner = { pos: Vec3; stickers: Sticker[]; white: Sticker; others: [Sticker, Sticker] }

function corners(state: CubeState): Corner[] {
  const c = crossColor(state)
  const byPos = new Map<string, Sticker[]>()
  for (const s of state) {
    if (s.pos.some((v) => v === 0)) continue
    const k = s.pos.join()
    byPos.set(k, [...(byPos.get(k) ?? []), s])
  }
  const out: Corner[] = []
  for (const stickers of byPos.values()) {
    const white = stickers.find((s) => s.color === c)
    if (!white) continue
    const others = stickers.filter((s) => s !== white) as [Sticker, Sticker]
    out.push({ pos: stickers[0].pos, stickers, white, others })
  }
  return out
}

/** Identify a corner across moves by its two non-white colors. */
const idOf = (k: Corner) => [k.others[0].color, k.others[1].color].sort().join('')
const colorsOf = (k: Corner) => [k.others[0].color, k.others[1].color].sort() as [Face, Face]

function sideWithCenter(state: CubeState, color: Face): Vec3 {
  const f = (['F', 'R', 'B', 'L'] as Face[]).find((x) => centerColor(state, x) === color)
  if (!f) throw new Error(`No side center of color ${color}`)
  return FACE_NORMAL[f]
}

/** The bottom slot this corner belongs in. */
function targetSlot(state: CubeState, k: Corner): Vec3 {
  const a = sideWithCenter(state, k.others[0].color)
  const b = sideWithCenter(state, k.others[1].color)
  return [a[0] + b[0], -1, a[2] + b[2]]
}

function isCornerSolved(state: CubeState, k: Corner): boolean {
  return (
    k.pos[1] === -1 &&
    k.white.normal[1] === -1 &&
    k.others.every((s) => s.color === centerColor(state, (Object.keys(FACE_NORMAL) as Face[]).find((f) => eq(FACE_NORMAL[f], s.normal))!))
  )
}

export function solvedCorners(state: CubeState): number {
  return corners(state).filter((k) => isCornerSolved(state, k)).length
}

/** White cross and all four white corners in place. */
export function isFirstLayerSolved(state: CubeState): boolean {
  return isCrossSolved(state) && solvedCorners(state) === 4
}

/** Is the corner at front-right-bottom solved? */
export function frontRightSolved(state: CubeState): boolean {
  return corners(state).some((k) => eq(k.pos, FRONT_RIGHT) && isCornerSolved(state, k))
}

const findCorner = (state: CubeState, id: string) => corners(state).find((k) => idOf(k) === id)!

const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]
const ROTS: Move[][] = [[], ['y'], ['y2'], ["y'"]]

/** Small deterministic generator (Park-Miller), so a seed always gives the same scramble. */
export function seededRandom(seed: number): () => number {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/**
 * A practice scramble that keeps the white cross solved but mixes the corners:
 * random top turns, whole-cube turns and rounds of R U R' U'. Starts held yellow-up.
 */
function cornerScrambleOnce(rand: () => number, rounds: number): Move[] {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const out: Move[] = ['x2']
  for (let i = 0; i < rounds; i++) {
    out.push(...pick(TURNS), ...pick(ROTS))
    const reps = 1 + Math.floor(rand() * 5)
    for (let r = 0; r < reps; r++) out.push(...SEXY)
  }
  out.push(...pick(TURNS))
  return out
}

export function planFirstLayer(start: CubeState): CornerStep[] {
  if (!isCrossSolved(start)) throw new Error('The first layer needs a solved white cross')
  const steps: CornerStep[] = []
  let state = start
  const push = (kind: CornerStepKind, moves: Move[], k: Corner, round?: number) => {
    if (!moves.length) return
    steps.push({ kind, moves, colors: colorsOf(k), ...(round ? { round } : {}) })
    state = applyMoves(state, moves)
  }

  for (let guard = 0; guard < 12 && solvedCorners(state) < 4; guard++) {
    const open = corners(state).filter((k) => !isCornerSolved(state, k))
    const top = open.find((k) => k.pos[1] === 1)
    const k = top ?? open[0]
    const id = idOf(k)

    if (top) {
      // 1. Above its own spot.
      const target = targetSlot(state, k)
      const u = TURNS.find((m) => {
        const kk = findCorner(applyMoves(state, m), id)
        return kk.pos[0] === target[0] && kk.pos[2] === target[2]
      })!
      push('align', u, k)
      // 2. Spot at front-right.
      const y = ROTS.find((m) => eq(targetSlot(applyMoves(state, m), findCorner(applyMoves(state, m), id)), FRONT_RIGHT))!
      push('turn', y, findCorner(state, id))
      // 3. R U R' U' until it drops in.
      for (let round = 1; round <= 5 && !isCornerSolved(state, findCorner(state, id)); round++) {
        push('insert', SEXY, findCorner(state, id), round)
      }
      if (!isCornerSolved(state, findCorner(state, id))) throw new Error('Corner did not drop in within 5 rounds')
    } else {
      // Stuck in the bottom: bring to front-right, pop it out.
      const y = ROTS.find((m) => eq(findCorner(applyMoves(state, m), id).pos, FRONT_RIGHT))!
      push('turn', y, k)
      push('eject', SEXY, findCorner(state, id))
    }
  }
  if (solvedCorners(state) < 4 || !isCrossSolved(state)) throw new Error('First layer planner did not finish')
  return steps
}

/** Same mix, but never one that cancelled itself out into an already-finished step. */
export function cornerScramble(rand: () => number = Math.random, rounds = 7): Move[] {
  for (;;) {
    const m = cornerScrambleOnce(rand, rounds)
    if (!isFirstLayerSolved(applyMoves(solvedState(), m))) return m
  }
}

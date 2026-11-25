/**
 * Beginner yellow face (corner orientation of the last layer) with the Sune,
 * held yellow on top:
 *
 *   Count the corners already showing yellow on top, then turn ONLY the top so
 *   the front-left corner is right for that count:
 *     0 on top  -> the front-left corner shows its yellow on the LEFT
 *     1 on top  -> that yellow-topped corner sits at the front-left
 *     2 on top  -> the front-left corner shows its yellow at the FRONT
 *   Do the Sune, R U R' U R U2 R', and look again. Repeat until the top is yellow.
 *
 * The Sune never disturbs the first two layers. Every one of the 27 possible tops
 * finishes in at most three Sunes, whichever valid top turn is picked
 * (proven in yellowFace.test.ts).
 */
import { applyMoves, solvedState, centerColor, type CubeState } from './model'
import { isSecondLayerSolved, seededRandom } from './secondLayer'
import { isYellowCross } from './yellowCross'
import { parseAlg, type Move } from './moves'

export const SUNE: Move[] = parseAlg("R U R' U R U2 R'")
const ANTI_SUNE: Move[] = parseAlg("R U2 R' U' R U' R'")

export type FaceStepKind = 'turn' | 'sune'
/** `up`: how many corners showed yellow on top when this step was planned. */
export type FaceStep = { kind: FaceStepKind; moves: Move[]; up: number }

export type CornerSpot = 'FL' | 'FR' | 'BR' | 'BL'
export type YellowDir = 'up' | 'left' | 'right' | 'front' | 'back'

/** Top corner positions, held yellow on top (x: right, y: up, z: toward you). */
export const CORNER_POS: Record<CornerSpot, string> = { FL: '-1,1,1', FR: '1,1,1', BR: '1,1,-1', BL: '-1,1,-1' }

/** Which way the yellow sticker of the corner at this spot faces. */
export function yellowDir(state: CubeState, spot: CornerSpot): YellowDir {
  const yellow = centerColor(state, 'U')
  const s = state.find((x) => x.pos.join() === CORNER_POS[spot] && x.color === yellow)
  if (!s) return 'up' // not a yellow corner here (the top is not built yet): treat as nothing to fix
  const [x, y, z] = s.normal
  return y === 1 ? 'up' : x === 1 ? 'right' : x === -1 ? 'left' : z === 1 ? 'front' : 'back'
}

/** The yellow directions of all four top corners. */
export function topCorners(state: CubeState): Record<CornerSpot, YellowDir> {
  return { FL: yellowDir(state, 'FL'), FR: yellowDir(state, 'FR'), BR: yellowDir(state, 'BR'), BL: yellowDir(state, 'BL') }
}

export function cornersUp(state: CubeState): number {
  const yellow = centerColor(state, 'U')
  return Object.values(CORNER_POS).filter((p) => state.some((s) => s.pos.join() === p && s.normal[1] === 1 && s.color === yellow)).length
}

/** Where the front-left corner's yellow must face before a Sune, for this many corners already up. */
export function holdFor(up: number): YellowDir {
  return up === 0 ? 'left' : up === 1 ? 'up' : 'front'
}

/** Is the cube held right for the next Sune? */
export function readyForSune(state: CubeState): boolean {
  const up = cornersUp(state)
  return up < 3 && yellowDir(state, 'FL') === holdFor(up)
}

/** The whole top is yellow and the first two layers are in place. */
export function isYellowFace(state: CubeState): boolean {
  return isYellowCross(state) && cornersUp(state) === 4 && isSecondLayerSolved(state)
}

const TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]

/** Plans from any top with the yellow cross and the first two layers done. */
export function planYellowFace(start: CubeState): FaceStep[] {
  if (!isYellowCross(start) || !isSecondLayerSolved(start)) throw new Error('The yellow face needs the yellow cross and two layers')
  const steps: FaceStep[] = []
  let state = start
  for (let guard = 0; guard < 4 && cornersUp(state) < 4; guard++) {
    const up = cornersUp(state)
    const turn = TURNS.find((m) => yellowDir(applyMoves(state, m), 'FL') === holdFor(up))
    if (!turn) throw new Error('No top turn gives the Sune position')
    if (turn.length) {
      steps.push({ kind: 'turn', moves: turn, up })
      state = applyMoves(state, turn)
    }
    steps.push({ kind: 'sune', moves: SUNE, up })
    state = applyMoves(state, SUNE)
  }
  if (!isYellowFace(state)) throw new Error('Yellow face planner did not finish')
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

/** Same mix, but never one that is already finished. */
export function cornerTwistScramble(rand: () => number = Math.random, rounds = 4): Move[] {
  for (;;) {
    const m = cornerTwistScrambleOnce(rand, rounds)
    if (!isYellowFace(applyMoves(solvedState(), m))) return m
  }
}

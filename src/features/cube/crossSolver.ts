/**
 * Beginner white cross, the daisy method, as a step-by-step planner.
 *
 * The learner holds the cube with the YELLOW center on top and the WHITE
 * center on the bottom. Phase 1 builds a "daisy": the four white edges around
 * the yellow center, white stickers facing up. Phase 2 turns the top until a
 * petal's side color matches the center below it, then turns that face twice
 * to drop it onto the white center.
 *
 * Every step is plain face turns, planned on the pure model, so the same plan
 * drives demos, hints and answer checks. Tests: crossSolver.test.ts.
 */
import { applyMoves, centerColor, FACE_NORMAL, type CubeState, type Sticker, type Vec3 } from './model'
import type { Face, Move } from './moves'

export type StepKind = 'free' | 'lower' | 'lift' | 'middle' | 'flip' | 'align' | 'drop'

export type CrossStep = {
  kind: StepKind
  moves: Move[]
  /** The side face this step is about (for explanations and camera). */
  face: Face | null
}

const eq = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

type Edge = { pos: Vec3; w: Sticker; other: Sticker }

/** The cross color is whatever center sits on the bottom (white, when held yellow-up). */
export function crossColor(state: CubeState): Face {
  return centerColor(state, 'D')
}

function whiteEdges(state: CubeState): Edge[] {
  const c = crossColor(state)
  const out: Edge[] = []
  for (const w of state) {
    if (w.color !== c) continue
    const zeros = w.pos.filter((v) => v === 0).length
    if (zeros !== 1) continue // edges have exactly one zero coordinate
    const other = state.find((s) => eq(s.pos, w.pos) && !eq(s.normal, w.normal))!
    out.push({ pos: w.pos, w, other })
  }
  return out
}

function sideFaceOf(n: Vec3): Face {
  return (Object.keys(FACE_NORMAL) as Face[]).find((f) => eq(FACE_NORMAL[f], n))!
}

const isPetal = (e: Edge) => e.pos[1] === 1 && e.w.normal[1] === 1

export function petalCount(state: CubeState): number {
  return whiteEdges(state).filter(isPetal).length
}

export function isDaisy(state: CubeState): boolean {
  return petalCount(state) === 4
}

/** White edges already on the bottom, white facing down, side color matching its center. */
export function solvedCrossEdges(state: CubeState): number {
  return whiteEdges(state).filter(
    (e) => e.pos[1] === -1 && e.w.normal[1] === -1 && e.other.color === centerColor(state, sideFaceOf(e.other.normal)),
  ).length
}

/** Is the cross edge under one side face in place (white down, side color matching)? */
export function crossEdgeSolvedOn(state: CubeState, side: Face): boolean {
  const n = FACE_NORMAL[side]
  const slot: Vec3 = [n[0], -1, n[2]]
  return whiteEdges(state).some(
    (e) => eq(e.pos, slot) && e.w.normal[1] === -1 && e.other.color === centerColor(state, side),
  )
}

export function isCrossSolved(state: CubeState): boolean {
  return solvedCrossEdges(state) === 4
}

const U_TURNS: Move[][] = [[], ['U'], ['U2'], ["U'"]]

/** Fewest U turns that make the top slot above `side` hold no petal. */
function freeSlotAbove(state: CubeState, side: Face): Move[] {
  const slot: Vec3 = [FACE_NORMAL[side][0], 1, FACE_NORMAL[side][2]]
  for (const u of U_TURNS) {
    const s = applyMoves(state, u)
    if (!whiteEdges(s).some((e) => eq(e.pos, slot) && isPetal(e))) return u
  }
  throw new Error('No free slot (daisy already complete?)')
}

/** Phase 1: plan the daisy. */
export function planDaisy(start: CubeState): CrossStep[] {
  const steps: CrossStep[] = []
  let state = start
  const push = (kind: StepKind, moves: Move[], face: Face | null) => {
    if (!moves.length) return
    steps.push({ kind, moves, face })
    state = applyMoves(state, moves)
  }

  for (let guard = 0; guard < 24 && !isDaisy(state); guard++) {
    const edges = whiteEdges(state).filter((e) => !isPetal(e))
    // Easiest first: bottom facing down, then middle layer, then the rest.
    const rank = (e: Edge) => (e.pos[1] === -1 && e.w.normal[1] === -1 ? 0 : e.pos[1] === 0 ? 1 : e.pos[1] === 1 ? 2 : 3)
    const e = edges.sort((a, b) => rank(a) - rank(b))[0]

    if (e.pos[1] === -1) {
      const side = sideFaceOf([e.pos[0], 0, e.pos[2]])
      push('free', freeSlotAbove(state, side), side)
      if (e.w.normal[1] === -1) push('lower', [`${side}2` as Move], side)
      else push('lift', [side as Move], side) // to the middle layer; handled next round
    } else if (e.pos[1] === 0) {
      // Turn the face the white sticker is NOT on, so white swings up.
      const turnFace = e.w.normal[2] !== 0 ? sideFaceOf([e.pos[0], 0, 0]) : sideFaceOf([0, 0, e.pos[2]])
      push('free', freeSlotAbove(state, turnFace), turnFace)
      const options: Move[] = [turnFace as Move, `${turnFace}'` as Move]
      const lift = options.find((m) => {
        const after = whiteEdges(applyMoves(state, [m]))
        return after.some((x) => isPetal(x) && eq(x.pos, [FACE_NORMAL[turnFace][0], 1, FACE_NORMAL[turnFace][2]]))
      })!
      push('middle', [lift], turnFace)
    } else {
      // On top, white facing sideways: move it down to the middle layer first.
      const side = sideFaceOf(e.w.normal)
      push('flip', [side as Move], side)
    }
  }
  if (!isDaisy(state)) throw new Error('Daisy planner did not finish')
  return steps
}

/** Phase 2: from a daisy, plan the drops onto the white center. */
export function planCrossFromDaisy(start: CubeState): CrossStep[] {
  const steps: CrossStep[] = []
  let state = start
  for (let guard = 0; guard < 8 && !isCrossSolved(state); guard++) {
    let done = false
    for (const u of U_TURNS) {
      const s = applyMoves(state, u)
      const match = whiteEdges(s).find(
        (e) => isPetal(e) && e.other.color === centerColor(s, sideFaceOf(e.other.normal)),
      )
      if (match) {
        const side = sideFaceOf(match.other.normal)
        if (u.length) steps.push({ kind: 'align', moves: u, face: side })
        steps.push({ kind: 'drop', moves: [`${side}2` as Move], face: side })
        state = applyMoves(s, [`${side}2` as Move])
        done = true
        break
      }
    }
    if (!done) throw new Error('No petal can be aligned')
  }
  if (!isCrossSolved(state)) throw new Error('Cross planner did not finish')
  return steps
}

/**
 * Phase 2 can start once every white edge is either a petal or already
 * placed in the cross. Without this, re-planning after the first drop would
 * see "not a daisy" and lift the placed edge straight back up.
 */
export function readyForDrops(state: CubeState): boolean {
  return whiteEdges(state).every(
    (e) => isPetal(e) || (e.pos[1] === -1 && e.w.normal[1] === -1 && e.other.color === centerColor(state, sideFaceOf(e.other.normal))),
  )
}

/** Whole method from any state: daisy first (unless already there), then the drops. */
export function planWhiteCross(start: CubeState): CrossStep[] {
  if (isCrossSolved(start)) return []
  const daisy = readyForDrops(start) ? [] : planDaisy(start)
  const afterDaisy = applyMoves(start, daisy.flatMap((s) => s.moves))
  return [...daisy, ...planCrossFromDaisy(afterDaisy)]
}

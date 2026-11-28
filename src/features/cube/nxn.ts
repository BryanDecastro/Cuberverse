/**
 * Sticker model for any N x N x N cube (2x2, 3x3, 4x4…), used to draw scrambles.
 *
 * Coordinates are doubled so they stay integers for every N: a cubie centre sits
 * at odd/even values in {-(N-1), …, N-1} (step 2), and every sticker keeps the
 * centre of its cubie plus an outward normal. A move turns every sticker whose
 * cubie lies in the turned layers. Axes and turn directions are the same as the
 * 3x3 model (+x = R, +y = U, +z = F), so on N = 3 it matches model.ts exactly
 * (proven in nxn.test.ts).
 *
 * Notation: R U F L D B with ' and 2, wide turns Rw (two layers) and nRw (n layers),
 * as used by WCA 2x2 and 4x4 scrambles.
 */
import { moveGeometry, type Face, type Move } from './moves'

export type Vec3 = [number, number, number]
export type NSticker = { pos: Vec3; normal: Vec3; color: Face }
export type NState = { n: number; stickers: NSticker[] }

const NORMALS: Record<Face, Vec3> = { R: [1, 0, 0], L: [-1, 0, 0], U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1] }
const AXIS = { x: 0, y: 1, z: 2 } as const

/** Screen axes (right, up) per face when looking at it, as in the standard net (U above F, D below F). */
const SCREEN: Record<Face, { right: Vec3; up: Vec3 }> = {
  F: { right: [1, 0, 0], up: [0, 1, 0] },
  B: { right: [-1, 0, 0], up: [0, 1, 0] },
  R: { right: [0, 0, -1], up: [0, 1, 0] },
  L: { right: [0, 0, 1], up: [0, 1, 0] },
  U: { right: [1, 0, 0], up: [0, 0, -1] },
  D: { right: [1, 0, 0], up: [0, 0, 1] },
}

/** Grid offsets of the N rows/columns along one face, in doubled coordinates: -(N-1) … N-1. */
const steps = (n: number) => Array.from({ length: n }, (_, i) => 2 * i - (n - 1))

export function solvedN(n: number): NState {
  const stickers: NSticker[] = []
  for (const face of Object.keys(NORMALS) as Face[]) {
    const nrm = NORMALS[face]
    const { right, up } = SCREEN[face]
    for (const r of steps(n))
      for (const u of steps(n)) {
        const pos = [0, 1, 2].map((k) => nrm[k] * (n - 1) + right[k] * r + up[k] * u) as Vec3
        stickers.push({ pos, normal: [...nrm] as Vec3, color: face })
      }
  }
  return { n, stickers }
}

function rotate(v: Vec3, axis: 0 | 1 | 2, q: number): Vec3 {
  let [x, y, z] = v
  const turns = ((q % 4) + 4) % 4
  for (let t = 0; t < turns; t++) {
    if (axis === 0) [y, z] = [-z, y]
    else if (axis === 1) [x, z] = [z, -x]
    else [x, y] = [-y, x]
  }
  return [x, y, z]
}

export type NMove = { face: Face; width: number; suffix: '' | "'" | '2' }

const TOKEN = /^(\d*)([URFDLB])(w?)(['’′2]?)$/

/** Parse a scramble like "Rw U2 F' 3Rw" into moves (unknown tokens are ignored). */
export function parseN(alg: string): NMove[] {
  return alg
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((tok) => {
      const m = TOKEN.exec(tok)
      if (!m) return []
      const width = m[3] ? Number(m[1] || 2) : 1
      const suffix = m[4] === '2' ? '2' : m[4] ? "'" : ''
      return [{ face: m[2] as Face, width, suffix } as NMove]
    })
}

export function applyN(state: NState, move: NMove): NState {
  const { n } = state
  const { axis, quarters } = moveGeometry(`${move.face}${move.suffix}` as Move)
  const a = AXIS[axis]
  const out = NORMALS[move.face][a] // +1 or -1: which side of the axis this face is on
  // Layers turned: from the face inward, `width` layers deep.
  const limit = n - 1 - 2 * (Math.min(move.width, n) - 1)
  return {
    n,
    stickers: state.stickers.map((s) =>
      s.pos[a] * out >= limit ? { pos: rotate(s.pos, a, quarters), normal: rotate(s.normal, a, quarters), color: s.color } : s,
    ),
  }
}

export function applyAlgN(state: NState, alg: string): NState {
  return parseN(alg).reduce(applyN, state)
}

/** The N x N colours of one face, top row first, as seen in the net. */
export function faceGridN(state: NState, face: Face): Face[][] {
  const { n } = state
  const nrm = NORMALS[face]
  const { right, up } = SCREEN[face]
  const key = (p: Vec3, q: Vec3) => `${p.join(',')}|${q.join(',')}`
  const map = new Map(state.stickers.map((s) => [key(s.pos, s.normal), s.color]))
  const rows: Face[][] = []
  for (const u of steps(n).reverse()) {
    const line: Face[] = []
    for (const r of steps(n)) {
      const pos = [0, 1, 2].map((k) => nrm[k] * (n - 1) + right[k] * r + up[k] * u) as Vec3
      line.push(map.get(key(pos, nrm))!)
    }
    rows.push(line)
  }
  return rows
}

export const isSolvedN = (state: NState) =>
  state.stickers.every((s) => {
    const want = (Object.keys(NORMALS) as Face[]).find((f) => NORMALS[f].every((v, i) => v === s.normal[i]))
    return want === s.color
  })

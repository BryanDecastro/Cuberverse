/**
 * Pure 3x3 state model: 54 stickers, each with an integer position (cubie
 * coordinates in {-1,0,1}^3) and an outward normal. A move rotates every
 * sticker in its layer by quarter turns. No rendering, no three.js.
 *
 * This is the source of truth the lessons check answers against, and the
 * 3D cube is verified to match it (see model.test.ts and readState()).
 *
 * Axes: +x = R, +y = U, +z = F. Positive angles are right-handed.
 */
import { moveGeometry, parseAlg, type Face, type Move } from './moves'

export type Vec3 = [number, number, number]
export type Sticker = { pos: Vec3; normal: Vec3; color: Face }
export type CubeState = Sticker[]

const FACE_NORMALS: Record<Face, Vec3> = {
  R: [1, 0, 0],
  L: [-1, 0, 0],
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
}

const AXIS_INDEX = { x: 0, y: 1, z: 2 } as const

export function faceOfNormal(n: Vec3): Face {
  for (const f of Object.keys(FACE_NORMALS) as Face[]) {
    const m = FACE_NORMALS[f]
    if (m[0] === n[0] && m[1] === n[1] && m[2] === n[2]) return f
  }
  throw new Error(`Not a face normal: ${n.join(',')}`)
}

export function solvedState(): CubeState {
  const out: CubeState = []
  for (const face of Object.keys(FACE_NORMALS) as Face[]) {
    const n = FACE_NORMALS[face]
    const a = n.findIndex((v) => v !== 0)
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const pos: Vec3 = [0, 0, 0]
        const [b, c] = [0, 1, 2].filter((k) => k !== a)
        pos[a] = n[a]
        pos[b] = i
        pos[c] = j
        out.push({ pos, normal: [...n] as Vec3, color: face })
      }
  }
  return out
}

/** Rotate a vector by q quarter turns (right-handed) about an axis. */
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

export function applyMove(state: CubeState, move: Move): CubeState {
  const { axis, layer, quarters } = moveGeometry(move)
  const a = AXIS_INDEX[axis]
  return state.map((s) =>
    layer === 'all' || s.pos[a] === layer ? { pos: rotate(s.pos, a, quarters), normal: rotate(s.normal, a, quarters), color: s.color } : s,
  )
}

export function applyMoves(state: CubeState, moves: Move[] | string): CubeState {
  const list = typeof moves === 'string' ? parseAlg(moves) : moves
  return list.reduce(applyMove, state)
}

/** Canonical key per sticker slot: position + normal. */
export function slotKey(pos: Vec3, normal: Vec3): string {
  return `${pos.join(',')}|${normal.join(',')}`
}

/** Map of slot -> color. Comparable across the model and the 3D cube. */
export function toColorMap(state: CubeState): Record<string, Face> {
  const map: Record<string, Face> = {}
  for (const s of state) map[slotKey(s.pos, s.normal)] = s.color
  return map
}

export function sameColors(a: Record<string, Face>, b: Record<string, Face>): boolean {
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => a[k] === b[k])
}

/** Rebuild a state from a slot -> color map (for example the 3D cube's readState()). */
export function fromColorMap(map: Record<string, Face>): CubeState {
  return Object.entries(map).map(([key, color]) => {
    const [p, n] = key.split('|')
    return { pos: p.split(',').map(Number) as Vec3, normal: n.split(',').map(Number) as Vec3, color }
  })
}

export const FACE_NORMAL = FACE_NORMALS

/** Color of the center currently sitting on a face (centers move only with whole-cube rotations). */
export function centerColor(state: CubeState, face: Face): Face {
  const n = FACE_NORMALS[face]
  const s = state.find((x) => x.pos.every((v, i) => v === n[i]) && x.normal.every((v, i) => v === n[i]))
  if (!s) throw new Error(`No center on ${face}`)
  return s.color
}

export function isSolved(state: CubeState): boolean {
  return state.every((s) => s.color === faceOfNormal(s.normal))
}

/** Colors of one face as a 3x3 grid, read as you look straight at that face. */
export function faceGrid(state: CubeState, face: Face): Face[][] {
  const map = toColorMap(state)
  const n = FACE_NORMALS[face]
  // Screen axes (right, up) for each face when looking straight at it,
  // following the standard unfolded net (U above F, D below F).
  const axes: Record<Face, { right: Vec3; up: Vec3 }> = {
    F: { right: [1, 0, 0], up: [0, 1, 0] },
    B: { right: [-1, 0, 0], up: [0, 1, 0] },
    R: { right: [0, 0, -1], up: [0, 1, 0] },
    L: { right: [0, 0, 1], up: [0, 1, 0] },
    U: { right: [1, 0, 0], up: [0, 0, -1] },
    D: { right: [1, 0, 0], up: [0, 0, 1] },
  }
  const { right, up } = axes[face]
  const grid: Face[][] = []
  for (let row = 1; row >= -1; row--) {
    const line: Face[] = []
    for (let col = -1; col <= 1; col++) {
      const pos: Vec3 = [0, 1, 2].map((k) => n[k] + right[k] * col + up[k] * row) as Vec3
      line.push(map[slotKey(pos, n)])
    }
    grid.push(line)
  }
  return grid
}

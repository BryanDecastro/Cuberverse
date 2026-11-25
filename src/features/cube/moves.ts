/**
 * 3x3 move notation (WCA/Singmaster): outer layers R L U D F B and whole-cube
 * rotations x y z, each with ' and 2.
 *
 * x turns the whole cube like R, y like U, z like F. Rotations change how you
 * hold the cube, not the puzzle itself.
 *
 * The 3D cube turns real geometry, so every state it shows is a legal cube state.
 * The random sequences here are for the decorative hero only. The real Timer
 * will use cubing.js random-state scrambles, the WCA-grade standard.
 */
export type Face = 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
export type Rotation = 'x' | 'y' | 'z'
export type Suffix = '' | "'" | '2'
export type Move = `${Face | Rotation}${Suffix}`

export const FACES: Face[] = ['R', 'L', 'U', 'D', 'F', 'B']

const AXIS_OF: Record<Face | Rotation, 'x' | 'y' | 'z'> = { R: 'x', L: 'x', U: 'y', D: 'y', F: 'z', B: 'z', x: 'x', y: 'y', z: 'z' }

export function isFace(c: string): c is Face {
  return (FACES as string[]).includes(c)
}

/** The face a move turns, or null for a whole-cube rotation. */
export function faceOf(m: Move): Face | null {
  return isFace(m[0]) ? m[0] : null
}

/** Geometry for a move: which axis, which layer ('all' for rotations), and the signed angle in quarter turns. */
export function moveGeometry(move: Move): { axis: 'x' | 'y' | 'z'; layer: 1 | -1 | 'all'; quarters: number } {
  const base0 = move[0] as Face | Rotation
  const suffix = move.slice(1) as Suffix
  // Clockwise as seen looking AT the face: negative rotation about the outward axis.
  const outward: Record<Face | Rotation, 1 | -1> = { R: 1, U: 1, F: 1, L: -1, D: -1, B: -1, x: 1, y: 1, z: 1 }
  const sign = outward[base0]
  const base = -sign // clockwise quarter turn about the +axis direction
  const quarters = suffix === '2' ? base * 2 : suffix === "'" ? -base : base
  return { axis: AXIS_OF[base0], layer: isFace(base0) ? sign : 'all', quarters }
}

export function invertMove(m: Move): Move {
  const head = m[0]
  const s = m.slice(1)
  if (s === '2') return m
  return (s === "'" ? head : `${head}'`) as Move
}

export function invertSequence(seq: Move[]): Move[] {
  return [...seq].reverse().map(invertMove)
}

export function parseAlg(alg: string): Move[] {
  return alg
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => tok.replace(/[’′]/g, "'") as Move)
    .filter((m) => /^[RLUDFBxyz]('|2)?$/.test(m))
}

/** Random move sequence with no same-face repeats and no redundant same-axis triples. */
export function randomSequence(length: number, rand: () => number = Math.random): Move[] {
  const out: Move[] = []
  const suffixes: Suffix[] = ['', "'", '2']
  while (out.length < length) {
    const face = FACES[Math.floor(rand() * 6)]
    const prev = out[out.length - 1]?.[0] as Face | undefined
    const prev2 = out[out.length - 2]?.[0] as Face | undefined
    if (prev === face) continue
    if (prev && prev2 && AXIS_OF[prev] === AXIS_OF[face] && AXIS_OF[prev2] === AXIS_OF[face]) continue
    out.push(`${face}${suffixes[Math.floor(rand() * 3)]}` as Move)
  }
  return out
}

/**
 * Add a move to a list the way a cuber writes it down: the same quarter turn
 * done twice in a row is one half turn (U then U is U2, U′ then U′ is U2).
 * Anything else is kept as it was done.
 */
export function mergeMove(list: Move[], m: Move): Move[] {
  const last = list[list.length - 1]
  if (last && last === m && !m.endsWith('2')) return [...list.slice(0, -1), `${m[0]}2` as Move]
  return [...list, m]
}

/** Several moves, merged one after another. */
export function mergeMoves(list: Move[], moves: Move[]): Move[] {
  return moves.reduce(mergeMove, list)
}

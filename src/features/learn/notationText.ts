import type { Dictionary } from '@/i18n/en'
import type { Face, Move } from '@/features/cube/moves'
import { fmt } from '@/lib/format'

/** Display form of a move: the typographic prime instead of an apostrophe. */
export function displayMove(m: Move | string): string {
  return m.replace("'", '′')
}

/** "Turn the right face 90° clockwise." in the current language. */
export function describeMove(t: Dictionary, m: Move): string {
  const face = m[0] as Face
  const dir = m.endsWith('2') ? t.learn.dir.half : m.endsWith("'") ? t.learn.dir.ccw : t.learn.dir.cw
  return fmt(t.learn.moveDesc, { face: t.learn.faces[face].lower, dir })
}

/** Arrow direction for the 3D overlay. */
export function moveDir(m: Move): 1 | -1 | 2 {
  return m.endsWith('2') ? 2 : m.endsWith("'") ? -1 : 1
}

import type { CrossStep } from '@/features/cube/crossSolver'
import type { Face } from '@/features/cube/moves'
import type { Dictionary } from '@/i18n/en'
import { fmt } from '@/lib/format'
import { displayMove } from '../notationText'

/** 'U' is the white color id (white starts on the U face). */
export const WHITE = 'U' as const

/** Keep centers and the four white edges in color; grey out everything else. */
export const CROSS_FOCUS = (colors: Face[]) => colors.length === 1 || (colors.length === 2 && colors.includes(WHITE))

/** Camera angles, holding yellow on top, that show each side face clearly. */
export const SIDE_VIEW: Record<Face, [number, number]> = {
  F: [-0.62, 0.52],
  R: [-0.62, 0.52],
  U: [-0.62, 0.52],
  L: [0.62, 0.52],
  B: [Math.PI - 0.62, 0.52],
  D: [-0.62, -0.7],
}

/** A view from below that shows the white cross and its side colors together. */
export const VIEW_WHITE: [number, number] = [-0.62, -0.72]

/** Explanation for one planner step, in the current language. */
export function stepText(t: Dictionary, step: CrossStep): string {
  return fmt(t.learn.whiteCross.steps[step.kind], {
    moves: step.moves.map(displayMove).join(' '),
    face: step.face ? t.learn.faces[step.face].lower : '',
  })
}


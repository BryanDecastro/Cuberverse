/**
 * Fixed positions for the Yellow Cross lesson: held yellow on top, two layers
 * solved. Each one is checked in yellowCross.test.ts.
 */
import { invertSequence } from '@/features/cube/moves'
import { EDGE_FLIP, seededRandom, topScramble } from '@/features/cube/yellowCross'

const INV = invertSequence(EDGE_FLIP).join(' ')

/** Yellow cross on top: the goal. */
export const YC_DONE = 'x2'

export const YC_CASES = {
  /** No yellow edges up. Goes dot, then L (turned into place), then line, then cross. */
  dot: { setup: topScramble(seededRandom(5), 5).join(' ') },
  /** Two neighbouring edges up, not yet at the back-left. */
  l: { setup: `x2 ${INV} ${INV} U` },
  /** Two opposite edges up, running front to back. */
  line: { setup: `x2 ${INV} U` },
} as const

export type YcCase = keyof typeof YC_CASES

/** The line already runs left to right: one algorithm finishes the cross. */
export const YC_LINE_READY = `x2 ${INV}`

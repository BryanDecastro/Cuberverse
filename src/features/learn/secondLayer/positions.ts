/**
 * Fixed positions for the Second Layer lesson. All held yellow on top with
 * the first layer solved; each is checked in secondLayer.test.ts.
 */
import { invertSequence } from '@/features/cube/moves'
import { LEFT_ALG, middleScramble, RIGHT_ALG, seededRandom } from '@/features/cube/secondLayer'

const R = RIGHT_ALG.join(' ')

/** First two layers solved: the goal. */
export const SL_DONE = 'x2'

export const SL_CASES = {
  /** An upside-down T on the front; the top color matches the right center. */
  right: { setup: `x2 ${invertSequence(RIGHT_ALG).join(' ')}` },
  /** Same, but the top color matches the left center. */
  left: { setup: `x2 ${invertSequence(LEFT_ALG).join(' ')}` },
  /** The front-right edge is in its slot but flipped. */
  stuck: { setup: `x2 y ${R} U2 ${R} U'` },
} as const

export type SlCase = keyof typeof SL_CASES

/** All four middle edges out, using every kind of step. */
export const SL_FULL = middleScramble(seededRandom(20), 6).join(' ')

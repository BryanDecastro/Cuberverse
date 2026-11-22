/**
 * Fixed positions for the Yellow Face lesson: held yellow on top, two layers
 * solved, yellow cross done. Each one is checked in yellowFace.test.ts.
 */
import { invertSequence, type Move } from '@/features/cube/moves'
import { cornerTwistScramble, seededRandom, TWIST } from '@/features/cube/yellowFace'

const T = (n: number): Move[] => Array.from({ length: n }, () => TWIST).flat()

/** Whole top yellow: the goal. */
export const YF_DONE = 'x2'

/** Two twisted corners: front-right shows yellow on the right (2 rounds), the next one shows yellow at the front (4 rounds). */
export const YF_TWO = ['x2', ...invertSequence([...T(2), 'U', ...T(4), "U'"])].join(' ')

export const YF_CASES = {
  /** Yellow facing right: two rounds. The bottom looks broken afterwards, on purpose. */
  right: { setup: YF_TWO },
  /** Yellow facing you: four rounds. This is the last corner, so the bottom comes back. */
  front: { setup: [YF_TWO, ...T(2), 'U'].join(' ') },
} as const

export type YfCase = keyof typeof YF_CASES

/** All four corners twisted. */
export const YF_FULL = cornerTwistScramble(seededRandom(1)).join(' ')

/** Quiz: after the first corner is done, a twisted corner waits one top turn away. */
export const YF_AFTER_FIRST = [YF_TWO, ...T(2)].join(' ')

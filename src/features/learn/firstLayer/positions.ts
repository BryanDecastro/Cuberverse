/**
 * Fixed positions used by the First Layer lesson. Each is held yellow on top
 * with the white cross solved, and each is checked in firstLayer.test.ts so
 * the copy describing it can be trusted.
 */
import { cornerScramble, seededRandom } from '@/features/cube/firstLayer'

/** Cross solved, all four corners placed: the goal. */
export const FL_DONE = 'x2'

/** One white corner above its spot, three ways round, plus one stuck in the bottom. */
export const FL_CASES = {
  right: { setup: "x2 U R U' R'", rounds: 1 },
  up: { setup: "x2 R U R' U' R U R' U' R U R' U'", rounds: 3 },
  front: { setup: "x2 R U R' U'", rounds: 5 },
  stuck: { setup: "x2 U R U' R' U R U' R'", rounds: 1 },
} as const

export type FlCase = keyof typeof FL_CASES

/** All four corners out of place, using every kind of step. */
export const FL_FULL = cornerScramble(seededRandom(67), 7).join(' ')

/** Quiz: a corner already above its spot, white facing right. One R U R' U'. */
export const FL_QUIZ_INSERT = FL_CASES.right.setup

/** Quiz: a corner one top turn away from its spot. U, then one R U R' U'. */
export const FL_QUIZ_ALIGN = "x2 U R U' R' U'"

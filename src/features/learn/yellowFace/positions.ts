/**
 * Fixed positions for the Yellow Face lesson: held yellow on top, two layers
 * solved, yellow cross done. Every case is already held the way the lesson
 * teaches (front-left corner right for the Sune). Checked in yellowFace.test.ts.
 */
import { cornerTwistScramble, seededRandom, SUNE, type CornerSpot, type YellowDir } from '@/features/cube/yellowFace'

const S = SUNE.join(' ')
const seq = (...parts: string[]) => ['x2', ...parts].join(' ')

/** Whole top yellow: the goal. */
export const YF_DONE = 'x2'

/** The seven corner cases, in the order the lesson shows them. */
export const YF_CASE_IDS = ['sune', 'antisune', 'h', 'pi', 'headlights', 't', 'bowtie'] as const
export type YfCase = (typeof YF_CASE_IDS)[number]

export const YF_CASES: Record<YfCase, { setup: string; up: 0 | 1 | 2; sunes: number; top: Record<CornerSpot, YellowDir> }> = {
  sune: { setup: seq(S, 'U2', S, 'U2'), up: 1, sunes: 1, top: { FL: 'up', FR: 'front', BR: 'right', BL: 'back' } },
  antisune: { setup: seq(S, 'U2'), up: 1, sunes: 2, top: { FL: 'up', FR: 'right', BR: 'back', BL: 'left' } },
  h: { setup: seq(S, S, 'U'), up: 0, sunes: 2, top: { FL: 'left', FR: 'right', BR: 'right', BL: 'left' } },
  pi: { setup: seq(S, 'U', S), up: 0, sunes: 2, top: { FL: 'left', FR: 'front', BR: 'back', BL: 'left' } },
  headlights: { setup: seq(S, 'U', S, 'U2', S, 'U2'), up: 2, sunes: 3, top: { FL: 'front', FR: 'front', BR: 'up', BL: 'up' } },
  t: { setup: seq(S, 'U', S, "U'", S, 'U2'), up: 2, sunes: 3, top: { FL: 'front', FR: 'up', BR: 'up', BL: 'back' } },
  bowtie: { setup: seq(S, S, S, 'U2'), up: 2, sunes: 3, top: { FL: 'front', FR: 'up', BR: 'right', BL: 'up' } },
}

/** All four corners twisted, for the goal's "before" view. */
export const YF_FULL = YF_CASES.h.setup

/** A practice-style mix used by the lesson's full demo. */
export const YF_MIX: string = cornerTwistScramble(seededRandom(1)).join(' ')

/** Quiz: two corners up, but the cube is held one top turn away from the Sune position. */
export const YF_TURN_TASK = [YF_CASES.t.setup, 'U'].join(' ')


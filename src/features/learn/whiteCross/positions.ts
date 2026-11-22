/**
 * Fixed positions used by the White Cross lesson, as move strings from a
 * solved cube. Each one is checked in crossSolver.test.ts, so the copy that
 * describes them can be trusted.
 */

/** Hold the cube upside down: yellow on top, white on the bottom. */
export const WC_HOLD = 'x2'

/** All four white edges around the yellow center, each above its own color. */
export const WC_DAISY = 'x2 F2 R2 B2 L2'

/** A daisy whose petals sit above the wrong centers. */
export const WC_MIXED_DAISY = 'x2 F2 R2 U B2 U2 L2'

/** The three daisy cases: setup (from solved) and the moves the lesson teaches. */
export const WC_CASES = {
  bottom: { setup: `${WC_DAISY} F2 U`, solution: "U' F2" },
  middle: { setup: `${WC_DAISY} R' U`, solution: "U' R" },
  flipped: { setup: `${WC_DAISY} R' U F'`, solution: "F U' R" },
} as const

export type WcCase = keyof typeof WC_CASES

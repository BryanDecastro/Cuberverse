/**
 * Fixed positions for the Final Solve lesson: held yellow on top, yellow face
 * done. Each one is checked in lastLayer.test.ts.
 */
import { invertSequence } from '@/features/cube/moves'
import { CORNER_SWAP, EDGE_CYCLE, lastLayerScramble, seededRandom } from '@/features/cube/lastLayer'

const E = EDGE_CYCLE.join(' ')

/** The solved cube. */
export const FS_DONE = 'x2'

export const FS_CORNERS = {
  /** Headlights already at the back: one corner algorithm. */
  headlights: { setup: `x2 ${invertSequence(CORNER_SWAP).join(' ')}` },
  /** No headlights anywhere: one algorithm from anywhere, then the normal case. */
  none: { setup: lastLayerScramble(seededRandom(43), 2).join(' ') },
} as const

export const FS_EDGES = {
  /** Corners done, a finished side at the back: one edge algorithm. */
  once: { setup: `x2 ${invertSequence(EDGE_CYCLE).join(' ')}` },
  /** Same, but the edges go the other way round: two edge algorithms. */
  twice: { setup: `x2 ${E}` },
  /** No finished side: one algorithm from anywhere first. */
  none: { setup: `x2 ${E} U ${E}` },
} as const

export type FsCornerCase = keyof typeof FS_CORNERS
export type FsEdgeCase = keyof typeof FS_EDGES

/** A whole last layer to finish. */
export const FS_FULL = lastLayerScramble(seededRandom(1), 4).join(' ')

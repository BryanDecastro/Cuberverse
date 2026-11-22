import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState } from './model'
import { cornerScramble, isFirstLayerSolved, seededRandom } from './firstLayer'
import { isSecondLayerSolved, middleScramble } from './secondLayer'
import { isYellowCross, topScramble } from './yellowCross'
import { cornerTwistScramble, isYellowFace } from './yellowFace'

/** Practice screens show these checks after every move, whatever the learner did. They must never throw. */
describe('status checks are safe on any cube', () => {
  it('300 fully random cubes, every check answers without an error', async () => {
    const { randomSequence } = await import('./moves')
    const { isCrossSolved, petalCount, solvedCrossEdges } = await import('./crossSolver')
    const { solvedCorners } = await import('./firstLayer')
    const { solvedMiddleEdges } = await import('./secondLayer')
    const { topShape } = await import('./yellowCross')
    const { cornersUp, frontRightUp } = await import('./yellowFace')
    const { cornersPlaced, finishedSides, isCubeSolved } = await import('./lastLayer')
    const rand = seededRandom(21)
    for (let i = 0; i < 300; i++) {
      const s = applyMoves(solvedState(), ['x2', ...randomSequence(25, rand)])
      expect(() => {
        isCrossSolved(s)
        petalCount(s)
        solvedCrossEdges(s)
        isFirstLayerSolved(s)
        solvedCorners(s)
        isSecondLayerSolved(s)
        solvedMiddleEdges(s)
        topShape(s)
        isYellowCross(s)
        cornersUp(s)
        frontRightUp(s)
        isYellowFace(s)
        cornersPlaced(s)
        finishedSides(s)
        isCubeSolved(s)
      }).not.toThrow()
    }
  })
})

/** A practice mix must never hand the learner a step that is already finished. */
describe('practice mixes never start already solved', () => {
  const cases = [
    ['first layer', cornerScramble, isFirstLayerSolved],
    ['second layer', middleScramble, isSecondLayerSolved],
    ['yellow cross', topScramble, isYellowCross],
    ['yellow face', cornerTwistScramble, isYellowFace],
  ] as const
  for (const [name, make, done] of cases) {
    it(`${name}: 1000 mixes, none already done`, () => {
      const rand = seededRandom(11)
      for (let i = 0; i < 1000; i++) expect(done(applyMoves(solvedState(), make(rand)))).toBe(false)
    })
  }
})

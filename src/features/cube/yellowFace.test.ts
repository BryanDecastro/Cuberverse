import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState } from './model'
import { parseAlg } from './moves'
import { isSecondLayerSolved } from './secondLayer'
import { isYellowCross } from './yellowCross'
import { cornersUp, cornerTwistScramble, frontRightUp, frontRightYellow, isYellowFace, planYellowFace, seededRandom, TWIST } from './yellowFace'
import { YF_AFTER_FIRST, YF_CASES, YF_DONE, YF_FULL, YF_TWO } from '../learn/yellowFace/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const twists = (moves: string) => {
  const plan = planYellowFace(at(moves))
  const first = plan.findIndex((p) => p.kind === 'next')
  return (first === -1 ? plan : plan.slice(0, first)).filter((p) => p.kind === 'twist').length
}

describe("R' D' R D", () => {
  it('six rounds bring the cube back to where it started', () => {
    expect(isYellowFace(applyMoves(at(YF_DONE), Array.from({ length: 6 }, () => TWIST).flat()))).toBe(true)
  })
})

describe('lesson positions match their descriptions', () => {
  it('the goal is a solved yellow face', () => expect(isYellowFace(at(YF_DONE))).toBe(true))
  it('the two-corner position keeps two layers and the cross, with two corners twisted', () => {
    const s = at(YF_TWO)
    expect(isSecondLayerSolved(s)).toBe(true)
    expect(isYellowCross(s)).toBe(true)
    expect(cornersUp(s)).toBe(2)
  })
  it('case "right": yellow faces right, two rounds', () => {
    expect(frontRightYellow(at(YF_CASES.right.setup))).toBe('right')
    expect(twists(YF_CASES.right.setup)).toBe(2)
  })
  it('case "right": after two rounds the bottom looks broken, as the copy warns', () => {
    expect(isSecondLayerSolved(applyMoves(at(YF_CASES.right.setup), parseAlg("R' D' R D R' D' R D")))).toBe(false)
  })
  it('case "front": yellow faces you, four rounds, and the bottom comes back', () => {
    const s = at(YF_CASES.front.setup)
    expect(frontRightYellow(s)).toBe('front')
    expect(twists(YF_CASES.front.setup)).toBe(4)
    expect(isYellowFace(applyMoves(s, planYellowFace(s).flatMap((p) => p.moves)))).toBe(true)
  })
  it('the full demo has all four corners twisted', () => {
    const s = at(YF_FULL)
    expect(isSecondLayerSolved(s) && isYellowCross(s)).toBe(true)
    expect(cornersUp(s)).toBe(0)
  })
  it('quiz: after the first corner, the next twisted corner is one top turn away', () => {
    const s = at(YF_AFTER_FIRST)
    expect(frontRightUp(s)).toBe(true)
    expect(frontRightUp(applyMoves(s, ['U']))).toBe(false)
  })
})

describe('the method always finishes and the bottom always comes back', () => {
  it('500 mixes: yellow right means 2 rounds, yellow front means 4, and the end is a solved yellow face', () => {
    const rand = seededRandom(2)
    for (let i = 0; i < 500; i++) {
      let s = applyMoves(solvedState(), cornerTwistScramble(rand))
      let rounds = 0
      let dir: string | null = null
      for (const step of [...planYellowFace(s), null]) {
        if (step?.kind === 'twist') {
          if (rounds === 0) dir = frontRightYellow(s)
          rounds++
        } else if (rounds) {
          expect(rounds).toBe(dir === 'right' ? 2 : 4)
          rounds = 0
        }
        if (step) s = applyMoves(s, step.moves)
      }
      expect(isYellowFace(s)).toBe(true)
    }
  })
  it('re-planning from the middle (bottom broken) still finishes', () => {
    const rand = seededRandom(5)
    for (let i = 0; i < 300; i++) {
      let s = applyMoves(solvedState(), cornerTwistScramble(rand))
      let n = 0
      while (!isYellowFace(s) && n < 40) {
        s = applyMoves(s, planYellowFace(s)[0].moves)
        n++
      }
      expect(isYellowFace(s)).toBe(true)
    }
  })
})

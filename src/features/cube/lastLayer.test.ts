import { describe, expect, it } from 'vitest'
import { applyMoves, solvedState } from './model'
import { parseAlg } from './moves'
import { isYellowFace } from './yellowFace'
import { CORNER_SWAP, cornersPlaced, EDGE_CYCLE, isCubeSolved, lastLayerScramble, planLastLayer, seededRandom } from './lastLayer'
import { FS_CORNERS, FS_DONE, FS_EDGES, FS_FULL } from '../learn/finalSolve/positions'

const at = (moves: string) => applyMoves(solvedState(), parseAlg(moves))
const kinds = (moves: string) => planLastLayer(at(moves)).map((p) => p.kind + (p.round ?? ''))

describe('both algorithms keep everything but the top layer pieces in place', () => {
  for (const [name, alg] of [['corner', CORNER_SWAP], ['edge', EDGE_CYCLE]] as const) {
    it(`${name} algorithm: yellow face and first two layers stay solved`, () => {
      let s = at(FS_DONE)
      for (let i = 0; i < 4; i++) {
        s = applyMoves(s, alg)
        expect(isYellowFace(s)).toBe(true)
      }
    })
  }
})

describe('lesson positions match their descriptions', () => {
  it('the goal is a solved cube', () => expect(isCubeSolved(at(FS_DONE))).toBe(true))
  it('corners "headlights": one corner algorithm and nothing else', () => expect(kinds(FS_CORNERS.headlights.setup)).toEqual(['corners']))
  it('corners "none": starts with the from-anywhere algorithm, then headlights', () => {
    const k = kinds(FS_CORNERS.none.setup)
    expect(k[0]).toBe('cornersAny')
    expect(k).toContain('corners')
  })
  it('edges "once": one edge algorithm', () => expect(kinds(FS_EDGES.once.setup)).toEqual(['edges1']))
  it('edges "twice": two rounds', () => expect(kinds(FS_EDGES.twice.setup)).toEqual(['edges1', 'edges2']))
  it('edges "none": the corners are already right, and it starts with no finished side', () => {
    const k = kinds(FS_EDGES.none.setup)
    expect(cornersPlaced(at(FS_EDGES.none.setup))).toBe(true)
    expect(k).toContain('edgesAny')
    expect(k.some((x) => x.startsWith('corners'))).toBe(false)
  })
  it('the full demo needs both corners and edges', () => {
    const k = kinds(FS_FULL)
    expect(k.some((x) => x.startsWith('corners'))).toBe(true)
    expect(k.some((x) => x.startsWith('edges'))).toBe(true)
  })
})

describe('the planner always solves the cube', () => {
  it('500 mixes: at most 2 corner and 3 edge algorithms, and headlights at the back are enough within 2 tries', () => {
    const rand = seededRandom(3)
    for (let i = 0; i < 500; i++) {
      let s = applyMoves(solvedState(), lastLayerScramble(rand))
      const plan = planLastLayer(s)
      expect(plan.filter((p) => p.kind === 'corners' || p.kind === 'cornersAny').length).toBeLessThanOrEqual(2)
      expect(plan.filter((p) => p.kind === 'edges' || p.kind === 'edgesAny').length).toBeLessThanOrEqual(3)
      for (const step of plan) {
        s = applyMoves(s, step.moves)
        expect(isYellowFace(s)).toBe(true)
      }
      expect(isCubeSolved(s)).toBe(true)
    }
  })
  it('taking only the first step and re-planning each time still finishes', () => {
    const rand = seededRandom(9)
    for (let i = 0; i < 300; i++) {
      let s = applyMoves(solvedState(), lastLayerScramble(rand))
      let n = 0
      while (!isCubeSolved(s) && n < 20) {
        s = applyMoves(s, planLastLayer(s)[0].moves)
        n++
      }
      expect(isCubeSolved(s)).toBe(true)
    }
  })
  it('practice mixes are never already solved', () => {
    const rand = seededRandom(13)
    for (let i = 0; i < 1000; i++) expect(isCubeSolved(applyMoves(solvedState(), lastLayerScramble(rand)))).toBe(false)
  })
})

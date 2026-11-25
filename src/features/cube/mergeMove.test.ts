import { describe, expect, it } from 'vitest'
import { mergeMove, mergeMoves, type Move } from './moves'
import { applyMoves, solvedState, toColorMap } from './model'

describe('the same move twice in a row is written as a half turn', () => {
  it('U then U is U2', () => expect(mergeMoves([], ['U', 'U'])).toEqual(['U2']))
  it('U′ then U′ is U2', () => expect(mergeMoves([], ["U'", "U'"])).toEqual(['U2']))
  it('a third U starts a new move', () => expect(mergeMoves([], ['U', 'U', 'U'])).toEqual(['U2', 'U']))
  it('U then U′ stays as done (it is how you see a move undone)', () => expect(mergeMoves([], ['U', "U'"])).toEqual(['U', "U'"]))
  it('U2 then U2 stays as done', () => expect(mergeMove(['U2'], 'U2')).toEqual(['U2', 'U2']))
  it('different layers are kept apart', () => expect(mergeMoves([], ['R', 'U', 'R'])).toEqual(['R', 'U', 'R']))
  it('the Sune done with two U for the U2 reads as the Sune', () => {
    expect(mergeMoves([], ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"] as Move[]).join(' ')).toBe("R U R' U R U2 R'")
  })
  it('merging never changes the cube', () => {
    const raw: Move[] = ['R', 'R', 'U', "U'", 'F', 'F', 'F', 'D2', 'D', 'L', "B'", "B'"]
    expect(toColorMap(applyMoves(solvedState(), mergeMoves([], raw)))).toEqual(toColorMap(applyMoves(solvedState(), raw)))
  })
})

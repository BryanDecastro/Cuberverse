import { describe, expect, it } from 'vitest'
import { applyMove, applyMoves, faceGrid, isSolved, solvedState, toColorMap, sameColors, type CubeState } from './model'
import { FACES, invertMove, invertSequence, parseAlg, type Move } from './moves'

const ALL_MOVES: Move[] = FACES.flatMap((f) => [f, `${f}'`, `${f}2`] as Move[])

/** Smallest n > 0 with alg^n = identity. */
function order(alg: string, cap = 2000): number {
  const moves = parseAlg(alg)
  let s: CubeState = solvedState()
  for (let n = 1; n <= cap; n++) {
    s = applyMoves(s, moves)
    if (isSolved(s)) return n
  }
  return -1
}

const row = (s: CubeState, face: Parameters<typeof faceGrid>[1], r: number) => faceGrid(s, face)[r].join('')
const col = (s: CubeState, face: Parameters<typeof faceGrid>[1], c: number) => faceGrid(s, face).map((r) => r[c]).join('')

describe('solved cube', () => {
  it('has 54 stickers, 9 of each color, and is solved', () => {
    const s = solvedState()
    expect(s).toHaveLength(54)
    for (const f of FACES) expect(s.filter((x) => x.color === f)).toHaveLength(9)
    expect(isSolved(s)).toBe(true)
  })
})

describe('move directions match standard WCA notation', () => {
  const s0 = solvedState()
  it('R lifts the front right column to the top', () => {
    expect(col(applyMove(s0, 'R'), 'U', 2)).toBe('FFF')
  })
  it("R' brings the back to the top right column", () => {
    expect(col(applyMove(s0, "R'"), 'U', 2)).toBe('BBB')
  })
  it('L brings the top left column down to the front', () => {
    expect(col(applyMove(s0, 'L'), 'F', 0)).toBe('UUU')
  })
  it('U sends the front top row to the left', () => {
    expect(row(applyMove(s0, 'U'), 'L', 0)).toBe('FFF')
    expect(row(applyMove(s0, 'U'), 'F', 0)).toBe('RRR')
  })
  it('D sends the front bottom row to the right', () => {
    expect(row(applyMove(s0, 'D'), 'R', 2)).toBe('FFF')
  })
  it('F sends the top bottom row to the right face', () => {
    expect(col(applyMove(s0, 'F'), 'R', 0)).toBe('UUU')
  })
  it('B sends the top back row to the left face', () => {
    expect(col(applyMove(s0, 'B'), 'L', 0)).toBe('UUU')
  })
  it('X2 equals X X for every face', () => {
    for (const f of FACES) {
      expect(sameColors(toColorMap(applyMoves(s0, [`${f}2` as Move])), toColorMap(applyMoves(s0, [f, f])))).toBe(true)
    }
  })
})

describe('group properties', () => {
  it("every move is undone by its inverse", () => {
    for (const m of ALL_MOVES) expect(isSolved(applyMoves(solvedState(), [m, invertMove(m)]))).toBe(true)
  })
  it('every quarter turn has order 4', () => {
    for (const f of FACES) expect(order(f)).toBe(4)
  })
  it("R U R' U' (the sexy move) has order 6", () => {
    expect(order("R U R' U'")).toBe(6)
  })
  it('R U has order 105', () => {
    expect(order('R U')).toBe(105)
  })
  it('R2 U2 has order 6', () => {
    expect(order('R2 U2')).toBe(6)
  })
  it('any random sequence followed by its inverse is solved', () => {
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let t = 0; t < 50; t++) {
      const seq = Array.from({ length: 25 }, () => ALL_MOVES[Math.floor(rand() * ALL_MOVES.length)])
      const s = applyMoves(solvedState(), seq)
      expect(isSolved(applyMoves(s, invertSequence(seq)))).toBe(true)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { applyMoves, faceGrid, solvedState } from './model'
import { FACES, invertSequence, randomSequence, type Move } from './moves'
import { applyAlgN, faceGridN, isSolvedN, parseN, solvedN } from './nxn'
import { seededRandom } from './firstLayer'

const invertAlg = (alg: string) =>
  alg
    .trim()
    .split(/\s+/)
    .reverse()
    .map((t) => (t.endsWith('2') ? t : t.endsWith("'") ? t.slice(0, -1) : t + "'"))
    .join(' ')

describe('N x N model', () => {
  it('on a 3x3 it matches the proven 3x3 model exactly (200 random scrambles, every face)', () => {
    const rand = seededRandom(9)
    for (let i = 0; i < 200; i++) {
      const seq = randomSequence(20, rand)
      const a = applyMoves(solvedState(), seq)
      const b = applyAlgN(solvedN(3), seq.join(' '))
      for (const f of FACES) expect(faceGridN(b, f)).toEqual(faceGrid(a, f))
    }
  })

  it('reads WCA notation, including wide turns', () => {
    expect(parseN("Rw U2 F' 3Rw x L")).toEqual([
      { face: 'R', width: 2, suffix: '' },
      { face: 'U', width: 1, suffix: '2' },
      { face: 'F', width: 1, suffix: "'" },
      { face: 'R', width: 3, suffix: '' },
      { face: 'L', width: 1, suffix: '' },
    ])
  })

  it('every 2x2 and 4x4 scramble undone in reverse gives a solved cube', () => {
    const rand = seededRandom(4)
    for (const n of [2, 4]) {
      for (let i = 0; i < 100; i++) {
        const toks: string[] = []
        for (let k = 0; k < 30; k++) {
          const f = 'URFDLB'[Math.floor(rand() * 6)]
          const w = n === 4 && rand() < 0.4 ? 'w' : ''
          toks.push(f + w + ["", "'", '2'][Math.floor(rand() * 3)])
        }
        const alg = toks.join(' ')
        const s = applyAlgN(solvedN(n), alg)
        expect(isSolvedN(applyAlgN(s, invertAlg(alg)))).toBe(true)
      }
    }
  })

  it('on a 4x4, Rw turns the two right layers and R only the outer one', () => {
    const rw = applyAlgN(solvedN(4), 'Rw')
    const r = applyAlgN(solvedN(4), 'R')
    // Front face: R moves only the last column, Rw the last two.
    const col = (g: string[][], c: number) => g.map((row) => row[c])
    expect(col(faceGridN(r, 'F'), 3)).toEqual(['D', 'D', 'D', 'D'])
    expect(col(faceGridN(r, 'F'), 2)).toEqual(['F', 'F', 'F', 'F'])
    expect(col(faceGridN(rw, 'F'), 2)).toEqual(['D', 'D', 'D', 'D'])
    expect(col(faceGridN(rw, 'F'), 1)).toEqual(['F', 'F', 'F', 'F'])
  })

  it('on a 2x2, the sexy move six times returns to solved, and a 4x4 has 96 stickers', () => {
    expect(isSolvedN(applyAlgN(solvedN(2), Array(6).fill("R U R' U'").join(' ')))).toBe(true)
    expect(solvedN(4).stickers).toHaveLength(96)
    expect(solvedN(2).stickers).toHaveLength(24)
  })

  it('a 3x3 sequence and its inverse agree with the 3x3 helpers', () => {
    const seq: Move[] = ['R', 'U', "R'", 'F2', 'D']
    expect(isSolvedN(applyAlgN(applyAlgN(solvedN(3), seq.join(' ')), invertSequence(seq).join(' ')))).toBe(true)
  })
})

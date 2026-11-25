import { describe, expect, it } from 'vitest'
import { gestureMove } from './CubeScene'
import { applyMoves, solvedState, toColorMap, type CubeState, type Vec3 } from './model'
import type { Face } from './moves'

// Axes: 0 = x (right), 1 = y (up), 2 = z (toward the viewer). Faces sit at about ±1.5.
describe('drag-to-turn names the right move', () => {
  it('front face: top row sideways turns U, right column up/down turns R', () => {
    expect(gestureMove([0, 1, 1.5], 0, 1)).toBe("U'")
    expect(gestureMove([0, 1, 1.5], 0, -1)).toBe('U')
    expect(gestureMove([1, 0, 1.5], 1, 1)).toBe('R')
    expect(gestureMove([1, -1, 1.5], 1, -1)).toBe("R'")
    expect(gestureMove([-1, 0, 1.5], 1, -1)).toBe('L')
    expect(gestureMove([0, -1, 1.5], 0, 1)).toBe('D')
  })
  it('top face: the front row moving right is F', () => {
    expect(gestureMove([0, 1.5, 1], 0, 1)).toBe('F')
    expect(gestureMove([0, 1.5, -1], 0, 1)).toBe("B'")
  })
  it("right face: the front column moving up is F'", () => {
    expect(gestureMove([1.5, 0, 1], 1, 1)).toBe("F'")
  })
  it('back face: the top row moving toward +x is U', () => {
    expect(gestureMove([0, 1, -1.5], 0, 1)).toBe('U')
  })
  it('middle rows and columns do nothing (no slice moves in this notation)', () => {
    expect(gestureMove([0, 0, 1.5], 0, 1)).toBeNull()
    expect(gestureMove([0, 0.2, 1.5], 1, 1)).toBeNull()
  })

  it('on every face, the grabbed sticker goes over the edge it was dragged toward', () => {
    // Label every sticker uniquely, then follow the grabbed one through the move.
    const labelled = solvedState().map((s, i) => ({ ...s, color: String(i) as unknown as Face })) as CubeState
    const idAt = (st: CubeState, pos: Vec3, n: Vec3) => toColorMap(st)[`${pos.join(',')}|${n.join(',')}`]
    let checked = 0
    for (const k of [0, 1, 2] as const)
      for (const s of [1, -1])
        for (const a of [-1, 0, 1])
          for (const b of [-1, 0, 1]) {
            const others = [0, 1, 2].filter((i) => i !== k) as (0 | 1 | 2)[]
            const pos: Vec3 = [0, 0, 0]
            pos[k] = s
            pos[others[0]] = a
            pos[others[1]] = b
            const n: Vec3 = [0, 0, 0]
            n[k] = s
            const point = pos.map((v, i) => (i === k ? v * 1.5 : v)) as Vec3
            for (const along of others)
              for (const dir of [1, -1] as const) {
                const m = gestureMove(point, along, dir)
                const rot = 3 - k - along
                if (pos[rot] === 0) {
                  expect(m).toBeNull()
                  continue
                }
                // A quarter turn about an axis in the face's plane carries the sticker over the
                // edge it was dragged toward: it must end up on the face whose normal is the drag.
                const id = idAt(labelled, pos, n)
                const moved = applyMoves(labelled, m!).find((st) => (st.color as unknown as string) === id)!
                const want: Vec3 = [0, 0, 0]
                want[along] = dir
                expect(moved.normal.map((v) => v + 0), `${m} from ${pos} along ${along}${dir > 0 ? '+' : '-'}`).toEqual(want)
                checked++
              }
          }
    expect(checked).toBeGreaterThan(40)
  })
})

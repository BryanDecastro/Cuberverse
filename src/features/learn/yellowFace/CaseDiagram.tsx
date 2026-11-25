import type { CornerSpot, YellowDir } from '@/features/cube/yellowFace'

const YELLOW = '#ffc93c'
const GREY = '#2a3147'

/** Grid cell (column, row) of each corner, seen from above with the front at the bottom. */
const CELL: Record<CornerSpot, [number, number]> = { BL: [0, 0], BR: [2, 0], FL: [0, 2], FR: [2, 2] }

/**
 * Top view of a corner case: the yellow cross, which corners show yellow on top,
 * and small bars on the sides for yellow stickers facing sideways.
 * The front-left corner (where the Sune is set up) is ringed.
 */
export function CaseDiagram({ top, className, label }: { top: Record<CornerSpot, YellowDir>; className?: string; label: string }) {
  const c = 22 // cell size
  const o = 17 // grid origin
  const cells = []
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const corner = (Object.keys(CELL) as CornerSpot[]).find((k) => CELL[k][0] === col && CELL[k][1] === row)
      const fill = corner ? (top[corner] === 'up' ? YELLOW : GREY) : YELLOW
      cells.push(<rect key={`${row}-${col}`} x={o + col * c + 1.5} y={o + row * c + 1.5} width={c - 3} height={c - 3} rx="3" fill={fill} />)
    }
  const bars = (Object.keys(CELL) as CornerSpot[]).map((k) => {
    const [col, row] = CELL[k]
    const d = top[k]
    const x = o + col * c
    const y = o + row * c
    const t = 6 // bar thickness
    const r =
      d === 'front' ? { x: x + 3, y: o + 3 * c + 3, w: c - 6, h: t } : d === 'back' ? { x: x + 3, y: o - 3 - t, w: c - 6, h: t } : d === 'left' ? { x: o - 3 - t, y: y + 3, w: t, h: c - 6 } : d === 'right' ? { x: o + 3 * c + 3, y: y + 3, w: t, h: c - 6 } : null
    return r ? <rect key={k} x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill={YELLOW} /> : null
  })
  return (
    <svg viewBox="0 0 100 106" className={className} role="img" aria-label={label}>
      <rect x={o - 1} y={o - 1} width={3 * c + 2} height={3 * c + 2} rx="5" fill="#07080e" />
      {cells}
      {bars}
      {/* The front-left corner: where the Sune is set up */}
      <rect x={o - 2} y={o + 2 * c - 2} width={c + 4} height={c + 4} rx="6" fill="none" stroke="#5aa8ff" strokeWidth="2.2" />
      <text x="50" y="104" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8390b2" className="font-mono">
        F
      </text>
    </svg>
  )
}

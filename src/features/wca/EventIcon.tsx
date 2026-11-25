/** Small drawn icons for the featured WCA events (original SVG, no assets). */
const W = '#f4f6fb'
const Y = '#ffc93c'
const R = '#e8283d'
const O = '#ff7a1a'
const B = '#1f6bff'
const G = '#19b85a'
const EDGE = '#07080e'

type Pt = [number, number]
const pts = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** Corners of the three visible faces of an isometric cube that fits 48x48. */
function isoFaces(size = 40, top = 4) {
  const s = size / 2 // half height of the cube's silhouette
  const k = 0.866
  const cx = 24
  const A: Pt = [cx, top] // top corner
  const Bp: Pt = [cx + k * s, top + s / 2] // right
  const C: Pt = [cx, top + s] // centre
  const D: Pt = [cx - k * s, top + s / 2] // left
  const E: Pt = [cx + k * s, top + 1.5 * s] // right bottom
  const F: Pt = [cx, top + 2 * s] // bottom
  const Gp: Pt = [cx - k * s, top + 1.5 * s] // left bottom
  return {
    top: [D, A, Bp, C] as Pt[],
    left: [D, C, F, Gp] as Pt[],
    right: [C, Bp, E, F] as Pt[],
    outline: [A, Bp, E, F, Gp, D] as Pt[],
  }
}

/** A face (quad a-b-c-d) cut into an n x n grid of stickers. */
function grid(face: Pt[], n: number, color: string, inset = 0.07) {
  const [a, b, c, d] = face
  const at = (u: number, v: number) => lerp(lerp(a, b, u), lerp(d, c, u), v)
  const cells = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const u0 = (i + inset) / n
      const u1 = (i + 1 - inset) / n
      const v0 = (j + inset) / n
      const v1 = (j + 1 - inset) / n
      cells.push(<polygon key={`${i}-${j}`} points={pts([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)])} fill={color} />)
    }
  return cells
}

function Cube({ n }: { n: number }) {
  const f = isoFaces()
  return (
    <>
      <polygon points={pts(f.outline)} fill={EDGE} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      {grid(f.top, n, W, n > 4 ? 0.1 : 0.08)}
      {grid(f.left, n, G, n > 4 ? 0.1 : 0.08)}
      {grid(f.right, n, R, n > 4 ? 0.1 : 0.08)}
    </>
  )
}

function Pyraminx() {
  const top: Pt = [24, 5]
  const left: Pt = [4, 41]
  const right: Pt = [44, 41]
  const P = (row: number, col: number): Pt => {
    // row 0..3 from the top, col 0..row
    const l = lerp(top, left, row / 3)
    const r = lerp(top, right, row / 3)
    return row === 0 ? top : lerp(l, r, col / row)
  }
  const tris = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col <= row; col++) {
      tris.push(<polygon key={`u${row}-${col}`} points={pts([P(row, col), P(row + 1, col), P(row + 1, col + 1)])} fill={Y} />)
      if (col < row)
        tris.push(<polygon key={`d${row}-${col}`} points={pts([P(row, col), P(row, col + 1), P(row + 1, col + 1)])} fill="#e0a92a" />)
    }
  }
  return (
    <>
      <polygon points={pts([top, right, left])} fill={EDGE} stroke={EDGE} strokeWidth="3" strokeLinejoin="round" />
      <g stroke={EDGE} strokeWidth="1.3" strokeLinejoin="round">{tris}</g>
    </>
  )
}

function Megaminx() {
  const c: Pt = [24, 25]
  const ring = (r: number, rot = -90) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = ((rot + i * 72) * Math.PI) / 180
      return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as Pt
    })
  const outer = ring(21)
  const inner = ring(9)
  const colors = [R, B, Y, G, O]
  return (
    <>
      <polygon points={pts(outer)} fill={EDGE} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      {outer.map((p, i) => {
        const next = outer[(i + 1) % 5]
        const quad = [inner[i], lerp(inner[i], p, 1), lerp(p, next, 0.5), inner[(i + 1) % 5]]
        return <polygon key={i} points={pts(quad)} fill={colors[i]} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round" />
      })}
      <polygon points={pts(inner)} fill={W} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round" />
    </>
  )
}

function Skewb() {
  const f = isoFaces()
  const face = (q: Pt[], center: string, corner: string, key: string) => {
    const m = q.map((p, i) => lerp(p, q[(i + 1) % 4], 0.5))
    return (
      <g key={key} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round">
        <polygon points={pts(m)} fill={center} />
        {q.map((p, i) => (
          <polygon key={i} points={pts([p, m[i], m[(i + 3) % 4]])} fill={corner} />
        ))}
      </g>
    )
  }
  return (
    <>
      <polygon points={pts(f.outline)} fill={EDGE} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      {face(f.top, W, B, 't')}
      {face(f.left, G, Y, 'l')}
      {face(f.right, R, W, 'r')}
    </>
  )
}

function Square1() {
  const f = isoFaces()
  const [d, a, b, c] = f.top
  const mid = lerp(a, c, 0.5)
  // Top layer cut into kite and wedge pieces radiating from the centre.
  const rim = [d, lerp(d, a, 0.5), a, lerp(a, b, 0.5), b, lerp(b, c, 0.5), c, lerp(c, d, 0.5)]
  const sides = (q: Pt[], color: string, key: string) => {
    const [p0, p1, p2, p3] = q
    const t = 0.36
    return (
      <g key={key} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round">
        <polygon points={pts([p0, p1, lerp(p1, p2, t), lerp(p0, p3, t)])} fill={color} />
        <polygon points={pts([lerp(p0, p3, t), lerp(p1, p2, t), lerp(p1, p2, 1 - t), lerp(p0, p3, 1 - t)])} fill={color} opacity="0.75" />
        <polygon points={pts([lerp(p0, p3, 1 - t), lerp(p1, p2, 1 - t), p2, p3])} fill={color} />
      </g>
    )
  }
  return (
    <>
      <polygon points={pts(f.outline)} fill={EDGE} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      <g stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round">
        {rim.map((p, i) => (
          <polygon key={i} points={pts([mid, p, rim[(i + 1) % 8]])} fill={i % 2 ? '#dfe3ee' : W} />
        ))}
      </g>
      {sides(f.left, O, 'l')}
      {sides(f.right, B, 'r')}
    </>
  )
}

function Blindfold() {
  return (
    <>
      <path d="M2 22 C8 19 12 18 15 18" fill="none" stroke="#4a62a3" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 22 C40 19 36 18 33 18" fill="none" stroke="#4a62a3" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M8 20 C14 14 34 14 40 20 C42 26 38 32 32 32 C28 32 26 28 24 28 C22 28 20 32 16 32 C10 32 6 26 8 20 Z"
        fill="#1b2a55"
        stroke="#7fb0ff"
        strokeWidth="1.6"
      />
      <path d="M12 22 C16 19 20 20 21 23" fill="none" stroke="#7fb0ff" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M27 23 C28 20 32 19 36 22" fill="none" stroke="#7fb0ff" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" />
    </>
  )
}

const ICONS: Record<string, () => React.ReactNode> = {
  '333': () => <Cube n={3} />,
  '222': () => <Cube n={2} />,
  '444': () => <Cube n={4} />,
  '555': () => <Cube n={5} />,
  pyram: Pyraminx,
  minx: Megaminx,
  skewb: Skewb,
  sq1: Square1,
  '333bf': Blindfold,
}

export function EventIcon({ id, className }: { id: string; className?: string }) {
  const Icon = ICONS[id]
  if (!Icon) return null
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <Icon />
    </svg>
  )
}

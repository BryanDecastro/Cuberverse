/**
 * Original SVG artwork for each era on the History timeline. No photographs of
 * real people and no third-party logos: every scene is drawn here. A real,
 * licensed photo can replace any of them later (see `image` in History.tsx).
 */
import type { ReactNode } from 'react'
import { WORLD_RECORDS } from './records'

const W = '#f4f6fb'
const Y = '#ffc93c'
const R = '#e8283d'
const O = '#ff7a1a'
const B = '#1f6bff'
const G = '#19b85a'

type Face = string | string[]
type Pt = [number, number]

const pick = (f: Face, n: number) => (Array.isArray(f) ? f[n] : f)

function quad(o: Pt, a: Pt, b: Pt, S: number, i: number, j: number, inset: number) {
  const p = (u: number, v: number) => [o[0] + (a[0] * u + b[0] * v) * S, o[1] + (a[1] * u + b[1] * v) * S]
  return [p(i + inset, j + inset), p(i + 1 - inset, j + inset), p(i + 1 - inset, j + 1 - inset), p(i + inset, j + 1 - inset)]
    .map((q) => q.map((n) => n.toFixed(1)).join(','))
    .join(' ')
}

/** Isometric 3x3 cube; (x, y) is the top corner, S one sticker's edge. */
function IsoCube({
  x,
  y,
  S,
  top,
  left,
  right,
  body = '#07080e',
  inset = 0.09,
  wire,
}: {
  x: number
  y: number
  S: number
  top: Face
  left: Face
  right: Face
  body?: string
  inset?: number
  /** Outline only, in this stroke color (blueprint style). */
  wire?: string
}) {
  const k = 0.866
  const faces: { o: Pt; a: Pt; b: Pt; c: Face }[] = [
    { o: [x, y], a: [k, 0.5], b: [-k, 0.5], c: top },
    { o: [x - 3 * k * S, y + 1.5 * S], a: [k, 0.5], b: [0, 1], c: left },
    { o: [x, y + 3 * S], a: [k, -0.5], b: [0, 1], c: right },
  ]
  if (wire) {
    return (
      <g fill="none" stroke={wire} strokeWidth="1.3" strokeLinejoin="round">
        {faces.map((f, fi) =>
          Array.from({ length: 9 }, (_, n) => <polygon key={`${fi}-${n}`} points={quad(f.o, f.a, f.b, S, n % 3, Math.floor(n / 3), 0)} />),
        )}
      </g>
    )
  }
  const e = 3 * k * S
  return (
    <g>
      <polygon
        points={`${x},${y - 3} ${x + e + 3},${y + 1.5 * S - 2} ${x + e + 3},${y + 4.5 * S + 2} ${x},${y + 6 * S + 3} ${x - e - 3},${y + 4.5 * S + 2} ${x - e - 3},${y + 1.5 * S - 2}`}
        fill={body}
      />
      {faces.map((f, fi) =>
        Array.from({ length: 9 }, (_, n) => (
          <polygon key={`${fi}-${n}`} points={quad(f.o, f.a, f.b, S, n % 3, Math.floor(n / 3), inset)} fill={pick(f.c, n)} />
        )),
      )}
    </g>
  )
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    // The scene always fits whole (meet); its background is drawn far past the
    // viewBox and shown through overflow, so any box shape is filled edge to edge.
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="h-full w-full overflow-visible" role="img" aria-label={label}>
      {children}
    </svg>
  )
}

/** 1974: the blueprint and the wooden prototype. */
function Blueprint({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <defs>
        <linearGradient id="a74-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d3170" />
          <stop offset="1" stopColor="#061536" />
        </linearGradient>
        <pattern id="a74-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#6f9ee8" strokeOpacity="0.16" />
        </pattern>
      </defs>
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a74-bg)" />
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a74-grid)" />
      <text x="24" y="34" className="font-mono" fontSize="12" letterSpacing="2.5" fill="#cfe3ff">BŰVÖS KOCKA</text>
      <text x="24" y="51" className="font-mono" fontSize="9.5" letterSpacing="1.5" fill="#8fb4ec">PROTOTÍPUS · BUDAPEST · 1974</text>
      <IsoCube x={158} y={62} S={25} top="" left="" right="" wire="#d7e7ff" />
      {/* Dimension line */}
      <g stroke="#8fb4ec" strokeWidth="1">
        <line x1="242" y1="99" x2="242" y2="174" />
        <line x1="236" y1="99" x2="248" y2="99" />
        <line x1="236" y1="174" x2="248" y2="174" />
      </g>
      <text x="252" y="141" className="font-mono" fontSize="10" fill="#cfe3ff">57 mm</text>
      {/* The wooden prototype, held with a rubber band */}
      <IsoCube x={330} y={150} S={13} top="#d9a96f" left="#b57c45" right="#8d5a2d" body="#5b3a1c" inset={0.05} />
      <path d="M302 178 Q330 168 341 190 T358 196" fill="none" stroke="#e0533f" strokeWidth="2" strokeLinecap="round" />
      {/* Pencil */}
      <g transform="rotate(-28 70 214)">
        <rect x="20" y="208" width="104" height="11" rx="2" fill="#f2b636" />
        <rect x="20" y="208" width="14" height="11" fill="#d36a5c" />
        <polygon points="124,208 140,213.5 124,219" fill="#e9d3ae" />
        <polygon points="135,211.8 140,213.5 135,215.2" fill="#2b2b2b" />
      </g>
    </Frame>
  )
}

/** 1977: on the shelf of a Budapest toy shop. */
function Shop({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <defs>
        <linearGradient id="a77-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1a10" />
          <stop offset="1" stopColor="#120a07" />
        </linearGradient>
        <radialGradient id="a77-light" cx="0.5" cy="0.35" r="0.6">
          <stop offset="0" stopColor="#ffb469" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb469" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a77-bg)" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={i * 52 - 426} y="-400" width="24" height="590" fill={i % 2 ? '#c4622d' : '#e0a040'} opacity="0.12" />
      ))}
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a77-light)" />
      {/* Toy boxes */}
      <rect x="34" y="128" width="62" height="70" rx="3" fill="#7a3b22" />
      <rect x="40" y="136" width="50" height="16" rx="2" fill="#e0a040" opacity="0.7" />
      <rect x="104" y="150" width="44" height="48" rx="3" fill="#3f5a8a" />
      <IsoCube
        x={212}
        y={72}
        S={21}
        top={[W, R, W, B, W, G, Y, W, O]}
        left={[G, O, G, G, G, W, B, G, Y]}
        right={[R, R, B, Y, R, R, R, O, R]}
      />
      {/* Shelf */}
      <rect x="-400" y="198" width="1200" height="12" fill="#7b4c27" />
      <rect x="-400" y="210" width="1200" height="6" fill="#4b2c15" />
      {/* Price tag */}
      <line x1="262" y1="118" x2="292" y2="104" stroke="#d9c7a3" strokeWidth="1.2" />
      <g transform="rotate(8 330 120)">
        <rect x="290" y="96" width="92" height="46" rx="5" fill="#f1e6cc" />
        <circle cx="298" cy="104" r="3" fill="#2b1a10" />
        <text x="306" y="116" className="font-mono" fontSize="11" fontWeight="700" fill="#2b1a10">Bűvös kocka</text>
        <text x="306" y="132" className="font-mono" fontSize="9" fill="#7a3b22">1977</text>
      </g>
    </Frame>
  )
}

/** 1980: launched across four toy fairs. */
function Globe({ label }: { label: string }) {
  const cities: { name: string; x: number; y: number; lx: number; ly: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { name: 'NEW YORK', x: 118, y: 104, lx: 118, ly: 93, anchor: 'middle' },
    { name: 'LONDON', x: 192, y: 72, lx: 184, ly: 64, anchor: 'end' },
    { name: 'PARIS', x: 197, y: 92, lx: 197, ly: 108, anchor: 'middle' },
    { name: 'NÜRNBERG', x: 220, y: 80, lx: 228, ly: 72, anchor: 'start' },
  ]
  return (
    <Frame label={label}>
      <defs>
        <linearGradient id="a80-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a1a44" />
          <stop offset="1" stopColor="#060d24" />
        </linearGradient>
        <radialGradient id="a80-globe" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#1b4fa8" />
          <stop offset="1" stopColor="#0a1d4a" />
        </radialGradient>
      </defs>
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a80-bg)" />
      <circle cx="180" cy="134" r="100" fill="url(#a80-globe)" stroke="#3d7bff" strokeOpacity="0.55" />
      <g fill="none" stroke="#7fb0ff" strokeOpacity="0.22">
        <ellipse cx="180" cy="134" rx="34" ry="100" />
        <ellipse cx="180" cy="134" rx="70" ry="100" />
        <ellipse cx="180" cy="134" rx="100" ry="30" />
        <ellipse cx="180" cy="134" rx="100" ry="66" />
        <line x1="80" y1="134" x2="280" y2="134" />
      </g>
      <g fill="none" stroke="#22d3ee" strokeWidth="1.3" strokeDasharray="3 4" strokeOpacity="0.8">
        {cities.map((c) => (
          <path key={c.name} d={`M${c.x} ${c.y} Q${(c.x + 320) / 2} ${Math.min(c.y, 150) - 50} 318 168`} />
        ))}
      </g>
      {cities.map((c) => (
        <g key={c.name}>
          <circle cx={c.x} cy={c.y} r="6" fill="#22d3ee" opacity="0.25" />
          <circle cx={c.x} cy={c.y} r="2.8" fill="#e9fbff" />
          <text
            x={c.lx}
            y={c.ly}
            textAnchor={c.anchor}
            className="font-mono"
            fontSize="8.5"
            letterSpacing="1"
            fill="#cfe3ff"
          >
            {c.name}
          </text>
        </g>
      ))}
      <IsoCube x={330} y={150} S={15} top={W} left={G} right={R} />
    </Frame>
  )
}

/** A row of split-flap characters. */
function Flaps({ text, x, y, w, h, size, color }: { text: string; x: number; y: number; w: number; h: number; size: number; color: string }) {
  return (
    <g>
      {[...text].map((ch, i) => (
        <g key={i}>
          <rect x={x + i * (w + 2)} y={y} width={w} height={h} rx="2" fill="#1b1610" />
          <text x={x + i * (w + 2) + w / 2} y={y + h * 0.74} textAnchor="middle" className="font-mono" fontSize={size} fontWeight="700" fill={color}>
            {ch === ' ' ? '' : ch}
          </text>
          <line x1={x + i * (w + 2)} y1={y + h / 2} x2={x + i * (w + 2) + w} y2={y + h / 2} stroke="#000" strokeOpacity="0.7" />
        </g>
      ))}
    </g>
  )
}

/** 1982: the first World Championship result. */
function Scoreboard({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <defs>
        <linearGradient id="a82-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a1d0b" />
          <stop offset="1" stopColor="#0c0905" />
        </linearGradient>
      </defs>
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a82-bg)" />
      <rect x="24" y="24" width="352" height="212" rx="10" fill="#0b0906" stroke="#4a3a1f" />
      <Flaps text="WORLD CHAMPIONSHIP" x={41} y={42} w={16} h={22} size={13} color="#efe2c4" />
      <Flaps text="BUDAPEST  1982" x={77} y={72} w={16} h={22} size={13} color="#efe2c4" />
      <Flaps text="22.95" x={110} y={110} w={34} h={62} size={44} color="#ffb347" />
      <Flaps text="MINH THAI · USA" x={68} y={186} w={16} h={22} size={12} color="#d9c7a3" />
    </Frame>
  )
}

function MiniGrid({ x, y, cells }: { x: number; y: number; cells: string[] }) {
  return (
    <g>
      {cells.map((c, n) => (
        <rect key={n} x={x + (n % 3) * 10} y={y + Math.floor(n / 3) * 10} width="8.5" height="8.5" rx="1.5" fill={c} />
      ))}
    </g>
  )
}

/** 1997: the method shared on the early web. */
function Browser({ label }: { label: string }) {
  const g = '#2a3657'
  const steps: { name: string; cells: string[] }[] = [
    { name: 'Cross', cells: [g, W, g, W, W, W, g, W, g] },
    { name: 'F2L', cells: [g, g, g, G, G, G, G, G, G] },
    { name: 'OLL', cells: [Y, Y, Y, Y, Y, Y, Y, Y, Y] },
    { name: 'PLL', cells: [R, R, R, G, G, G, O, O, O] },
  ]
  return (
    <Frame label={label}>
      <rect x="-400" y="-400" width="1200" height="1060" fill="#081029" />
      <rect x="34" y="22" width="332" height="216" rx="8" fill="#0e1838" stroke="#26345f" />
      <rect x="34" y="22" width="332" height="24" rx="8" fill="#172451" />
      <rect x="34" y="38" width="332" height="8" fill="#172451" />
      {[48, 60, 72].map((x, i) => (
        <circle key={x} cx={x} cy="34" r="4" fill={[R, Y, G][i]} opacity="0.8" />
      ))}
      <rect x="90" y="28" width="250" height="12" rx="3" fill="#0b1430" />
      <text x="96" y="37.5" className="font-mono" fontSize="8" fill="#8390b2">http://www.speedcubing.example/method.html</text>
      <text x="54" y="72" className="font-mono" fontSize="13" fontWeight="700" fill="#eef2ff">Speedcubing method</text>
      <line x1="54" y1="80" x2="346" y2="80" stroke="#26345f" />
      {steps.map((s, i) => (
        <g key={s.name}>
          <text x="54" y={108 + i * 34} className="font-mono" fontSize="10" fill="#8390b2">{`${i + 1}.`}</text>
          <text x="74" y={108 + i * 34} className="font-mono" fontSize="12" fill="#7fb0ff" textDecoration="underline">{s.name}</text>
          <MiniGrid x={300} y={90 + i * 34} cells={s.cells} />
        </g>
      ))}
    </Frame>
  )
}

/** 2003–2004: a competition hall. */
function Hall({ label }: { label: string }) {
  const rows = [
    { y: 128, w: 230, n: 4 },
    { y: 164, w: 290, n: 5 },
    { y: 202, w: 350, n: 6 },
  ]
  return (
    <Frame label={label}>
      <defs>
        <linearGradient id="a04-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1538" />
          <stop offset="1" stopColor="#050a1c" />
        </linearGradient>
        <linearGradient id="a04-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d4fb8" />
          <stop offset="1" stopColor="#0e2763" />
        </linearGradient>
      </defs>
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#a04-bg)" />
      <polygon points="120,0 160,0 230,260 40,260" fill="#5aa8ff" opacity="0.05" />
      <polygon points="240,0 280,0 370,260 180,260" fill="#5aa8ff" opacity="0.05" />
      <rect x="100" y="18" width="200" height="74" rx="6" fill="url(#a04-screen)" stroke="#3d7bff" strokeOpacity="0.6" />
      <IsoCube x={200} y={28} S={6} top={W} left={G} right={R} />
      <text x="200" y="80" textAnchor="middle" className="font-mono" fontSize="9" letterSpacing="2" fill="#eef2ff">WORLD CUBE ASSOCIATION</text>
      {rows.map((r) => {
        const x0 = 200 - r.w / 2
        const step = r.w / r.n
        return (
          <g key={r.y}>
            <rect x={x0} y={r.y} width={r.w} height="12" rx="2" fill="#1b2a55" />
            <rect x={x0} y={r.y + 12} width={r.w} height="4" fill="#111c3d" />
            {Array.from({ length: r.n }, (_, i) => {
              const cx = x0 + step * i + step / 2
              return (
                <g key={i}>
                  <rect x={cx - 14} y={r.y + 2} width="16" height="7" rx="2" fill="#2f7bff" opacity="0.75" />
                  <rect x={cx + 5} y={r.y - 6} width="9" height="9" rx="1.5" fill={[R, B, G, Y, O, W][(i + r.n) % 6]} />
                  <circle cx={cx} cy={r.y - 14} r="6" fill="#0c1530" stroke="#26345f" />
                </g>
              )
            })}
          </g>
        )
      })}
    </Frame>
  )
}

/** Today: a competition timer display and a speed cube. */
function Display({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <defs>
        <linearGradient id="atd-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1636" />
          <stop offset="1" stopColor="#060b1e" />
        </linearGradient>
        <filter id="atd-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="-400" y="-400" width="1200" height="1060" fill="url(#atd-bg)" />
      <rect x="30" y="66" width="200" height="104" rx="14" fill="#040507" stroke="#2a2f3d" />
      <rect x="42" y="78" width="176" height="80" rx="8" fill="#120505" />
      <text x="130" y="140" textAnchor="middle" className="font-mono" fontSize="56" fontWeight="700" fill="#ff3b3b" filter="url(#atd-glow)">
        {WORLD_RECORDS.single.time}
      </text>
      <text x="130" y="190" textAnchor="middle" className="font-mono" fontSize="9" letterSpacing="3" fill="#8390b2">TIMER</text>
      <g stroke="#7fb0ff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <line x1="246" y1="96" x2="270" y2="96" />
        <line x1="240" y1="118" x2="272" y2="118" />
        <line x1="248" y1="140" x2="268" y2="140" />
      </g>
      <g transform="rotate(-10 318 130)">
        <IsoCube
          x={320}
          y={64}
          S={20}
          top={[Y, W, W, W, Y, W, W, B, W]}
          left={[G, G, O, G, G, G, G, R, G]}
          right={[R, R, R, B, R, R, R, R, Y]}
        />
      </g>
    </Frame>
  )
}

const ART: Record<string, (p: { label: string }) => ReactNode> = {
  '1974': Blueprint,
  '1977': Shop,
  '1980': Globe,
  '1982': Scoreboard,
  '1997': Browser,
  '2004': Hall,
  today: Display,
}

export function EraArt({ id, label }: { id: string; label: string }) {
  const Art = ART[id]
  return Art ? <Art label={label} /> : null
}

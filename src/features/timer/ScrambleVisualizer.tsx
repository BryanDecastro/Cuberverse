import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, LayoutGrid } from 'lucide-react'
import { STICKER_HEX, type CubeApi } from '@/features/cube/CubeScene'
import { LazyCube } from '@/features/cube/LazyCube'
import { applyAlgN, faceGridN, solvedN } from '@/features/cube/nxn'
import { parseAlg, type Face } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import type { TimerEvent } from './types'

/** Net layout: U on top, then L F R B, then D under F. [face, column, row] in 3x3 blocks. */
const NET: Array<[Face, number, number]> = [
  ['U', 1, 0],
  ['L', 0, 1],
  ['F', 1, 1],
  ['R', 2, 1],
  ['B', 3, 1],
  ['D', 1, 2],
]

const SIZE: Record<TimerEvent, number> = { '222': 2, '333': 3, '444': 4 }

/** Flat net of the scrambled cube (white on top, green in front: WCA scrambling orientation). Any size. */
export function NetView({ scramble, size = 3, className }: { scramble: string; size?: number; className?: string }) {
  const grids = useMemo(() => {
    const s = applyAlgN(solvedN(size), scramble)
    return Object.fromEntries(NET.map(([f]) => [f, faceGridN(s, f)])) as Record<Face, Face[][]>
  }, [scramble, size])
  return (
    <div className={cx('grid aspect-[4/3] w-full grid-cols-4 grid-rows-3', size > 3 ? 'gap-[3px]' : 'gap-1', className)} data-net="" data-size={size}>
      {NET.map(([f, col, row]) => (
        <div
          key={f}
          className={cx('grid', size > 3 ? 'gap-px' : 'gap-[2px]')}
          style={{
            gridColumn: col + 1,
            gridRow: row + 1,
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
          aria-label={f}
        >
          {grids[f].flat().map((c, i) => (
            <span key={i} className="rounded-[2px]" style={{ background: STICKER_HEX[c] }} data-c={c} />
          ))}
        </div>
      ))}
    </div>
  )
}

type Pt = [number, number]
const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/**
 * The scrambled cube drawn in 3D perspective (top, front and right faces), for sizes
 * the WebGL cube does not cover. Same model and orientation as the net.
 */
export function IsoView({ scramble, size, label, className }: { scramble: string; size: number; label: string; className?: string }) {
  const faces = useMemo(() => {
    const s = applyAlgN(solvedN(size), scramble)
    return { U: faceGridN(s, 'U'), F: faceGridN(s, 'F'), R: faceGridN(s, 'R') }
  }, [scramble, size])
  // Cube outline: C is the front-top corner; U, F and R meet there.
  const k = 0.866
  const h = 70
  const A: Pt = [100, 12] // back-top
  const B: Pt = [100 + k * h, 12 + h / 2] // right-top
  const C: Pt = [100, 12 + h] // front-top
  const D: Pt = [100 - k * h, 12 + h / 2] // left-top
  const E: Pt = [B[0], B[1] + h] // right-bottom
  const F: Pt = [C[0], C[1] + h] // front-bottom
  const G: Pt = [D[0], D[1] + h] // left-bottom
  // Each face: origin, end of the first row, end of the first column (matching the net's grid order).
  const layout: Array<[keyof typeof faces, Pt, Pt, Pt]> = [
    ['U', A, B, D],
    ['F', D, C, G],
    ['R', C, B, F],
  ]
  const inset = size > 3 ? 0.08 : 0.07
  const cells: React.ReactElement[] = []
  for (const [face, o, colEnd, rowEnd] of layout) {
    const at = (u: number, v: number): Pt => {
      const top = lerp(o, colEnd, u)
      const off: Pt = [rowEnd[0] - o[0], rowEnd[1] - o[1]]
      return [top[0] + off[0] * v, top[1] + off[1] * v]
    }
    faces[face].forEach((row, j) =>
      row.forEach((c, i) => {
        const u0 = (i + inset) / size
        const u1 = (i + 1 - inset) / size
        const v0 = (j + inset) / size
        const v1 = (j + 1 - inset) / size
        const p = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)].map((q) => q.map((x) => x.toFixed(1)).join(',')).join(' ')
        cells.push(<polygon key={`${face}${i}-${j}`} points={p} fill={STICKER_HEX[c]} data-face={face} />)
      }),
    )
  }
  const outline = [A, B, E, F, G, D].map((q) => q.join(',')).join(' ')
  return (
    <svg viewBox="0 0 200 170" className={className} role="img" aria-label={label} data-iso={size}>
      <ellipse cx="100" cy="160" rx="62" ry="7" fill="#2f7bff" opacity="0.18" />
      <polygon points={outline} fill="#07080e" stroke="#07080e" strokeWidth="3" strokeLinejoin="round" />
      {cells}
    </svg>
  )
}

type View = '3d' | '2d' | 'both'

/**
 * The scramble shown three ways: text (elsewhere), a 2D net and a 3D cube.
 * Both pictures are built from the same move list on the same cube model,
 * so they always show exactly the same state.
 */
export function ScrambleVisualizer({ scramble, event, paused }: { scramble: string | null; event: TimerEvent; paused: boolean }) {
  const { t } = useI18n()
  const v = t.timer.visualizer
  const [view, setView] = useState<View>('both')
  const api = useRef<CubeApi>(null)
  const [ready, setReady] = useState(false)
  const size = SIZE[event]
  const webgl = event === '333'

  // Dev only: lets automated checks compare the 3D cube, the net and the model.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    import('@/features/cube/model').then((model) => Object.assign(window, { __cubeverseTimer: { api, model, parseAlg } }))
  }, [])

  // The WebGL cube is 3x3 only; it remounts when 3x3 comes back, so wait for it again.
  useEffect(() => {
    if (!webgl) setReady(false)
  }, [webgl])

  useEffect(() => {
    if (ready && scramble && webgl) {
      api.current?.setState(parseAlg(scramble))
      api.current?.lookAt('home')
    }
  }, [ready, scramble, webgl])

  const tab = (on: boolean) =>
    cx(
      'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors',
      on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink',
    )

  return (
    <section aria-labelledby="viz-title" className="glass flex h-full flex-col rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="viz-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Box size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {v.title}
        </h2>
        {
          <div role="radiogroup" aria-label={v.title} className="inline-flex rounded-xl border border-line bg-canvas/60 p-1">
            <button type="button" role="radio" aria-checked={view === '3d'} onClick={() => setView('3d')} className={tab(view === '3d')}>
              <Box size={14} aria-hidden="true" /> 3D
            </button>
            <button type="button" role="radio" aria-checked={view === '2d'} onClick={() => setView('2d')} className={tab(view === '2d')}>
              <LayoutGrid size={14} aria-hidden="true" /> {v.net}
            </button>
            <button type="button" role="radio" aria-checked={view === 'both'} onClick={() => setView('both')} className={tab(view === 'both')}>
              {v.both}
            </button>
          </div>
        }
      </div>

      {
        <div className={cx('mt-4 grid flex-1 items-center gap-3 sm:gap-4', view === 'both' && 'grid-cols-[1.1fr_1fr]')}>
          <div className={cx(view === '2d' && 'hidden')}>
            {webgl ? (
              <LazyCube
                apiRef={api}
                label={v.cubeLabel}
                pedestal={false}
                idleSpin={false}
                paused={paused}
                onReady={() => setReady(true)}
                className={cx('w-full sm:h-[280px]', view === 'both' ? 'h-[170px]' : 'h-[240px]')}
              />
            ) : scramble ? (
              <IsoView
                scramble={scramble}
                size={size}
                label={v.cubeLabel}
                className={cx('mx-auto w-full sm:h-[280px]', view === 'both' ? 'h-[170px]' : 'h-[240px]')}
              />
            ) : (
              <div className={cx('w-full animate-pulse rounded-lg bg-white/5', view === 'both' ? 'h-[170px]' : 'h-[240px]')} />
            )}
          </div>
          <div className={cx('mx-auto w-full max-w-[300px]', view === '3d' && 'hidden')}>
            {scramble ? <NetView scramble={scramble} size={size} /> : <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-white/5" />}
          </div>
        </div>
      }
      <p className="mt-3 text-xs text-ink-3">{v.orientation}</p>
    </section>
  )
}

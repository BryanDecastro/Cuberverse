import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, LayoutGrid } from 'lucide-react'
import { STICKER_HEX, type CubeApi } from '@/features/cube/CubeScene'
import { LazyCube } from '@/features/cube/LazyCube'
import { applyMoves, faceGrid, solvedState } from '@/features/cube/model'
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

/** Flat net of the scrambled cube (white on top, green in front: WCA scrambling orientation). */
export function NetView({ scramble, className }: { scramble: string; className?: string }) {
  const grids = useMemo(() => {
    const s = applyMoves(solvedState(), parseAlg(scramble))
    return Object.fromEntries(NET.map(([f]) => [f, faceGrid(s, f)])) as Record<Face, Face[][]>
  }, [scramble])
  return (
    <div className={cx('grid aspect-[4/3] w-full grid-cols-4 grid-rows-3 gap-1', className)} data-net="">
      {NET.map(([f, col, row]) => (
        <div key={f} className="grid grid-cols-3 grid-rows-3 gap-[2px]" style={{ gridColumn: col + 1, gridRow: row + 1 }} aria-label={f}>
          {grids[f].flat().map((c, i) => (
            <span key={i} className="rounded-[2px]" style={{ background: STICKER_HEX[c] }} data-c={c} />
          ))}
        </div>
      ))}
    </div>
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
  const supported = event === '333'

  // Dev only: lets automated checks compare the 3D cube, the net and the model.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    import('@/features/cube/model').then((model) => Object.assign(window, { __cubeverseTimer: { api, model, parseAlg } }))
  }, [])

  useEffect(() => {
    if (ready && scramble && supported) {
      api.current?.setState(parseAlg(scramble))
      api.current?.lookAt('home')
    }
  }, [ready, scramble, supported])

  const tab = (on: boolean) =>
    cx('inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')

  return (
    <section aria-labelledby="viz-title" className="glass flex h-full flex-col rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="viz-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Box size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {v.title}
        </h2>
        {supported && (
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
        )}
      </div>

      {!supported ? (
        <p className="mt-6 text-sm leading-relaxed text-ink-3">{v.only333}</p>
      ) : (
        <div className={cx('mt-4 grid flex-1 items-center gap-4', view === 'both' && 'sm:grid-cols-[1.1fr_1fr]')}>
          <div className={cx(view === '2d' && 'hidden')}>
            <LazyCube
              apiRef={api}
              label={v.cubeLabel}
              pedestal={false}
              idleSpin={false}
              paused={paused}
              onReady={() => setReady(true)}
              className="h-[240px] w-full sm:h-[280px]"
            />
          </div>
          <div className={cx('mx-auto w-full max-w-[300px]', view === '3d' && 'hidden')}>
            {scramble ? <NetView scramble={scramble} /> : <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-white/5" />}
          </div>
        </div>
      )}
      {supported && <p className="mt-3 text-xs text-ink-3">{v.orientation}</p>}
    </section>
  )
}

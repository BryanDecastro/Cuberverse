import { useEffect, useState } from 'react'
import { ArrowDownToLine, CheckCircle2, Map as MapIcon, Rotate3d } from 'lucide-react'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'
import { CROSS_FOCUS, VIEW_WHITE } from './shared'
import { WC_HOLD } from './positions'

/** Held yellow-up with the cross broken, for the "before" picture. */
const BEFORE = 'x2 F R\' U L\' D B2 R'

const PIECE_SQUARES = [1, 2, 3]

export function PartGoal() {
  const { t } = useI18n()
  const w = t.learn.whiteCross
  const p = w.p1
  const cube = useLessonCube()
  const [mode, setMode] = useState<'before' | 'after'>('after')
  const [onlyCross, setOnlyCross] = useState(true)
  const [fromBelow, setFromBelow] = useState(true)

  useEffect(() => {
    if (cube.ready) cube.api.current?.setState(parseAlg(mode === 'after' ? WC_HOLD : BEFORE))
  }, [cube.ready, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cube.setFocus(onlyCross ? CROSS_FOCUS : null)
  }, [onlyCross]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cube.ready) return
    if (fromBelow) cube.api.current?.setView(...VIEW_WHITE)
    else cube.api.current?.lookAt('home')
  }, [cube.ready, fromBelow]) // eslint-disable-line react-hooks/exhaustive-deps

  const seg = (on: boolean) =>
    cx('h-10 rounded-lg px-4 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')

  return (
    <>
      <ControlsSlot>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div role="radiogroup" aria-label={`${p.before} / ${p.after}`} className="inline-flex rounded-xl border border-line bg-canvas/60 p-1">
            <button type="button" role="radio" aria-checked={mode === 'before'} onClick={() => setMode('before')} className={seg(mode === 'before')}>
              {p.before}
            </button>
            <button type="button" role="radio" aria-checked={mode === 'after'} onClick={() => setMode('after')} className={seg(mode === 'after')}>
              {p.after}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFromBelow((v) => !v)}
            aria-pressed={fromBelow}
            className="btn inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-line-strong/70 px-3.5 text-sm text-ink-2 hover:text-ink"
          >
            {fromBelow ? <Rotate3d size={16} aria-hidden="true" /> : <ArrowDownToLine size={16} aria-hidden="true" />}
            {fromBelow ? w.viewTop : w.viewWhite}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={onlyCross}
            onClick={() => setOnlyCross((v) => !v)}
            className="btn inline-flex h-11 items-center gap-2.5 rounded-xl border border-line bg-canvas/60 px-3 text-sm text-ink-2 hover:text-ink"
          >
            <span className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300', onlyCross ? 'bg-accent' : 'bg-white/15')}>
              <span className={cx('absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300', onlyCross ? 'translate-x-[18px]' : 'translate-x-0.5')} />
            </span>
            {p.onlyCross}
          </button>
        </div>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>

        <p className="mt-5 text-sm font-semibold text-ink">{p.piecesTitle}</p>
        <ul className="mt-2 grid gap-2">
          {p.pieces.map((piece, i) => (
            <li key={piece.name} className={cx('flex items-start gap-3 rounded-xl border p-3', i === 1 ? 'border-accent-hover/60 bg-accent/10' : 'border-line')}>
              <span className="mt-0.5 flex w-12 shrink-0 gap-0.5" aria-hidden="true">
                {Array.from({ length: PIECE_SQUARES[i] }).map((_, k) => (
                  <span key={k} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: ['#f4f6fb', '#19b85a', '#e8283d'][k] }} />
                ))}
              </span>
              <span className="text-sm leading-relaxed text-ink-2">
                <strong className="text-ink">{piece.name}.</strong> {piece.text}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl border border-st-green/30 bg-st-green/[0.06] p-4">
          <p className="text-sm font-semibold text-ink">{p.checkTitle}</p>
          <ul className="mt-2 grid gap-1.5">
            {p.checks.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-ink-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#4fe08f]" aria-hidden="true" /> {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-2xl border border-line p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <MapIcon size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.planTitle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.planText}</p>
        </div>
      </PanelSlot>
    </>
  )
}

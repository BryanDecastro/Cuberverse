import { useEffect, useState } from 'react'
import { ArrowDownToLine, CheckCircle2, MapPin, Map as MapIcon, Rotate3d } from 'lucide-react'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'
import { VIEW_WHITE } from '../whiteCross/shared'
import { WHITE_FOCUS } from './shared'
import { FL_DONE, FL_FULL } from './positions'

export function PartGoal() {
  const { t } = useI18n()
  const f = t.learn.firstLayer
  const p = f.p1
  const wc = t.learn.whiteCross
  const cube = useLessonCube()
  const [mode, setMode] = useState<'before' | 'after'>('after')
  const [onlyWhite, setOnlyWhite] = useState(true)
  const [fromBelow, setFromBelow] = useState(true)

  useEffect(() => {
    if (cube.ready) cube.api.current?.setState(parseAlg(mode === 'after' ? FL_DONE : FL_FULL))
  }, [cube.ready, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cube.setFocus(onlyWhite ? WHITE_FOCUS : null)
  }, [onlyWhite]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cube.ready) return
    if (fromBelow) cube.api.current?.setView(...VIEW_WHITE)
    else cube.api.current?.lookAt('home')
  }, [cube.ready, fromBelow]) // eslint-disable-line react-hooks/exhaustive-deps

  const seg = (on: boolean) => cx('h-10 rounded-lg px-4 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')

  return (
    <>
      <ControlsSlot>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div role="radiogroup" aria-label={`${wc.p1.before} / ${wc.p1.after}`} className="inline-flex rounded-xl border border-line bg-canvas/60 p-1">
            <button type="button" role="radio" aria-checked={mode === 'before'} onClick={() => setMode('before')} className={seg(mode === 'before')}>
              {wc.p1.before}
            </button>
            <button type="button" role="radio" aria-checked={mode === 'after'} onClick={() => setMode('after')} className={seg(mode === 'after')}>
              {wc.p1.after}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFromBelow((v) => !v)}
            aria-pressed={fromBelow}
            className="btn inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-line-strong/70 px-3.5 text-sm text-ink-2 hover:text-ink"
          >
            {fromBelow ? <Rotate3d size={16} aria-hidden="true" /> : <ArrowDownToLine size={16} aria-hidden="true" />}
            {fromBelow ? wc.viewTop : wc.viewWhite}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={onlyWhite}
            onClick={() => setOnlyWhite((v) => !v)}
            className="btn inline-flex h-11 items-center gap-2.5 rounded-xl border border-line bg-canvas/60 px-3 text-sm text-ink-2 hover:text-ink"
          >
            <span className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300', onlyWhite ? 'bg-accent' : 'bg-white/15')}>
              <span className={cx('absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300', onlyWhite ? 'translate-x-[18px]' : 'translate-x-0.5')} />
            </span>
            {f.onlyWhite}
          </button>
        </div>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>
        <div className="mt-5 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <MapPin size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.spotTitle}
          </p>
          <div className="mt-2 flex items-start gap-3">
            <span className="mt-0.5 flex shrink-0 gap-0.5" aria-hidden="true">
              {['#f4f6fb', '#e8283d', '#19b85a'].map((c) => (
                <span key={c} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: c }} />
              ))}
            </span>
            <p className="text-sm leading-relaxed text-ink-2">{p.spotText}</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-st-green/30 bg-st-green/[0.06] p-4">
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

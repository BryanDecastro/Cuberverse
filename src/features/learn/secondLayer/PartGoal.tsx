import { useEffect, useState } from 'react'
import { ArrowDownUp, Search, Spline } from 'lucide-react'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'
import { ViewControls } from '../components/ViewControls'
import { TWO_LAYER_FOCUS } from './shared'
import { SL_DONE, SL_FULL } from './positions'

export function PartGoal() {
  const { t } = useI18n()
  const s = t.learn.secondLayer
  const p = s.p1
  const wc = t.learn.whiteCross.p1
  const cube = useLessonCube()
  const [mode, setMode] = useState<'before' | 'after'>('after')
  const [focusOn, setFocusOn] = useState(true)

  useEffect(() => {
    if (cube.ready) {
      cube.api.current?.setState(parseAlg(mode === 'after' ? SL_DONE : SL_FULL))
      cube.api.current?.setView(-0.62, 0.3)
    }
  }, [cube.ready, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cube.setFocus(focusOn ? TWO_LAYER_FOCUS : null)
  }, [focusOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const seg = (on: boolean) => cx('h-10 rounded-lg px-4 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')
  const tips = [
    { icon: Search, title: p.findTitle, text: p.findText },
    { icon: Spline, title: p.tTitle, text: p.tText },
    { icon: ArrowDownUp, title: p.algTitle, text: p.algText },
  ]

  return (
    <>
      <ControlsSlot>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div role="radiogroup" aria-label={`${wc.before} / ${wc.after}`} className="inline-flex rounded-xl border border-line bg-canvas/60 p-1">
            <button type="button" role="radio" aria-checked={mode === 'before'} onClick={() => setMode('before')} className={seg(mode === 'before')}>
              {wc.before}
            </button>
            <button type="button" role="radio" aria-checked={mode === 'after'} onClick={() => setMode('after')} className={seg(mode === 'after')}>
              {wc.after}
            </button>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={focusOn}
            onClick={() => setFocusOn((v) => !v)}
            className="btn inline-flex h-11 items-center gap-2.5 rounded-xl border border-line bg-canvas/60 px-3 text-sm text-ink-2 hover:text-ink"
          >
            <span className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300', focusOn ? 'bg-accent' : 'bg-white/15')}>
              <span className={cx('absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300', focusOn ? 'translate-x-[18px]' : 'translate-x-0.5')} />
            </span>
            {s.onlyTwo}
          </button>
          <ViewControls api={cube.api} compact />
        </div>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>
        <ol className="mt-5 grid gap-3">
          {tips.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-line p-4">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-mono text-sm text-[#8fb8ff]">{i + 1}</span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon size={15} className="text-[#8fb8ff]" aria-hidden="true" /> {title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </PanelSlot>
    </>
  )
}

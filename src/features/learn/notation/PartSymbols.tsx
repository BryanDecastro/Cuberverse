import { useEffect, useRef, useState } from 'react'
import { Clock, Eye, Play, Rotate3d } from 'lucide-react'
import type { Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { displayMove, moveDir } from '../notationText'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'

const DEMOS: Array<{ move: Move; key: 'normal' | 'prime' | 'double' }> = [
  { move: 'R', key: 'normal' },
  { move: "R'", key: 'prime' },
  { move: 'R2', key: 'double' },
]

export function PartSymbols() {
  const { t } = useI18n()
  const p = t.learn.notation.p2
  const cube = useLessonCube()
  const [selected, setSelected] = useState<Move>('R')
  const [straight, setStraight] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const demo = (m: Move) => {
    setSelected(m)
    window.clearTimeout(timer.current)
    const api = cube.api.current
    api?.reset()
    cube.setHighlight('R')
    cube.setArrow({ face: 'R', dir: moveDir(m) })
    // Let the arrow appear first, then turn.
    timer.current = window.setTimeout(() => cube.api.current?.play([m]), 650)
  }

  useEffect(() => {
    // Show the arrow for R on arrival, without moving yet.
    cube.setHighlight('R')
    cube.setArrow({ face: 'R', dir: 1 })
    return () => window.clearTimeout(timer.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cube.api.current?.lookAt(straight ? 'R' : 'home')
  }, [straight]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ControlsSlot>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {DEMOS.map(({ move, key }) => (
            <button
              key={move}
              type="button"
              onClick={() => demo(move)}
              aria-pressed={selected === move}
              aria-label={`${p.play} ${displayMove(move)}: ${p.cards[key].text}`}
              className={cx(
                'btn group flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-[background-color,border-color,transform] duration-300 active:scale-95',
                selected === move ? 'border-accent-hover bg-accent/20' : 'border-line-strong/60 bg-canvas/60 hover:bg-panel-2',
              )}
            >
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink-3">{p.cards[key].tag}</span>
              <span className="font-mono text-2xl font-medium text-ink sm:text-3xl">{displayMove(move)}</span>
              <span className="inline-flex items-center gap-1 text-xs text-[#8fb8ff]">
                <Play size={12} fill="currentColor" aria-hidden="true" /> {p.play}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setStraight((s) => !s)}
            aria-pressed={straight}
            className="btn inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-line-strong/70 px-3.5 text-sm text-ink-2 hover:text-ink"
          >
            {straight ? <Rotate3d size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            {straight ? p.lookHome : p.lookAt}
          </button>
        </div>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>
        <div className="mt-5 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock size={17} className="text-[#8fb8ff]" aria-hidden="true" />
            {p.clockTitle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.clockText}</p>
        </div>
        <dl className="mt-5 grid gap-2">
          {DEMOS.map(({ move, key }) => (
            <div
              key={move}
              className={cx(
                'flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300',
                selected === move ? 'border-accent-hover/60 bg-accent/10' : 'border-line',
              )}
            >
              <dt className="w-10 shrink-0 font-mono text-xl font-medium text-ink">{displayMove(move)}</dt>
              <dd className="text-sm leading-relaxed text-ink-2">
                <span className="mr-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-3">{p.cards[key].tag}</span>
                {p.cards[key].text}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-relaxed text-ink-3">{p.tip}</p>
      </PanelSlot>
    </>
  )
}

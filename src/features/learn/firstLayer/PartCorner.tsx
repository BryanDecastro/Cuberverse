import { useEffect, useMemo, useState } from 'react'
import { Repeat } from 'lucide-react'
import { planFirstLayer } from '@/features/cube/firstLayer'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { ControlsSlot, useLessonCube } from '../shell/LessonCubeContext'
import { StepPlayer } from '../shell/StepPlayer'
import { cornerStepText, WHITE_FOCUS } from './shared'
import { FL_CASES, type FlCase } from './positions'

const CASES = Object.keys(FL_CASES) as FlCase[]

export function PartCorner() {
  const { t } = useI18n()
  const p = t.learn.firstLayer.p2
  const cube = useLessonCube()
  const [selected, setSelected] = useState<FlCase>('right')

  // Planned from the real position; tests check the round counts match the copy.
  const steps = useMemo(() => planFirstLayer(applyMoves(solvedState(), parseAlg(FL_CASES[selected].setup))), [selected])

  useEffect(() => {
    cube.setFocus(WHITE_FOCUS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{p.pick}</p>
        <div role="radiogroup" aria-label={p.pick} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CASES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected === c}
              onClick={() => setSelected(c)}
              className={cx(
                'btn rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold leading-snug transition-[background-color,border-color] duration-300',
                selected === c ? 'border-accent-hover bg-accent/20 text-white' : 'border-line-strong/60 bg-canvas/60 text-ink hover:bg-panel-2',
              )}
            >
              {p.cases[c].name}
            </button>
          ))}
        </div>
      </ControlsSlot>
      <StepPlayer
        key={selected}
        setup={FL_CASES[selected].setup}
        steps={steps}
        describe={(i) => cornerStepText(t, steps[i])}
        doneText={p.done}
        panelTop={
          <>
            <p className="leading-relaxed text-ink-2">{p.lead}</p>
            <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Repeat size={16} className="text-st-yellow" aria-hidden="true" /> {p.ruleTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.ruleText}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
              <p className="text-sm font-semibold text-ink">{p.cases[selected].name}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{p.cases[selected].text}</p>
            </div>
          </>
        }
      />
    </>
  )
}

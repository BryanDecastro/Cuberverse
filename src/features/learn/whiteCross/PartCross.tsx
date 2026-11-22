import { useEffect, useMemo } from 'react'
import { ArrowDownToLine, Target } from 'lucide-react'
import { planCrossFromDaisy } from '@/features/cube/crossSolver'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { ControlsSlot, useLessonCube } from '../shell/LessonCubeContext'
import { CROSS_FOCUS, VIEW_WHITE, SIDE_VIEW, stepText } from './shared'
import { StepPlayer } from '../shell/StepPlayer'
import { WC_MIXED_DAISY } from './positions'

export function PartCross() {
  const { t } = useI18n()
  const w = t.learn.whiteCross
  const p = w.p3
  const cube = useLessonCube()
  const steps = useMemo(() => planCrossFromDaisy(applyMoves(solvedState(), parseAlg(WC_MIXED_DAISY))), [])

  useEffect(() => {
    cube.setFocus(CROSS_FOCUS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StepPlayer
        setup={WC_MIXED_DAISY}
        steps={steps}
        describe={(i) => stepText(t, steps[i])}
        viewFor={(i) => (steps[i].face ? SIDE_VIEW[steps[i].face!] : null)}
        panelTop={
          <>
            <p className="leading-relaxed text-ink-2">{p.lead}</p>
            <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Target size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.matchTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.matchText}</p>
            </div>
          </>
        }
      />
      <ControlsSlot>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => cube.api.current?.setView(...VIEW_WHITE)}
            className="btn inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-line-strong/70 px-3.5 text-sm text-ink-2 hover:text-ink"
          >
            <ArrowDownToLine size={16} aria-hidden="true" /> {w.viewWhite}
          </button>
        </div>
      </ControlsSlot>
    </>
  )
}

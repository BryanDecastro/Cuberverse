import { useEffect, useMemo } from 'react'
import { ArrowDownToLine, Rotate3d } from 'lucide-react'
import { planFirstLayer } from '@/features/cube/firstLayer'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { ControlsSlot, useLessonCube } from '../shell/LessonCubeContext'
import { StepPlayer } from '../shell/StepPlayer'
import { VIEW_WHITE } from '../whiteCross/shared'
import { cornerStepText, WHITE_FOCUS } from './shared'
import { FL_FULL } from './positions'

export function PartLayer() {
  const { t } = useI18n()
  const f = t.learn.firstLayer
  const p = f.p3
  const cube = useLessonCube()
  const steps = useMemo(() => planFirstLayer(applyMoves(solvedState(), parseAlg(FL_FULL))), [])

  useEffect(() => {
    cube.setFocus(WHITE_FOCUS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StepPlayer
        setup={FL_FULL}
        steps={steps}
        describe={(i) => cornerStepText(t, steps[i])}
        doneText={p.finished}
        panelTop={
          <>
            <p className="leading-relaxed text-ink-2">{p.lead}</p>
            <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Rotate3d size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.yTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.yText}</p>
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
            <ArrowDownToLine size={16} aria-hidden="true" /> {t.learn.whiteCross.viewWhite}
          </button>
        </div>
      </ControlsSlot>
    </>
  )
}

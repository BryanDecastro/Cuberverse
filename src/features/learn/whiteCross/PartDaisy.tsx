import { useEffect, useMemo, useState } from 'react'
import { FlipVertical2, ShieldCheck } from 'lucide-react'
import { planDaisy } from '@/features/cube/crossSolver'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from '../shell/LessonCubeContext'
import { CROSS_FOCUS, SIDE_VIEW, stepText } from './shared'
import { StepPlayer } from '../shell/StepPlayer'
import { WC_CASES, type WcCase } from './positions'

const CASES = Object.keys(WC_CASES) as WcCase[]

export function PartDaisy() {
  const { t } = useI18n()
  const w = t.learn.whiteCross
  const p = w.p2
  const cube = useLessonCube()
  const [selected, setSelected] = useState<WcCase | null>(null)
  const [holding, setHolding] = useState(false)

  // Planned from the real position, and checked by tests to equal the taught moves.
  const steps = useMemo(() => (selected ? planDaisy(applyMoves(solvedState(), parseAlg(WC_CASES[selected].setup))) : []), [selected])

  useEffect(() => {
    cube.setFocus(CROSS_FOCUS)
    // Start upright (white on top) so "how to hold it" has something to show.
    if (cube.ready && !selected) cube.api.current?.setState([])
  }, [cube.ready]) // eslint-disable-line react-hooks/exhaustive-deps

  useCubeEvents({
    onIdle: () => setHolding(false),
  })

  const showHold = () => {
    setSelected(null)
    cube.api.current?.setState([])
    cube.api.current?.lookAt('home')
    setHolding(true)
    window.setTimeout(() => cube.api.current?.play(['x2']), 500)
  }

  const rule = (
    <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ShieldCheck size={16} className="text-st-yellow" aria-hidden="true" /> {p.ruleTitle}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.ruleText}</p>
    </div>
  )

  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{p.pick}</p>
        <div role="radiogroup" aria-label={p.pick} className="grid gap-2 sm:grid-cols-3">
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
        {!selected && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={showHold}
              disabled={holding}
              className="btn inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-line-strong/70 px-4 text-sm font-semibold text-ink-2 hover:text-ink disabled:opacity-60"
            >
              <FlipVertical2 size={16} aria-hidden="true" /> {p.hold}
            </button>
          </div>
        )}
        {selected && <div className="mt-4" />}
      </ControlsSlot>

      {selected ? (
        <StepPlayer
          key={selected}
          setup={WC_CASES[selected].setup}
          steps={steps}
          describe={(i) => stepText(t, steps[i])}
          viewFor={(i) => (steps[i].face ? SIDE_VIEW[steps[i].face!] : null)}
          doneText={t.learn.whiteCross.petals.replace('{n}', '4')}
          panelTop={
            <>
              <p className="leading-relaxed text-ink-2">{p.lead}</p>
              {rule}
              <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
                <p className="text-sm font-semibold text-ink">{p.cases[selected].name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{p.cases[selected].text}</p>
              </div>
            </>
          }
        />
      ) : (
        <PanelSlot>
          <p className="leading-relaxed text-ink-2">{p.lead}</p>
          <p className="mt-4 rounded-xl border border-line p-3 text-sm leading-relaxed text-ink-2">
            <span className="mr-1.5 font-mono text-ink">x2</span> {p.holdText}
          </p>
          {rule}
          <ul className="mt-4 grid gap-2">
            {CASES.map((c) => (
              <li key={c} className="rounded-xl border border-line p-3 text-sm leading-relaxed text-ink-3">
                <strong className="text-ink">{p.cases[c].name}.</strong> {p.cases[c].text}
              </li>
            ))}
          </ul>
        </PanelSlot>
      )}
    </>
  )
}

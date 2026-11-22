import { useEffect, useMemo, useState } from 'react'
import { FlipHorizontal2 } from 'lucide-react'
import { isFirstLayerSolved } from '@/features/cube/firstLayer'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg } from '@/features/cube/moves'
import { isSecondLayerSolved, middleScramble, planSecondLayer, solvedMiddleEdges } from '@/features/cube/secondLayer'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { lessonPath } from '../lessons'
import { ControlsSlot, useLessonCube } from '../shell/LessonCubeContext'
import { LessonShell } from '../shell/LessonShell'
import { PlannerPractice } from '../shell/PlannerPractice'
import { StepPlayer } from '../shell/StepPlayer'
import { TaskQuiz } from '../shell/TaskQuiz'
import { PartGoal } from './PartGoal'
import { edgeStepText, TWO_LAYER_FOCUS } from './shared'
import { SL_CASES, SL_FULL, type SlCase } from './positions'

const CASES = Object.keys(SL_CASES) as SlCase[]
const planFrom = (setup: string) => planSecondLayer(applyMoves(solvedState(), parseAlg(setup)))

function PartEdge() {
  const { t } = useI18n()
  const p = t.learn.secondLayer.p2
  const cube = useLessonCube()
  const [selected, setSelected] = useState<SlCase>('right')
  const steps = useMemo(() => planFrom(SL_CASES[selected].setup), [selected])

  useEffect(() => {
    cube.setFocus(TWO_LAYER_FOCUS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{p.pick}</p>
        <div role="radiogroup" aria-label={p.pick} className="mb-4 grid gap-2 sm:grid-cols-3">
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
        setup={SL_CASES[selected].setup}
        steps={steps}
        describe={(i) => edgeStepText(t, steps[i])}
        doneText={p.done}
        panelTop={
          <>
            <p className="leading-relaxed text-ink-2">{p.lead}</p>
            <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
              <p className="text-sm font-semibold text-ink">{p.cases[selected].name}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{p.cases[selected].text}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-line p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FlipHorizontal2 size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.mirrorTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.mirrorText}</p>
            </div>
          </>
        }
      />
    </>
  )
}

function PartLayer() {
  const { t } = useI18n()
  const p = t.learn.secondLayer.p3
  const cube = useLessonCube()
  const steps = useMemo(() => planFrom(SL_FULL), [])
  useEffect(() => {
    cube.setFocus(TWO_LAYER_FOCUS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <StepPlayer
      setup={SL_FULL}
      steps={steps}
      describe={(i) => edgeStepText(t, steps[i])}
      doneText={p.finished}
      panelTop={<p className="leading-relaxed text-ink-2">{p.lead}</p>}
    />
  )
}

function PartPractice() {
  const { t } = useI18n()
  const s = t.learn.secondLayer
  return (
    <PlannerPractice
      makeScramble={() => middleScramble()}
      plan={planSecondLayer}
      describe={(step) => edgeStepText(t, step)}
      isDone={isSecondLayerSolved}
      status={(st) => [
        { label: s.layers, done: isFirstLayerSolved(st) },
        { label: fmt(s.edges, { n: solvedMiddleEdges(st) }), done: solvedMiddleEdges(st) === 4 },
      ]}
      copy={s.p4}
    />
  )
}

function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.secondLayer.p5
  return (
    <TaskQuiz
      lead={q.lead}
      idleSetup="x2"
      focus={TWO_LAYER_FOCUS}
      onFinish={onFinish}
      exercises={[
        { kind: 'choice', question: q.q1, options: [q.q1options[1], q.q1options[0], q.q1options[2]], correct: q.q1options[0], ok: q.fb.q1ok, no: q.fb.q1no },
        { kind: 'choice', question: q.q2, options: [q.q2options[1], q.q2options[2], q.q2options[0]], correct: q.q2options[0], ok: q.fb.q2ok, no: q.fb.q2no },
        { kind: 'task', question: q.q3, hint: q.q3hint, setup: SL_CASES.right.setup, done: isSecondLayerSolved, maxMoves: 8, ok: q.fb.q3ok, no: q.fb.q3no },
        { kind: 'task', question: q.q4, hint: q.q4hint, setup: SL_CASES.left.setup, done: isSecondLayerSolved, maxMoves: 8, ok: q.fb.q4ok, no: q.fb.q4no },
      ]}
    />
  )
}

const PARTS = [PartGoal, PartEdge, PartLayer, PartPractice]

/** Lesson 4: the middle edges, completing two layers. */
export function SecondLayerLesson() {
  const { t } = useI18n()
  const s = t.learn.secondLayer
  return (
    <LessonShell
      lessonId="second-layer"
      parts={s.parts}
      complete={s.complete}
      nextTo={lessonPath('yellow-cross')}
      renderPart={(i, finish) => {
        if (i < PARTS.length) {
          const Part = PARTS[i]
          return <Part key={i} />
        }
        return <PartQuiz key="quiz" onFinish={finish} />
      }}
    />
  )
}

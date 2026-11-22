import { useEffect, useMemo, useState } from 'react'
import { ArrowUpToLine, Clock9, Puzzle, Info } from 'lucide-react'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg, type Face } from '@/features/cube/moves'
import { isSecondLayerSolved } from '@/features/cube/secondLayer'
import { EDGE_FLIP, isYellowCross, planYellowCross, topScramble, topShape, type TopShape, type YellowStep } from '@/features/cube/yellowCross'
import type { Dictionary } from '@/i18n/en'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { lessonPath } from '../lessons'
import { describeMove, displayMove } from '../notationText'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'
import { LessonShell } from '../shell/LessonShell'
import { PlannerPractice } from '../shell/PlannerPractice'
import { StepPlayer } from '../shell/StepPlayer'
import { TaskQuiz } from '../shell/TaskQuiz'
import { YC_CASES, YC_DONE, YC_LINE_READY, type YcCase } from './positions'

/** 'D' is the yellow color id. Keep centers and yellow edges in color. */
const YELLOW_EDGES = (colors: Face[]) => colors.length === 1 || (colors.length === 2 && colors.includes('D'))

const stepText = (t: Dictionary, step: YellowStep) => fmt(t.learn.yellowCross.steps[step.kind], { moves: step.moves.map(displayMove).join(' ') })
const planFrom = (setup: string) => planYellowCross(applyMoves(solvedState(), parseAlg(setup)))

/** Little top-view diagram of a shape: a 3x3 grid, yellow where edges show yellow. */
function ShapeIcon({ shape }: { shape: Exclude<TopShape, 'mixed'> }) {
  const on: Record<Exclude<TopShape, 'mixed'>, number[]> = { dot: [4], l: [1, 3, 4], line: [3, 4, 5], cross: [1, 3, 4, 5, 7] }
  return (
    <span className="grid h-9 w-9 shrink-0 grid-cols-3 gap-0.5" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="rounded-[2px]" style={{ background: on[shape].includes(i) ? '#ffc93c' : 'rgb(255 255 255 / 0.1)' }} />
      ))}
    </span>
  )
}

const SHAPE_SETUP: Record<Exclude<TopShape, 'mixed'>, string> = { dot: YC_CASES.dot.setup, l: `${YC_CASES.l.setup} U'`, line: YC_LINE_READY, cross: YC_DONE }

function PartShapes() {
  const { t } = useI18n()
  const y = t.learn.yellowCross
  const cube = useLessonCube()
  const [shape, setShape] = useState<Exclude<TopShape, 'mixed'>>('cross')

  useEffect(() => {
    cube.setFocus(YELLOW_EDGES)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cube.ready) return
    cube.api.current?.setState(parseAlg(SHAPE_SETUP[shape]))
    cube.api.current?.setView(0, 1.2)
  }, [cube.ready, shape]) // eslint-disable-line react-hooks/exhaustive-deps

  const shapes: Array<Exclude<TopShape, 'mixed'>> = ['dot', 'l', 'line', 'cross']
  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{y.p1.pick}</p>
        <div role="radiogroup" aria-label={y.p1.pick} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {shapes.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={shape === s}
              onClick={() => setShape(s)}
              className={cx(
                'btn flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-[background-color,border-color] duration-300',
                shape === s ? 'border-accent-hover bg-accent/20 text-white' : 'border-line-strong/60 bg-canvas/60 text-ink hover:bg-panel-2',
              )}
            >
              <ShapeIcon shape={s} /> {y.shapes[s]}
            </button>
          ))}
        </div>
      </ControlsSlot>
      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{y.p1.lead}</p>
        <ul className="mt-5 grid gap-2">
          {shapes.map((s) => (
            <li key={s} className={cx('flex items-start gap-3 rounded-xl border p-3', shape === s ? 'border-accent-hover/60 bg-accent/10' : 'border-line')}>
              <ShapeIcon shape={s} />
              <span className="text-sm leading-relaxed text-ink-2">
                <strong className="text-ink">{y.shapes[s]}.</strong> {y.p1.shapes[s]}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl border border-line p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Info size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {y.p1.noteTitle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{y.p1.noteText}</p>
        </div>
      </PanelSlot>
    </>
  )
}

function PartMove() {
  const { t } = useI18n()
  const p = t.learn.yellowCross.p2
  const cube = useLessonCube()
  const steps = useMemo(() => EDGE_FLIP.map((m) => ({ moves: [m] })), [])
  useEffect(() => {
    cube.setFocus(YELLOW_EDGES)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <StepPlayer
      setup={YC_LINE_READY}
      steps={steps}
      describe={(i) => describeMove(t, EDGE_FLIP[i])}
      doneText={p.done}
      panelTop={
        <>
          <p className="leading-relaxed text-ink-2">{p.lead}</p>
          <div className="mt-4 rounded-2xl border border-violet/35 bg-violet/[0.07] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Puzzle size={16} className="text-[#b69bff]" aria-hidden="true" /> {p.memoTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.memoText}</p>
          </div>
        </>
      }
    />
  )
}

const CASES = Object.keys(YC_CASES) as YcCase[]

function PartCases() {
  const { t } = useI18n()
  const y = t.learn.yellowCross
  const p = y.p3
  const cube = useLessonCube()
  const [selected, setSelected] = useState<YcCase>('dot')
  const steps = useMemo(() => planFrom(YC_CASES[selected].setup), [selected])
  useEffect(() => {
    cube.setFocus(YELLOW_EDGES)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{p.pick}</p>
        <div role="radiogroup" aria-label={p.pick} className="mb-3 grid grid-cols-3 gap-2">
          {CASES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected === c}
              onClick={() => setSelected(c)}
              className={cx(
                'btn flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-[background-color,border-color] duration-300',
                selected === c ? 'border-accent-hover bg-accent/20 text-white' : 'border-line-strong/60 bg-canvas/60 text-ink hover:bg-panel-2',
              )}
            >
              <ShapeIcon shape={c} /> {y.shapes[c]}
            </button>
          ))}
        </div>
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => cube.api.current?.setView(0, 1.2)}
            className="btn inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-line-strong/70 px-3.5 text-sm text-ink-2 hover:text-ink"
          >
            <ArrowUpToLine size={16} aria-hidden="true" /> {y.viewTop}
          </button>
        </div>
      </ControlsSlot>
      <StepPlayer
        key={selected}
        setup={YC_CASES[selected].setup}
        steps={steps}
        describe={(i) => stepText(t, steps[i])}
        doneText={p.done}
        panelTop={
          <>
            <p className="leading-relaxed text-ink-2">{p.lead}</p>
            <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock9 size={16} className="text-st-yellow" aria-hidden="true" /> {p.ruleTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.ruleText}</p>
            </div>
          </>
        }
      />
    </>
  )
}

function PartPractice() {
  const { t } = useI18n()
  const y = t.learn.yellowCross
  return (
    <PlannerPractice
      makeScramble={() => topScramble()}
      plan={planYellowCross}
      describe={(step) => stepText(t, step)}
      isDone={isYellowCross}
      status={(s) => [
        { label: y.twoLayers, done: isSecondLayerSolved(s) },
        { label: fmt(y.shapeNow, { shape: y.shapes[topShape(s)] }), done: isYellowCross(s) },
      ]}
      copy={y.p4}
    />
  )
}

function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.yellowCross.p5
  return (
    <TaskQuiz
      lead={q.lead}
      idleSetup={YC_DONE}
      focus={YELLOW_EDGES}
      onFinish={onFinish}
      exercises={[
        { kind: 'choice', question: q.q1, options: [q.q1options[1], q.q1options[0], q.q1options[2]], correct: q.q1options[0], ok: q.fb.q1ok, no: q.fb.q1no },
        { kind: 'choice', question: q.q2, options: [q.q2options[1], q.q2options[2], q.q2options[0]], correct: q.q2options[0], ok: q.fb.q2ok, no: q.fb.q2no },
        { kind: 'task', question: q.q3, hint: q.q3hint, setup: YC_LINE_READY, done: isYellowCross, maxMoves: 6, ok: q.fb.q3ok, no: q.fb.q3no },
        { kind: 'task', question: q.q4, hint: q.q4hint, setup: YC_CASES.line.setup, done: isYellowCross, maxMoves: 7, ok: q.fb.q4ok, no: q.fb.q4no },
      ]}
    />
  )
}

const PARTS = [PartShapes, PartMove, PartCases, PartPractice]

/** Lesson 5: orient the top edges into a yellow cross. */
export function YellowCrossLesson() {
  const { t } = useI18n()
  const y = t.learn.yellowCross
  return (
    <LessonShell
      lessonId="yellow-cross"
      parts={y.parts}
      complete={y.complete}
      nextTo={lessonPath('yellow-face')}
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

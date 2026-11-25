import { useEffect, useMemo, useState } from 'react'
import { Car, Music, SplitSquareHorizontal } from 'lucide-react'
import { cornersPlaced, finishedSides, isCubeSolved, lastLayerScramble, planLastLayer, type LastStep } from '@/features/cube/lastLayer'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg } from '@/features/cube/moves'
import { isYellowFace } from '@/features/cube/yellowFace'
import type { Dictionary } from '@/i18n/en'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx, fmt } from '@/lib/format'
import { displayMove } from '../notationText'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'
import { LessonShell } from '../shell/LessonShell'
import { PlannerPractice } from '../shell/PlannerPractice'
import { StepPlayer } from '../shell/StepPlayer'
import { TaskQuiz } from '../shell/TaskQuiz'
import { FS_CORNERS, FS_DONE, FS_EDGES, FS_FULL, type FsCornerCase, type FsEdgeCase } from './positions'

const stepText = (t: Dictionary, step: LastStep) =>
  fmt(t.learn.finalSolve.steps[step.kind], { moves: step.moves.map(displayMove).join(' '), round: step.round ?? 1 })
const planFrom = (setup: string) => planLastLayer(applyMoves(solvedState(), parseAlg(setup)))

function PartGoal() {
  const { t } = useI18n()
  const f = t.learn.finalSolve
  const wc = t.learn.whiteCross.p1
  const cube = useLessonCube()
  const [mode, setMode] = useState<'before' | 'after'>('before')
  useEffect(() => {
    if (!cube.ready) return
    cube.api.current?.setState(parseAlg(mode === 'after' ? FS_DONE : FS_FULL))
    cube.api.current?.lookAt('home')
  }, [cube.ready, mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const seg = (on: boolean) => cx('h-10 rounded-lg px-4 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')
  return (
    <>
      <ControlsSlot>
        <div className="flex justify-center">
          <div role="radiogroup" aria-label={`${wc.before} / ${wc.after}`} className="inline-flex rounded-xl border border-line bg-canvas/60 p-1">
            <button type="button" role="radio" aria-checked={mode === 'before'} onClick={() => setMode('before')} className={seg(mode === 'before')}>
              {wc.before}
            </button>
            <button type="button" role="radio" aria-checked={mode === 'after'} onClick={() => setMode('after')} className={seg(mode === 'after')}>
              {wc.after}
            </button>
          </div>
        </div>
      </ControlsSlot>
      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{f.p1.lead}</p>
        <ol className="mt-5 grid gap-3">
          {f.p1.stages.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-2xl border border-line p-4">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-mono text-sm text-[#8fb8ff]">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Car size={16} className="text-st-yellow" aria-hidden="true" /> {f.p1.headlightsTitle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{f.p1.headlightsText}</p>
        </div>
      </PanelSlot>
    </>
  )
}

function CasePicker<K extends string>({ cases, selected, onSelect, label }: { cases: Record<K, { name: string }>; selected: K; onSelect: (k: K) => void; label: string }) {
  const keys = Object.keys(cases) as K[]
  return (
    <ControlsSlot>
      <p className="mb-3 text-center text-sm text-ink-3">{label}</p>
      <div role="radiogroup" aria-label={label} className="mb-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }}>
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={selected === k}
            onClick={() => onSelect(k)}
            className={cx(
              'btn rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-[background-color,border-color] duration-300',
              selected === k ? 'border-accent-hover bg-accent/20 text-white' : 'border-line-strong/60 bg-canvas/60 text-ink hover:bg-panel-2',
            )}
          >
            {cases[k].name}
          </button>
        ))}
      </div>
    </ControlsSlot>
  )
}

function PartCorners() {
  const { t } = useI18n()
  const p = t.learn.finalSolve.p2
  const [selected, setSelected] = useState<FsCornerCase>('headlights')
  // The corner steps only, up to matching the centers.
  const steps = useMemo(() => {
    const plan = planFrom(FS_CORNERS[selected].setup)
    const end = plan.findIndex((s) => s.kind === 'alignCorners')
    return end === -1 ? plan.filter((s) => !s.kind.startsWith('edges') && s.kind !== 'turnBar') : plan.slice(0, end + 1)
  }, [selected])
  return (
    <>
      <CasePicker cases={p.cases} selected={selected} onSelect={setSelected} label={p.pick} />
      <StepPlayer
        key={selected}
        setup={FS_CORNERS[selected].setup}
        steps={steps}
        describe={(i) => stepText(t, steps[i])}
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
                <SplitSquareHorizontal size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.tipTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.tipText}</p>
            </div>
          </>
        }
      />
    </>
  )
}

function PartEdges() {
  const { t } = useI18n()
  const p = t.learn.finalSolve.p3
  const [selected, setSelected] = useState<FsEdgeCase>('once')
  const steps = useMemo(() => planFrom(FS_EDGES[selected].setup), [selected])
  return (
    <>
      <CasePicker cases={p.cases} selected={selected} onSelect={setSelected} label={p.pick} />
      <StepPlayer
        key={selected}
        setup={FS_EDGES[selected].setup}
        steps={steps}
        describe={(i) => stepText(t, steps[i])}
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
                <Music size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.tipTitle}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.tipText}</p>
            </div>
          </>
        }
      />
    </>
  )
}

function PartPractice() {
  const { t } = useI18n()
  const f = t.learn.finalSolve
  return (
    <PlannerPractice
      makeScramble={() => lastLayerScramble()}
      plan={planLastLayer}
      describe={(step) => stepText(t, step)}
      isDone={isCubeSolved}
      status={(s) => [
        { label: f.cornersDone, done: cornersPlaced(s) },
        { label: fmt(f.sidesDone, { n: finishedSides(s) }), done: finishedSides(s) === 4 },
        { label: f.solvedChip, done: isCubeSolved(s) },
      ]}
      copy={f.p4}
    />
  )
}

function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.finalSolve.p5
  return (
    <TaskQuiz
      lead={q.lead}
      idleSetup={FS_DONE}
      onFinish={onFinish}
      exercises={[
        { kind: 'choice', question: q.q1, options: [q.q1options[1], q.q1options[0], q.q1options[2]], correct: q.q1options[0], ok: q.fb.q1ok, no: q.fb.q1no },
        { kind: 'choice', question: q.q2, options: [q.q2options[1], q.q2options[2], q.q2options[0]], correct: q.q2options[0], ok: q.fb.q2ok, no: q.fb.q2no },
        { kind: 'task', question: q.q3, hint: q.q3hint, setup: FS_CORNERS.headlights.setup, done: (s) => cornersPlaced(s) && isYellowFace(s), maxMoves: 12, ok: q.fb.q3ok, no: q.fb.q3no },
        { kind: 'task', question: q.q4, hint: q.q4hint, setup: FS_EDGES.once.setup, done: isCubeSolved, maxMoves: 13, ok: q.fb.q4ok, no: q.fb.q4no },
      ]}
    />
  )
}

const PARTS = [PartGoal, PartCorners, PartEdges, PartPractice]

/** Lesson 7: place the last layer and solve the cube. Leads into the first timed solve. */
export function FinalSolveLesson() {
  const { t } = useI18n()
  const f = t.learn.finalSolve
  return (
    <LessonShell
      lessonId="final-solve"
      parts={f.parts}
      complete={f.complete}
      nextTo={routes.timer + '?first=1'}
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

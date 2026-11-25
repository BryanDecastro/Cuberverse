import { useEffect, useMemo, useState } from 'react'
import { ArrowUpToLine, Hand, ListChecks, RotateCw, ShieldCheck } from 'lucide-react'
import { applyMoves, solvedState } from '@/features/cube/model'
import { parseAlg, type Face } from '@/features/cube/moves'
import { isSecondLayerSolved } from '@/features/cube/secondLayer'
import { cornersUp, cornerTwistScramble, isYellowFace, planYellowFace, readyForSune, SUNE, type FaceStep } from '@/features/cube/yellowFace'
import type { Dictionary } from '@/i18n/en'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { lessonPath } from '../lessons'
import { displayMove } from '../notationText'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'
import { LessonShell } from '../shell/LessonShell'
import { PlannerPractice } from '../shell/PlannerPractice'
import { StepPlayer } from '../shell/StepPlayer'
import { TaskQuiz } from '../shell/TaskQuiz'
import { CaseDiagram } from './CaseDiagram'
import { YF_CASE_IDS, YF_CASES, YF_DONE, YF_FULL, YF_TURN_TASK, type YfCase } from './positions'

/** 'D' is the yellow color id. Keep centers and every yellow piece in color. */
const YELLOW_LAYER = (colors: Face[]) => colors.length === 1 || colors.includes('D')

const WHERE = ['left', 'up', 'front'] as const
const stepText = (t: Dictionary, step: FaceStep) => {
  const y = t.learn.yellowFace.steps
  return fmt(y[step.kind], { moves: step.moves.map(displayMove).join(' '), where: y.where[WHERE[Math.min(step.up, 2)]] })
}
const planFrom = (setup: string) => planYellowFace(applyMoves(solvedState(), parseAlg(setup)))

function useFocus() {
  const cube = useLessonCube()
  useEffect(() => {
    cube.setFocus(YELLOW_LAYER)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

function PartGoal() {
  const { t } = useI18n()
  const y = t.learn.yellowFace
  const wc = t.learn.whiteCross.p1
  const cube = useLessonCube()
  const [mode, setMode] = useState<'before' | 'after'>('after')
  useFocus()
  useEffect(() => {
    if (!cube.ready) return
    cube.api.current?.setState(parseAlg(mode === 'after' ? YF_DONE : YF_FULL))
    cube.api.current?.lookAt('home')
  }, [cube.ready, mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const seg = (on: boolean) => cx('h-10 rounded-lg px-4 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')
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
            onClick={() => cube.api.current?.setView(0, 1.2)}
            className="btn inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-line-strong/70 px-3.5 text-sm text-ink-2 hover:text-ink"
          >
            <ArrowUpToLine size={16} aria-hidden="true" /> {t.learn.yellowCross.viewTop}
          </button>
        </div>
      </ControlsSlot>
      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{y.p1.lead}</p>
        <div className="mt-5 rounded-2xl border border-accent/35 bg-accent/[0.07] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <RotateCw size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {y.p1.twistedTitle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{y.p1.twistedText}</p>
        </div>
        <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck size={16} className="text-st-yellow" aria-hidden="true" /> {y.p1.rulesTitle}
          </p>
          <ol className="mt-2 grid gap-2">
            {y.p1.rules.map((r, i) => (
              <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                <span className="font-mono text-st-yellow">{i + 1}</span> {r}
              </li>
            ))}
          </ol>
        </div>
      </PanelSlot>
    </>
  )
}

/** The Sune itself, shown on the case it solves in one go. */
function PartSune() {
  const { t } = useI18n()
  const p = t.learn.yellowFace.p2
  useFocus()
  const steps = useMemo(() => [{ moves: SUNE.slice(0, 4) }, { moves: SUNE.slice(4) }], [])
  return (
    <StepPlayer
      setup={YF_CASES.sune.setup}
      steps={steps}
      describe={(i) => p.steps[i]}
      doneText={p.done}
      panelTop={
        <>
          <p className="leading-relaxed text-ink-2">{p.lead}</p>
          <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/[0.08] p-4">
            <p className="text-sm font-semibold text-ink">{p.algTitle}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[1.5rem] font-semibold text-white" data-sune="">
              <span>{p.halves[0]}</span>
              <span className="text-ink-3">·</span>
              <span>{p.halves[1]}</span>
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-canvas/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Hand size={16} className="text-[#8fb8ff]" aria-hidden="true" /> {p.tipsTitle}
            </p>
            <ul className="mt-2 grid gap-2">
              {p.tips.map((tip) => (
                <li key={tip} className="text-sm leading-relaxed text-ink-2">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    />
  )
}

/** All seven cases: how each looks, how to hold it, and the Sunes that finish it. */
function PartCases() {
  const { t } = useI18n()
  const p = t.learn.yellowFace.p3
  const [selected, setSelected] = useState<YfCase>('sune')
  useFocus()
  const c = YF_CASES[selected]
  const steps = useMemo(() => planFrom(c.setup), [c.setup])
  const sunes = (n: number) => fmt(n === 1 ? p.sunes : p.sunesMany, { n })
  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{p.pick}</p>
        <div role="radiogroup" aria-label={p.pick} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" data-cases="">
          {YF_CASE_IDS.map((id) => {
            const cs = YF_CASES[id]
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected === id}
                onClick={() => setSelected(id)}
                data-case={id}
                className={cx(
                  'btn flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center transition-[background-color,border-color] duration-300',
                  selected === id ? 'border-accent-hover bg-accent/20' : 'border-line-strong/60 bg-canvas/60 hover:bg-panel-2',
                )}
              >
                <CaseDiagram top={cs.top} label={p.cases[id].name} className="h-16 w-16" />
                <span className={cx('text-[0.8rem] font-semibold leading-tight', selected === id ? 'text-white' : 'text-ink')}>{p.cases[id].name}</span>
                <span className="text-[0.7rem] text-ink-3">
                  {p.up[cs.up]} · {sunes(cs.sunes)}
                </span>
              </button>
            )
          })}
        </div>
      </ControlsSlot>
      <StepPlayer
        key={selected}
        setup={c.setup}
        steps={steps}
        describe={(i) => stepText(t, steps[i])}
        doneText={p.done}
        panelTop={
          <>
            <p className="leading-relaxed text-ink-2">{p.lead}</p>
            <div className="mt-4 flex gap-4 rounded-2xl border border-accent/40 bg-accent/[0.08] p-4" data-hold={selected}>
              <CaseDiagram top={c.top} label={p.cases[selected].name} className="h-20 w-20 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {p.holdTitle}: {p.cases[selected].name}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.cases[selected].hold}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ListChecks size={16} className="text-st-yellow" aria-hidden="true" /> {p.ruleTitle}
              </p>
              <ol className="mt-2 grid gap-2">
                {p.rule.map((r, i) => (
                  <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                    <span className="font-mono text-st-yellow">{i}</span> {r}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.ruleEnd}</p>
            </div>
          </>
        }
      />
    </>
  )
}

function PartPractice() {
  const { t } = useI18n()
  const y = t.learn.yellowFace
  return (
    <PlannerPractice
      makeScramble={() => cornerTwistScramble()}
      plan={planYellowFace}
      describe={(step) => stepText(t, step)}
      isDone={isYellowFace}
      status={(s) => [
        { label: fmt(y.cornersUp, { n: cornersUp(s) }), done: cornersUp(s) === 4 },
        { label: y.bottom, done: isSecondLayerSolved(s) },
      ]}
      copy={y.p4}
    />
  )
}

function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.yellowFace.p5
  return (
    <TaskQuiz
      lead={q.lead}
      idleSetup={YF_DONE}
      onFinish={onFinish}
      exercises={[
        { kind: 'choice', question: q.q1, options: [q.q1options[1], q.q1options[0], q.q1options[2]], correct: q.q1options[0], ok: q.fb.q1ok, no: q.fb.q1no },
        { kind: 'choice', question: q.q2, options: [q.q2options[1], q.q2options[0], q.q2options[2]], correct: q.q2options[0], ok: q.fb.q2ok, no: q.fb.q2no },
        { kind: 'task', question: q.q3, hint: q.q3hint, setup: YF_CASES.sune.setup, done: isYellowFace, maxMoves: 7, ok: q.fb.q3ok, no: q.fb.q3no },
        { kind: 'task', question: q.q4, hint: q.q4hint, setup: YF_TURN_TASK, done: (s) => cornersUp(s) === 2 && readyForSune(s), maxMoves: 2, ok: q.fb.q4ok, no: q.fb.q4no },
      ]}
    />
  )
}

const PARTS = [PartGoal, PartSune, PartCases, PartPractice]

/** Lesson 6: orient the top corners with the Sune for a fully yellow face. */
export function YellowFaceLesson() {
  const { t } = useI18n()
  const y = t.learn.yellowFace
  return (
    <LessonShell
      lessonId="yellow-face"
      parts={y.parts}
      complete={y.complete}
      nextTo={lessonPath('final-solve')}
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

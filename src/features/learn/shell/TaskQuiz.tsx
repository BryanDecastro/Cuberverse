import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Flag, Lightbulb } from 'lucide-react'
import { fromColorMap, type CubeState } from '@/features/cube/model'
import type { Face } from '@/features/cube/moves'
import { parseAlg, type Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { Feedback } from '../components/Feedback'
import { MovePad } from '../components/MovePad'
import { ViewControls } from '../components/ViewControls'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from './LessonCubeContext'
import { useMoveKeys } from './useMoveKeys'

export type ChoiceExercise = { kind: 'choice'; question: string; options: string[]; correct: string; ok: string; no: string }
export type TaskExercise = {
  kind: 'task'
  question: string
  hint: string
  /** Start position, from a solved cube. */
  setup: string
  /** Checked on the cube's real state after every move. */
  done: (s: CubeState) => boolean
  /** After this many moves without success, explain and start the task again. */
  maxMoves: number
  ok: string
  no: string
}
export type Exercise = ChoiceExercise | TaskExercise

type Result = { ok: boolean; text: string } | null

/**
 * A lesson quiz: multiple-choice questions and hands-on tasks on the cube.
 * Feedback always pairs an icon and a label with the explanation.
 */
export function TaskQuiz({
  lead,
  exercises,
  idleSetup,
  focus,
  onFinish,
}: {
  lead?: string
  exercises: Exercise[]
  /** Position shown during choice questions. */
  idleSetup: string
  focus?: ((colors: Face[]) => boolean) | null
  onFinish: () => void
}) {
  const { t } = useI18n()
  const common = t.learn.notation.p5
  const cube = useLessonCube()
  const [ex, setEx] = useState(0)
  const [result, setResult] = useState<Result>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const pending = useRef(false)
  const total = exercises.length
  const cur = exercises[ex]
  const task = cur.kind === 'task' ? cur : null

  const setUpTask = () => {
    if (!task) return
    cube.api.current?.setState(parseAlg(task.setup))
    cube.api.current?.lookAt('home')
    setCount(0)
    setLocked(false)
  }

  useEffect(() => {
    cube.setFocus(focus ?? null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cube.ready) return
    if (task) setUpTask()
    else cube.api.current?.setState(parseAlg(idleSetup))
  }, [cube.ready, ex]) // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (n: number) => {
    setEx(n)
    setResult(null)
    setPicked(null)
  }

  const onMove = (m: Move) => {
    if (!task || locked || result?.ok) return
    cube.api.current?.play([m])
    setCount((c) => c + 1)
    pending.current = true
    setResult(null)
  }
  useMoveKeys(onMove, !!task)

  useCubeEvents({
    onIdle: () => {
      if (!task || !pending.current || !cube.api.current) return
      pending.current = false
      const s = fromColorMap(cube.api.current.readState())
      if (task.done(s)) {
        setResult({ ok: true, text: task.ok })
      } else if (count >= task.maxMoves) {
        setResult({ ok: false, text: task.no })
        setLocked(true)
        window.setTimeout(setUpTask, 1100)
      }
    },
  })

  const optionBtn = (opt: string, correct: string) =>
    cx(
      'btn flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition-[background-color,border-color] duration-300',
      picked !== opt
        ? 'border-line-strong/60 bg-canvas/50 text-ink hover:bg-panel-2'
        : opt === correct
          ? 'border-st-green/60 bg-st-green/10 text-ink'
          : 'border-[#ff6b7d]/50 bg-[#ff6b7d]/[0.07] text-ink',
    )

  return (
    <>
      <ControlsSlot>
        {task ? (
          <>
            <MovePad onMove={onMove} disabled={locked || !!result?.ok} />
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-ink-3">
              <Lightbulb size={14} className="text-st-yellow" aria-hidden="true" /> {task.hint}
            </p>
          </>
        ) : (
          <ViewControls api={cube.api} />
        )}
      </ControlsSlot>

      <PanelSlot>
        {lead && <p className="mb-4 leading-relaxed text-ink-2">{lead}</p>}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {exercises.map((_, i) => (
            <span key={i} className={cx('h-1.5 flex-1 rounded-full', i < ex ? 'bg-st-green' : i === ex ? 'bg-accent' : 'bg-white/10')} />
          ))}
        </div>
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[#7fb0ff]">{fmt(common.exercise, { n: ex + 1, total })}</p>
        <h3 className="mt-2 font-display text-xl font-semibold leading-snug">{cur.question}</h3>

        {cur.kind === 'choice' && (
          <div className="mt-4 grid gap-2">
            {cur.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (result?.ok) return
                  setPicked(opt)
                  setResult(opt === cur.correct ? { ok: true, text: cur.ok } : { ok: false, text: cur.no })
                }}
                className={optionBtn(opt, cur.correct)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <Feedback ok={result.ok} label={result.ok ? common.correct : common.incorrect} text={result.text} />
          </div>
        )}

        {result?.ok && (
          <div className="mt-4">
            {ex < total - 1 ? (
              <button type="button" onClick={() => goTo(ex + 1)} className="btn inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-5 font-display font-semibold text-white">
                {common.next} <ArrowRight size={17} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={onFinish} className="btn inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-5 font-display font-semibold text-white">
                <Flag size={17} aria-hidden="true" /> {common.finish}
              </button>
            )}
          </div>
        )}
      </PanelSlot>
    </>
  )
}

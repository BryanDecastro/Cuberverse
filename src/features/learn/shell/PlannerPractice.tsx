import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, Lightbulb, Play, RotateCcw, Shuffle, Undo2 } from 'lucide-react'
import { fromColorMap, type CubeState } from '@/features/cube/model'
import { faceOf, invertMove, mergeMoves, type Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { Feedback } from '../components/Feedback'
import { ViewControls } from '../components/ViewControls'
import { displayMove, moveDir } from '../notationText'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from './LessonCubeContext'
import { useMoveKeys } from './useMoveKeys'

export type PracticeCopy = {
  lead: string
  hint: string
  showMe: string
  restart: string
  newScramble: string
  hintTitle: string
  hintNote: string
  solvedTitle: string
  solved: string
}

type Step = { moves: Move[] }

/**
 * Free practice on a scramble, with a method planner behind Hint and Show me.
 * Every hint is re-planned from the cube's real state, so the learner can
 * mix their own moves with hints. (Planners are tested to converge this way.)
 */
export function PlannerPractice<S extends Step>({
  makeScramble,
  showScramble = false,
  plan,
  describe,
  status,
  isDone,
  copy,
}: {
  /** Full setup from a solved cube (including how the cube is held). */
  makeScramble: () => Move[]
  showScramble?: boolean
  plan: (s: CubeState) => S[]
  describe: (step: S) => string
  status: (s: CubeState) => Array<{ label: string; done: boolean }>
  isDone: (s: CubeState) => boolean
  copy: PracticeCopy
}) {
  const { t } = useI18n()
  const p3 = t.learn.notation.p3
  const cube = useLessonCube()
  const [scramble, setScramble] = useState<Move[]>(makeScramble)
  const [moves, setMoves] = useState<Move[]>([])
  const [hint, setHint] = useState<S | null>(null)
  const [noHint, setNoHint] = useState(false)
  const [chips, setChips] = useState<Array<{ label: string; done: boolean }>>([])
  const [done, setDone] = useState(false)
  const [animating, setAnimating] = useState<Move | null>(null)
  const fns = useRef({ status, isDone })
  fns.current = { status, isDone }

  const read = useCallback((): CubeState | null => (cube.api.current ? fromColorMap(cube.api.current.readState()) : null), [cube.api])

  const refresh = useCallback(() => {
    const s = read()
    if (!s) return
    setChips(fns.current.status(s))
    setDone(fns.current.isDone(s))
  }, [read])

  const setUp = useCallback(
    (seq: Move[]) => {
      cube.api.current?.setState(seq)
      cube.api.current?.lookAt('home')
      cube.setHighlight(null)
      cube.setArrow(null)
      setMoves([])
      setHint(null)
      setAnimating(null)
      refresh()
    },
    [cube, refresh],
  )

  useEffect(() => {
    if (cube.ready) setUp(scramble)
  }, [cube.ready, scramble]) // eslint-disable-line react-hooks/exhaustive-deps

  useCubeEvents({
    onMoveStart: (m) => {
      setAnimating(m)
      const f = faceOf(m)
      cube.setHighlight(f)
      cube.setArrow(f ? { face: f, dir: moveDir(m) } : null)
    },
    onIdle: () => {
      setAnimating(null)
      cube.setHighlight(null)
      cube.setArrow(null)
      refresh()
    },
  })

  const doMoves = (list: Move[]) => {
    cube.api.current?.play(list)
    // The same turn twice in a row is written as one half turn (U U -> U2).
    setMoves((m) => mergeMoves(m, list))
    setHint(null)
    setNoHint(false)
  }
  useMoveKeys((m) => doMoves([m]))

  /** Planners only continue from states their method can reach; anything else gets a friendly message, never a crash. */
  const nextStep = (): S | null => {
    const s = read()
    if (!s || cube.api.current?.isBusy()) return null
    try {
      setNoHint(false)
      return plan(s)[0] ?? null
    } catch {
      setNoHint(true)
      return null
    }
  }
  const showHint = () => {
    const step = nextStep()
    setHint(step)
    const f = step ? faceOf(step.moves[0]) : null
    cube.setHighlight(f)
    cube.setArrow(f && step ? { face: f, dir: moveDir(step.moves[0]) } : null)
  }
  const showMe = () => {
    const step = hint ?? nextStep()
    if (step) doMoves(step.moves)
  }
  const undo = () => {
    const last = moves[moves.length - 1]
    if (!last) return
    cube.api.current?.play([invertMove(last)])
    setMoves((m) => m.slice(0, -1))
    setHint(null)
  }

  const toolBtn =
    'btn inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-canvas/60 px-3.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40'

  return (
    <>
      <ControlsSlot>
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2" aria-live="polite">
          {chips.map((c) => (
            <span key={c.label} className={cx('rounded-lg border px-2.5 py-1 font-mono text-xs', c.done ? 'border-st-green/50 text-[#4fe08f]' : 'border-line text-ink-2')}>
              {c.label}
            </span>
          ))}
        </div>
        <p className="flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/[0.08] px-3 py-2.5 text-center text-sm text-ink-2" data-gesture-hint="">
          <Hand size={16} className="shrink-0 text-[#7fb0ff]" aria-hidden="true" /> {t.learn.gestureHint}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={showHint} disabled={done || !!animating} className={toolBtn}>
              <Lightbulb size={16} aria-hidden="true" /> {copy.hint}
            </button>
            <button type="button" onClick={showMe} disabled={done || !!animating} className={toolBtn}>
              <Play size={15} aria-hidden="true" /> {copy.showMe}
            </button>
            <button type="button" onClick={undo} disabled={!moves.length} className={toolBtn}>
              <Undo2 size={16} aria-hidden="true" /> {p3.undo}
            </button>
            <button type="button" onClick={() => setUp(scramble)} className={toolBtn}>
              <RotateCcw size={16} aria-hidden="true" /> {copy.restart}
            </button>
            <button type="button" onClick={() => setScramble(makeScramble())} className={toolBtn}>
              <Shuffle size={16} aria-hidden="true" /> {copy.newScramble}
            </button>
          </div>
          <ViewControls api={cube.api} compact />
        </div>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{copy.lead}</p>
        {showScramble && <p className="mt-4 font-mono text-xs leading-relaxed text-ink-3">{scramble.map(displayMove).join(' ')}</p>}

        {done ? (
          <div className="mt-4">
            <Feedback ok label={copy.solvedTitle} text={copy.solved} />
          </div>
        ) : noHint ? (
          <p className="feedback-in mt-4 rounded-2xl border border-line-strong/60 p-4 text-sm leading-relaxed text-ink-2" role="status">
            {t.learn.noHint}
          </p>
        ) : hint ? (
          <div className="feedback-in mt-4 rounded-2xl border border-st-yellow/35 bg-st-yellow/[0.07] p-4" role="status">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Lightbulb size={16} className="text-st-yellow" aria-hidden="true" /> {copy.hintTitle}
              <span className="ml-auto whitespace-nowrap rounded-md bg-canvas/60 px-2 py-0.5 font-mono text-base text-white">{hint.moves.map(displayMove).join(' ')}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{describe(hint)}</p>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-line bg-canvas/50 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-ink">{p3.history}</p>
            <p className="font-mono text-xs text-ink-3">{fmt(p3.count, { n: moves.length })}</p>
          </div>
          {moves.length ? (
            <p className="mt-3 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto font-mono text-[0.95rem]">
              {moves.map((m, i) => (
                <span key={i} className={i === moves.length - 1 ? 'rounded-md bg-accent/25 px-1.5 text-white' : 'px-1.5 text-ink-2'}>
                  {displayMove(m)}
                </span>
              ))}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-3">{p3.empty}</p>
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">{copy.hintNote}</p>
      </PanelSlot>
    </>
  )
}

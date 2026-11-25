import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Hand } from 'lucide-react'
import { LazyCube } from '@/features/cube/LazyCube'
import type { CubeApi, FaceArrow } from '@/features/cube/CubeScene'
import type { Face, Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { useLearnProgress } from '../LearnProgressProvider'
import type { LessonId } from '../lessons'
import { CompletionCard, type CompletionCopy } from '../components/CompletionCard'
import { describeMove, displayMove } from '../notationText'
import { isFace } from '@/features/cube/moves'
import { LessonCubeContext, type CubeEvents, type LessonCube } from './LessonCubeContext'

export type LessonShellProps = {
  lessonId: LessonId
  parts: Array<{ short: string; title: string }>
  /** Render the active part. Parts draw into the controls and panel slots. */
  renderPart: (index: number, finish: () => void) => ReactNode
  complete: CompletionCopy
  nextTo: string
  /** Face letters on the cube when a part opens. */
  labelsFor?: (part: number) => boolean
}

/**
 * Shared lesson frame: the cube, part stepper, explanation panel, part
 * navigation, saved progress and the completion moment. Each lesson only
 * supplies its parts.
 */
export function LessonShell({ lessonId, parts, renderPart, complete, nextTo, labelsFor = () => false }: LessonShellProps) {
  const { t } = useI18n()
  const { reachPart, markCompleted, isCompleted } = useLearnProgress()
  const PARTS = parts.length

  const [part, setPart] = useState(0)
  const [highlight, setHighlight] = useState<Face | null>(null)
  const [arrow, setArrow] = useState<FaceArrow | null>(null)
  const [labels, setLabels] = useState(() => labelsFor(0))
  const [focus, setFocusState] = useState<((colors: Face[]) => boolean) | null>(null)
  const [ready, setReady] = useState(false)
  // The last move stays on screen a moment after it ends, so it can be read.
  const [shownMove, setShownMove] = useState<{ move: Move; n: number } | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const moveCount = useRef(0)
  // Drag-to-turn is on only while a part takes moves from the learner.
  const gestureHandler = useRef<((m: Move) => void) | null>(null)
  const [gesturesOn, setGesturesOn] = useState(false)
  const setGesture = useCallback((handler: ((m: Move) => void) | null, owner?: (m: Move) => void) => {
    if (handler) gestureHandler.current = handler
    else if (!owner || gestureHandler.current === owner) gestureHandler.current = null
    setGesturesOn(!!gestureHandler.current)
  }, [])
  const onGesture = useCallback((m: Move) => gestureHandler.current?.(m), [])
  const [showComplete, setShowComplete] = useState(false)
  const [controlsEl, setControlsEl] = useState<HTMLElement | null>(null)
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null)

  const api = useRef<CubeApi>(null)
  const listeners = useRef<Set<CubeEvents>>(new Set())
  const topRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // A function in state must be wrapped, or React would call it as an updater.
  const setFocus = useCallback((f: ((colors: Face[]) => boolean) | null) => setFocusState(() => f), [])

  // Every part starts from a solved cube, normal view, normal speed.
  // Done here (before the new part mounts) so the part's own setup wins.
  const goPart = (next: number) => {
    const i = Math.max(0, Math.min(PARTS - 1, next))
    api.current?.reset()
    api.current?.lookAt('home')
    api.current?.setSpeed(1)
    setHighlight(null)
    setArrow(null)
    setShownMove(null)
    setFocus(null)
    setLabels(labelsFor(i))
    setPart(i)
  }

  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  useEffect(() => {
    reachPart(lessonId, part)
    if (!firstRender.current && window.innerWidth < 1024) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    firstRender.current = false
  }, [part, reachPart, lessonId])

  // Dev only: lets automated checks compare the 3D cube against the math model.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    Promise.all([import('@/features/cube/model'), import('@/features/cube/crossSolver'), import('@/features/cube/firstLayer'), import('@/features/cube/secondLayer'), import('@/features/cube/yellowCross'), import('@/features/cube/yellowFace'), import('@/features/cube/lastLayer')]).then(([model, cross, firstLayer, secondLayer, yellowCross, yellowFace, lastLayer]) => {
      Object.assign(window, { __cubeverse: { api, model, cross, firstLayer, secondLayer, yellowCross, yellowFace, lastLayer } })
    })
  }, [])

  const cube = useMemo<LessonCube>(
    () => ({
      api,
      setHighlight,
      setArrow,
      setLabels,
      labels,
      setFocus,
      setGesture,
      ready,
      listeners,
      slots: { controls: controlsEl, panel: panelEl },
    }),
    [labels, setFocus, setGesture, ready, controlsEl, panelEl],
  )

  const onMoveStart = useCallback((m: Move) => {
    window.clearTimeout(hideTimer.current)
    moveCount.current += 1
    // The same quarter turn again while its letter is still showing reads as a half turn (U, U -> U2).
    setShownMove((prev) => ({
      move: prev && prev.move === m && !m.endsWith('2') ? (`${m[0]}2` as Move) : m,
      n: moveCount.current,
    }))
    listeners.current.forEach((l) => l.onMoveStart?.(m))
  }, [])
  const onMoveEnd = useCallback((m: Move) => listeners.current.forEach((l) => l.onMoveEnd?.(m)), [])
  const onIdle = useCallback(() => {
    hideTimer.current = window.setTimeout(() => setShownMove(null), 2200)
    listeners.current.forEach((l) => l.onIdle?.())
  }, [])
  const onReady = useCallback(() => setReady(true), [])

  const finish = useCallback(() => {
    markCompleted(lessonId)
    setShowComplete(true)
  }, [markCompleted, lessonId])

  const completed = isCompleted(lessonId)

  return (
    <LessonCubeContext.Provider value={cube}>
      {/* Center: the cube and its controls */}
      <section
        ref={topRef}
        aria-labelledby="part-title"
        className="glass order-1 scroll-mt-24 rounded-3xl p-4 sm:p-6 lg:col-start-1 lg:row-start-1 xl:col-start-2"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-3">{fmt(t.learn.partOf, { n: part + 1, total: PARTS })}</p>
            <h2 id="part-title" className="mt-0.5 font-display text-[1.45rem] font-semibold leading-tight tracking-tight sm:text-[1.7rem]">
              {parts[part].title}
            </h2>
          </div>
          <span
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
              completed ? 'border-st-green/40 bg-st-green/10 text-[#4fe08f]' : 'border-accent/40 bg-accent/10 text-[#8fb8ff]',
            )}
          >
            {completed && <Check size={13} strokeWidth={3} aria-hidden="true" />}
            {completed ? t.learn.done : t.learn.inProgress}
          </span>
        </div>

        {/* Part stepper */}
        <ol className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${PARTS}, minmax(0, 1fr))` }} data-stepper="">
          {parts.map((pt, i) => (
            <li key={pt.short}>
              <button
                type="button"
                onClick={() => goPart(i)}
                aria-current={part === i ? 'step' : undefined}
                className={cx(
                  'flex w-full flex-col items-start gap-1.5 rounded-lg px-1 py-1 text-left transition-colors',
                  part === i ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <span className={cx('h-1 w-full rounded-full transition-colors duration-500', i < part ? 'bg-st-green' : i === part ? 'bg-accent' : 'bg-white/10')} />
                <span className="w-full truncate text-[0.7rem] font-semibold sm:text-xs">
                  <span className="font-mono">{i + 1}</span> <span className="hidden sm:inline">{pt.short}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* The cube */}
        <div className="relative mt-3">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.28),rgb(139_92_246/0.1)_45%,transparent_70%)] blur-2xl"
            aria-hidden="true"
          />
          <LazyCube
            apiRef={api}
            label={t.learn.cubeLabel}
            pedestal={false}
            idleSpin={false}
            labels={labels}
            highlight={highlight}
            arrow={arrow}
            focus={focus}
            pitchRange={[-1.4, 1.4]}
            quarterTurnSeconds={0.55}
            onMoveStart={onMoveStart}
            onMoveEnd={onMoveEnd}
            onIdle={onIdle}
            onReady={onReady}
            onGesture={gesturesOn ? onGesture : null}
            className="h-[290px] w-full sm:h-[340px] xl:h-[min(360px,40vh)]"
          />
          {/* Steps aside while a move is shown, so the two never overlap. */}
          <p
            className={cx(
              'pointer-events-none absolute left-1 top-1 inline-flex max-w-[calc(100%-6rem)] items-center gap-1.5 rounded-full border border-line bg-canvas/70 px-2.5 py-1 text-[0.7rem] text-ink-3 backdrop-blur transition-opacity duration-300',
              shownMove && 'opacity-0',
            )}
          >
            <Hand size={12} aria-hidden="true" /> {gesturesOn ? t.learn.camera.dragTurn : t.learn.camera.drag}
          </p>
          {/* The move just made, big enough to read: its letter and what it means. */}
          <div
            aria-live="polite"
            data-move-badge={shownMove ? displayMove(shownMove.move) : undefined}
            className={cx(
              'pointer-events-none absolute right-1 top-1 flex max-w-[60%] items-center gap-3 rounded-2xl border border-accent/50 bg-canvas/85 py-1.5 pl-2 pr-3.5 shadow-[0_8px_30px_-10px_rgb(47_123_255/0.7)] backdrop-blur transition-opacity duration-300',
              shownMove ? 'opacity-100' : 'opacity-0',
            )}
          >
            {shownMove && (
              <>
                <span
                  key={shownMove.n}
                  className="move-pop grid h-12 min-w-12 place-items-center rounded-xl bg-accent/25 px-2 font-mono text-[1.9rem] font-bold leading-none text-white"
                >
                  {displayMove(shownMove.move)}
                </span>
                {isFace(shownMove.move[0]) && (
                  <span className="hidden text-xs leading-snug text-ink-2 sm:block">{describeMove(t, shownMove.move)}</span>
                )}
              </>
            )}
          </div>
        </div>

        <div ref={setControlsEl} className="mt-2" />
      </section>

      {/* Right: explanation, examples, exercises */}
      <aside aria-label={parts[part].title} className="order-2 lg:col-start-2 lg:row-start-1 xl:col-start-3">
        {showComplete ? (
          <CompletionCard
            copy={complete}
            nextTo={nextTo}
            onReview={() => {
              setShowComplete(false)
              goPart(0)
            }}
          />
        ) : (
          <div className="glass rounded-3xl p-5 sm:p-6">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#7fb0ff]">{parts[part].short}</p>
            <div ref={setPanelEl} className="mt-3" />
          </div>
        )}
      </aside>

      {/* Part navigation */}
      <div className="order-3 flex items-center justify-between gap-3 lg:col-span-2 lg:col-start-1 lg:row-start-2 xl:col-start-2">
        <button
          type="button"
          onClick={() => goPart(part - 1)}
          disabled={part === 0}
          className="btn inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong/70 bg-panel/50 px-5 font-display font-semibold text-ink transition-colors hover:bg-panel-2 disabled:opacity-35"
        >
          <ArrowLeft size={18} aria-hidden="true" /> {t.learn.prevPart}
        </button>
        {part < PARTS - 1 && (
          <button
            type="button"
            onClick={() => goPart(part + 1)}
            className="btn group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-6 font-display font-semibold text-white shadow-[0_8px_30px_-8px_rgb(47_123_255/0.7)] transition-transform hover:-translate-y-0.5"
          >
            {t.learn.nextPart}: {parts[part + 1].short}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* The active part renders into the two slots above. */}
      {!showComplete && renderPart(part, finish)}
    </LessonCubeContext.Provider>
  )
}

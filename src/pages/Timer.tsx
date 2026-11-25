import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Award, Check, Eye, Gauge, RotateCcw, Save, TrendingUp, Zap } from 'lucide-react'
import { Kicker } from '@/components/ui/Kicker'
import { completedLessons, evaluateAchievements, takeNewlyUnlocked, type AchievementId } from '@/features/achievements/achievements'
import { routes } from '@/config/routes'
import { ScrambleVisualizer } from '@/features/timer/ScrambleVisualizer'
import { TimeChart } from '@/features/timer/TimeChart'
import { AchievementsCard, HistoryTable, PenaltyButtons, ScrambleBar, SessionCard, StatTiles, TimerDisplay } from '@/features/timer/TimerPanels'
import { TimerStoreProvider, useTimerStore } from '@/features/timer/TimerStore'
import { averageOf, best, formatSolve, formatTime } from '@/features/timer/stats'
import { EVENT_LABEL, TIMER_EVENTS, type Penalty, type TimerEvent } from '@/features/timer/types'
import { useScramble } from '@/features/timer/useScramble'
import { useTimer } from '@/features/timer/useTimer'
import { useI18n } from '@/i18n/I18nProvider'
import { storage } from '@/lib/storage'
import { cx, fmt } from '@/lib/format'

type Mode = 'simple' | 'advanced'

function AchievementToast({ ids, onDone }: { ids: AchievementId[]; onDone: () => void }) {
  const { t } = useI18n()
  useEffect(() => {
    const id = window.setTimeout(onDone, 5000)
    return () => window.clearTimeout(id)
  }, [ids, onDone])
  return (
    <div role="status" className="completion-in fixed bottom-5 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-st-yellow/50 bg-[#1d1a0c]/95 p-4 shadow-2xl backdrop-blur">
      <p className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-st-yellow">
        <Award size={15} aria-hidden="true" /> {t.timer.achievements.toast}
      </p>
      {ids.map((id) => (
        <p key={id} className="mt-1 font-display text-lg font-semibold text-ink">
          {t.timer.achievements.items[id].name}
        </p>
      ))}
    </div>
  )
}

function TimerView() {
  const { t } = useI18n()
  const tm = t.timer
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const first = params.get('first') === '1'
  const store = useTimerStore()

  const [mode, setModeState] = useState<Mode>(() => storage.get<Mode>('timer-mode', 'advanced'))
  const setMode = (m: Mode) => {
    setModeState(m)
    storage.set('timer-mode', m)
  }
  const [eventState, setEventState] = useState<TimerEvent>(() => storage.get<TimerEvent>('timer-event', '333'))
  const event: TimerEvent = first ? '333' : eventState
  const setEvent = (e: TimerEvent) => {
    setEventState(e)
    storage.set('timer-event', e)
  }

  const [inspectionOn, setInspectionState] = useState<boolean>(() => storage.get<boolean>('timer-inspection', false))
  const setInspection = (on: boolean) => {
    setInspectionState(on)
    storage.set('timer-inspection', on)
  }

  const session = store.activeSession(event)
  const solves = store.solvesIn(session.id)
  const { scramble, official, newScramble } = useScramble(event)

  const [lastId, setLastId] = useState<string | null>(null)
  const [firstResult, setFirstResult] = useState<number | null>(null)
  const [firstSaved, setFirstSaved] = useState(false)
  const [toast, setToast] = useState<AchievementId[] | null>(null)

  // Achievements, worked out from lessons and every saved solve.
  const statuses = useMemo(() => evaluateAchievements({ lessons: completedLessons(), solves: store.allSolves() }), [store])
  const mounted = useRef(false)
  useEffect(() => {
    const fresh = takeNewlyUnlocked(statuses)
    // Only celebrate things earned on this page, not ones from before it opened.
    if (mounted.current && fresh.length) setToast(fresh)
    mounted.current = true
  }, [statuses])

  const padRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLParagraphElement>(null)
  const scrambleRef = useRef(scramble)
  scrambleRef.current = scramble

  const onStop = useCallback(
    (ms: number, penalty: Penalty) => {
      if (first) {
        setFirstResult(ms)
        return
      }
      // A penalty earned in inspection (+2 or DNF) is saved with the solve; it can still be changed after.
      const saved = store.addSolve({ event, ms, penalty, scramble: scrambleRef.current ?? '' })
      setLastId(saved.id)
      void newScramble()
    },
    [first, store, event, newScramble],
  )

  const timer = useTimer({
    padRef,
    displayRef,
    enabled: !!scramble && !(first && firstResult !== null),
    // The first timed solve stays simple: no inspection there.
    inspection: inspectionOn && !first,
    onStop,
  })
  const busy = timer.phase === 'inspecting' || timer.phase === 'holding' || timer.phase === 'ready' || timer.phase === 'running'

  const staticRef = useRef<HTMLParagraphElement>(null)
  const lastSolve = solves.find((s) => s.id === lastId) ?? null
  // After a stop, show the saved solve (with any penalty); before the first solve, 0.00.
  const displayText = timer.inspection
    ? timer.inspection.text
    : first && firstResult !== null
      ? formatTime(firstResult)
      : timer.phase !== 'stopped'
        ? '0.00'
        : lastSolve
          ? formatSolve(lastSolve)
          : formatTime(timer.result)

  const saveFirst = () => {
    if (firstResult === null || firstSaved) return
    store.addSolve({ event: '333', ms: firstResult, penalty: 'none', scramble: scramble ?? '' })
    setFirstSaved(true)
  }
  const tryAgain = () => {
    setFirstResult(null)
    setFirstSaved(false)
    timer.reset()
    void newScramble()
  }

  const dim = cx('transition-opacity duration-300', busy && 'pointer-events-none opacity-15')

  /* ---------------- The timer panel (shared by every layout) ---------------- */
  const timerPanel = (
    <section
      aria-label={tm.title + ' ' + tm.titleAccent}
      ref={padRef}
      onContextMenu={(e) => e.preventDefault()}
      className={cx(
        'glass relative select-none overflow-hidden rounded-3xl p-5 sm:p-7 [touch-action:manipulation]',
        timer.phase === 'ready' && 'ring-2 ring-[#4fe08f]/60',
        timer.phase === 'holding' && 'ring-2 ring-[#ff6b7d]/50',
        timer.phase === 'inspecting' && 'ring-2 ring-[#7fb0ff]/40',
      )}
      data-timer-pad=""
    >
      <div className={dim}>
        <ScrambleBar scramble={scramble} official={official} eventLabel={EVENT_LABEL[event]} onNew={() => void newScramble()} disabled={busy} />
      </div>
      <div className="relative mt-6 sm:mt-8">
        {timer.phase === 'running' ? (
          // Fresh element while running: the clock writes to it directly every frame.
          <TimerDisplay key="running" phase="running" text="0.00" displayRef={displayRef} />
        ) : (
          <TimerDisplay
            key="static"
            phase={timer.phase}
            text={displayText}
            displayRef={staticRef}
            inspection={timer.inspection?.stage ?? null}
            inspectionOn={inspectionOn && !first}
          />
        )}
      </div>
      {!first && lastSolve && timer.phase === 'stopped' && (
        <div className={cx('mt-5 flex flex-wrap items-center justify-center gap-3', dim)}>
          <span className="text-sm text-ink-3">{tm.last.title}</span>
          <PenaltyButtons
            solve={lastSolve}
            label={tm.last.title}
            onPenalty={(p) => store.setPenalty(lastSolve.id, p)}
            onDelete={() => {
              store.deleteSolve(lastSolve.id)
              setLastId(null)
              timer.reset()
            }}
          />
        </div>
      )}
    </section>
  )

  /* ---------------- First timed solve ---------------- */
  if (first) {
    const f = tm.first
    return (
      <div className="mx-auto max-w-[1000px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <header className={cx('mb-6', dim)}>
          <Kicker>{f.kicker}</Kicker>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">{f.title}</h1>
          <ol className="mt-5 grid gap-2 sm:grid-cols-2">
            {f.steps.map((s, i) => (
              <li key={s} className="flex gap-3 rounded-2xl border border-line bg-panel/40 p-3 text-sm leading-relaxed text-ink-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-mono text-[#8fb8ff]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </header>
        {timerPanel}
        {firstResult !== null && (
          <section aria-labelledby="first-result" className="completion-in mt-6 rounded-3xl border border-st-yellow/40 bg-gradient-to-br from-[#2a2208] via-panel to-panel p-6 text-center sm:p-8">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-st-yellow/15 text-st-yellow ring-1 ring-st-yellow/50">
              <Award size={28} aria-hidden="true" />
            </span>
            <h2 id="first-result" className="mt-4 font-display text-2xl font-semibold">{f.resultTitle}</h2>
            <p className="mt-1 font-display text-5xl font-bold tabular-nums text-white" data-first-time="">{formatTime(firstResult)}</p>
            <p className="mx-auto mt-3 max-w-[44ch] text-sm text-ink-2">{f.resultText}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {firstSaved ? (
                <>
                  <p className="inline-flex h-12 items-center gap-2 rounded-xl border border-st-green/40 bg-st-green/10 px-4 text-sm font-semibold text-[#4fe08f]" role="status">
                    <Check size={17} aria-hidden="true" /> {f.saved}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(routes.timer)}
                    className="btn inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-6 font-display font-semibold text-white"
                  >
                    <Zap size={17} aria-hidden="true" /> {f.keepGoing}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={saveFirst} className="btn inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-6 font-display font-semibold text-white">
                    <Save size={17} aria-hidden="true" /> {f.save}
                  </button>
                  <button type="button" onClick={tryAgain} className="btn inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong/70 px-5 font-display font-semibold text-ink hover:bg-panel-2">
                    <RotateCcw size={17} aria-hidden="true" /> {f.again}
                  </button>
                </>
              )}
            </div>
          </section>
        )}
        <p className={cx('mt-6 text-center text-sm', dim)}>
          <Link to={routes.timer} className="text-[#8fb8ff] hover:text-ink">
            {f.regular}
          </Link>
        </p>
        {toast && <AchievementToast ids={toast} onDone={() => setToast(null)} />}
      </div>
    )
  }

  /* ---------------- Regular timer ---------------- */
  const seg = (on: boolean) => cx('inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors', on ? 'bg-accent/25 text-white shadow-[inset_0_0_0_1px_rgb(75_141_255/0.45)]' : 'text-ink-3 hover:text-ink')

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <header className={cx('mb-5', dim)}>
        <Kicker>{tm.kicker}</Kicker>
        <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-[1.05] tracking-tight">
          {tm.title} <span className="text-gradient">{tm.titleAccent}</span>
        </h1>
        <p className="mt-2 max-w-[60ch] text-ink-2">{tm.subtitle}</p>
      </header>

      <div className={cx('mb-5 flex flex-wrap items-center gap-3', dim)}>
        <div role="radiogroup" aria-label={`${tm.modes.simple} / ${tm.modes.advanced}`} className="inline-flex rounded-2xl border border-line bg-panel/60 p-1">
          <button type="button" role="radio" aria-checked={mode === 'simple'} onClick={() => setMode('simple')} className={seg(mode === 'simple')}>
            <Zap size={15} aria-hidden="true" /> {tm.modes.simple}
          </button>
          <button type="button" role="radio" aria-checked={mode === 'advanced'} onClick={() => setMode('advanced')} className={seg(mode === 'advanced')}>
            <Gauge size={15} aria-hidden="true" /> {tm.modes.advanced}
          </button>
        </div>
        <div role="radiogroup" aria-label={tm.puzzle} className="inline-flex rounded-2xl border border-line bg-panel/60 p-1">
          {TIMER_EVENTS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={event === e} onClick={() => setEvent(e)} className={seg(event === e)}>
              {EVENT_LABEL[e]}
            </button>
          ))}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={inspectionOn}
          aria-describedby="inspection-help"
          title={tm.inspection.help}
          onClick={() => setInspection(!inspectionOn)}
          className={cx(
            'btn inline-flex h-12 items-center gap-2.5 rounded-2xl border px-4 text-sm font-semibold transition-colors',
            inspectionOn ? 'border-accent/60 bg-accent/15 text-white' : 'border-line bg-panel/60 text-ink-3 hover:text-ink',
          )}
          data-inspection-toggle=""
        >
          <Eye size={16} aria-hidden="true" />
          {tm.inspection.label}
          <span className={cx('relative h-5 w-9 rounded-full transition-colors', inspectionOn ? 'bg-accent' : 'bg-line-strong/60')} aria-hidden="true">
            <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left]', inspectionOn ? 'left-[18px]' : 'left-0.5')} />
          </span>
        </button>
        <span id="inspection-help" className="sr-only">{tm.inspection.help}</span>
        <p className="text-xs text-ink-3 sm:ml-auto">{tm.storageNote}</p>
      </div>

      {mode === 'simple' ? (
        <div className="mx-auto max-w-[980px]">
          {timerPanel}
          <p className={cx('mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-ink-2', dim)} data-simple-stats="">
            <span>
              {tm.stats.best}: <strong className="font-mono text-ink">{formatTime(best(solves))}</strong>
            </span>
            <span>
              {tm.stats.ao5}: <strong className="font-mono text-ink">{formatTime(averageOf(solves, 5), 'average')}</strong>
            </span>
            <span>
              {tm.stats.ao12}: <strong className="font-mono text-ink">{formatTime(averageOf(solves, 12), 'average')}</strong>
            </span>
            <span>
              {tm.stats.total}: <strong className="font-mono text-ink">{solves.length}</strong>
            </span>
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {timerPanel}
            <div className={dim}>
              <ScrambleVisualizer scramble={scramble} event={event} paused={busy} />
            </div>
          </div>
          <div className={dim}>
            <StatTiles solves={solves} />
          </div>
          <div className={cx('grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]', dim)}>
            <div className="grid content-start gap-5">
            <section aria-labelledby="chart-title" className="glass rounded-3xl p-5">
              <h2 id="chart-title" className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                <TrendingUp size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {tm.chart.title}
              </h2>
              <TimeChart solves={solves} />
            </section>
            <HistoryTable solves={solves} onPenalty={store.setPenalty} onDelete={store.deleteSolve} />
            </div>
            <div className="grid content-start gap-5">
              <SessionCard
                sessions={store.sessionsFor(event)}
                active={session}
                solves={solves}
                onSelect={(id) => store.selectSession(event, id)}
                onNew={() => store.newSession(event, fmt(tm.session.namePattern, { n: store.sessionsFor(event).length + 1 }))}
              />
              <AchievementsCard statuses={statuses} />
            </div>
          </div>
        </div>
      )}
      {toast && <AchievementToast ids={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export default function TimerPage() {
  return (
    <TimerStoreProvider>
      <TimerView />
    </TimerStoreProvider>
  )
}

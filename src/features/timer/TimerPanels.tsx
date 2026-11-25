import { useState } from 'react'
import { BarChart3, Check, Clock, Copy, Crown, Layers, Layers3, Plus, RefreshCw, Shuffle, Trash2, Trophy, Award } from 'lucide-react'
import { ACHIEVEMENT_IDS, type AchievementStatus } from '@/features/achievements/achievements'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'
import type { InspectionStage, Phase } from './engine'
import { averageOf, best, bestAverage, DNF, effective, formatSolve, formatTime, mean } from './stats'
import type { Penalty, Session, Solve } from './types'

/* ------------------------------------------------------------------ */
/* Scramble bar                                                        */
/* ------------------------------------------------------------------ */
export function ScrambleBar({ scramble, official, eventLabel, onNew, disabled }: { scramble: string | null; official: boolean; eventLabel: string; onNew: () => void; disabled: boolean }) {
  const { t } = useI18n()
  const s = t.timer.scramble
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!scramble) return
    try {
      await navigator.clipboard.writeText(scramble)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }
  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Shuffle size={17} className="text-[#8fb8ff]" aria-hidden="true" />
          {s.title} <span className="font-normal text-ink-3">({eventLabel})</span>
        </p>
        <div className="ml-auto flex gap-2">
          {/* Icon-only on phones (the label stays for screen readers and as a tooltip). */}
          <button type="button" onClick={copy} disabled={!scramble || disabled} title={copied ? s.copied : s.copy} className="btn inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-line bg-canvas/60 px-2.5 text-sm text-ink-2 hover:text-ink disabled:opacity-40 sm:px-3">
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} <span className="sr-only sm:not-sr-only">{copied ? s.copied : s.copy}</span>
          </button>
          <button type="button" onClick={onNew} disabled={disabled} title={s.newScramble} className="btn inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-line bg-canvas/60 px-2.5 text-sm text-ink-2 hover:text-ink disabled:opacity-40 sm:px-3">
            <RefreshCw size={15} aria-hidden="true" /> <span className="sr-only sm:not-sr-only">{s.newScramble}</span>
          </button>
        </div>
      </div>
      <p
        className={cx(
          'mt-3 min-h-[3.2rem] rounded-2xl border border-line bg-canvas/60 px-3 py-2.5 text-center font-mono text-[clamp(0.95rem,2.2vw,1.5rem)] leading-relaxed tracking-wide text-ink sm:px-4 sm:py-3',
          !scramble && 'animate-pulse text-ink-3',
        )}
        aria-live="polite"
        data-scramble=""
      >
        {scramble ? scramble.replace(/'/g, '′') : s.generating}
      </p>
      {scramble && <p className="mt-1.5 text-center text-xs text-ink-3">{official ? s.official : s.fallback}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The big number                                                      */
/* ------------------------------------------------------------------ */
const PHASE_COLOR: Record<Phase, string> = {
  idle: 'text-ink',
  inspecting: 'text-[#7fb0ff]',
  stopped: 'text-ink',
  holding: 'text-[#ff8a96]',
  ready: 'text-[#4fe08f]',
  running: 'text-white',
}

/** Inspection colors: calm, then the judge's 8 and 12 second calls, then the penalties. */
const STAGE_COLOR: Record<InspectionStage, string> = {
  ok: 'text-[#7fb0ff]',
  '8': 'text-[#ffc93c]',
  '12': 'text-[#ff9a3c]',
  '+2': 'text-[#ff6b7d]',
  dnf: 'text-[#ff3b50]',
}

const TOUCH = '(pointer: coarse)'

export function TimerDisplay({
  phase,
  text,
  displayRef,
  inspection = null,
  inspectionOn = false,
}: {
  phase: Phase
  text: string
  displayRef: React.RefObject<HTMLParagraphElement | null>
  /** Live inspection stage, while inspecting. */
  inspection?: InspectionStage | null
  /** Inspection is switched on (changes the idle hint). */
  inspectionOn?: boolean
}) {
  const { t } = useI18n()
  const h = t.timer.hint
  const touch = useMediaQuery(TOUCH)
  const stageHint =
    inspection === '8' ? h.eight : inspection === '12' ? h.twelve : inspection === '+2' ? h.plus2 : inspection === 'dnf' ? h.dnf : touch ? h.inspectingTouch : h.inspecting
  const hint =
    phase === 'holding'
      ? h.holding
      : phase === 'ready'
        ? h.ready
        : phase === 'running'
          ? h.running
          : phase === 'inspecting'
            ? stageHint
            : inspectionOn
              ? touch
                ? h.idleInspectTouch
                : h.idleInspect
              : touch
                ? h.idleTouch
                : h.idle
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
      {/* Glow ring under the digits, anchored to them so it never touches the hint. */}
      <span
        className="pointer-events-none absolute -bottom-4 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[100%] border-2 border-accent/40 shadow-[0_0_40px_rgb(47_123_255/0.45)]"
        aria-hidden="true"
      />
      <p
        ref={displayRef}
        className={cx('relative font-display text-[clamp(4.5rem,15vw,9.5rem)] font-bold leading-none tracking-tight tabular-nums transition-colors duration-150', phase === 'inspecting' && inspection ? STAGE_COLOR[inspection] : PHASE_COLOR[phase])}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        data-phase={phase}
        data-inspection={inspection ?? undefined}
        aria-live="off"
      >
        {text}
      </p>
      </div>
      <p className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 px-3 py-2 text-center text-[0.8rem] text-ink-2 sm:mt-9 sm:text-left sm:text-sm" aria-live="polite">
        {!touch && <kbd className="rounded-lg border border-line-strong/80 px-2.5 py-0.5 font-display text-sm font-semibold text-ink">{t.timer.space}</kbd>}
        {hint}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Penalty buttons for one solve                                       */
/* ------------------------------------------------------------------ */
export function PenaltyButtons({ solve, onPenalty, onDelete, label, compact = false }: { solve: Solve; onPenalty: (p: Penalty) => void; onDelete: () => void; label: string; compact?: boolean }) {
  const { t } = useI18n()
  const l = t.timer.last
  const opts: Array<[Penalty, string]> = [
    ['none', l.ok],
    ['+2', l.plus2],
    ['dnf', l.dnf],
  ]
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1">
      {opts.map(([p, text]) => (
        <button
          key={p}
          type="button"
          aria-pressed={solve.penalty === p}
          onClick={() => onPenalty(p)}
          className={cx(
            'btn rounded-lg border font-mono transition-colors',
            compact ? 'h-8 min-w-9 px-1.5 text-xs' : 'h-9 min-w-11 px-2 text-sm',
            solve.penalty === p ? 'border-accent-hover bg-accent/20 text-white' : 'border-line text-ink-3 hover:text-ink',
          )}
        >
          {text}
        </button>
      ))}
      <button type="button" onClick={onDelete} aria-label={`${l.delete}`} title={l.delete} className={cx('btn inline-flex items-center justify-center rounded-lg border border-line text-ink-3 hover:border-[#ff6b7d]/60 hover:text-[#ff8a96]', compact ? 'h-8 w-8' : 'h-9 w-9')}>
        <Trash2 size={compact ? 14 : 15} aria-hidden="true" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stat tiles                                                          */
/* ------------------------------------------------------------------ */
export function StatTiles({ solves }: { solves: Solve[] }) {
  const { t } = useI18n()
  const s = t.timer.stats
  const tiles = [
    { label: s.best, value: formatTime(best(solves)), icon: Crown, tone: 'text-st-yellow' },
    { label: s.ao5, value: formatTime(averageOf(solves, 5), 'average'), icon: Layers, tone: 'text-[#22d3ee]' },
    { label: s.ao12, value: formatTime(averageOf(solves, 12), 'average'), icon: Layers3, tone: 'text-[#b69bff]' },
    { label: s.total, value: String(solves.length), icon: BarChart3, tone: 'text-[#4fe08f]' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="glass flex items-center gap-2.5 rounded-2xl px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
          <Icon strokeWidth={1.6} className={cx('h-5 w-5 shrink-0 sm:h-[26px] sm:w-[26px]', tone)} aria-hidden="true" />
          <div className="min-w-0">
            <dt className="truncate text-[0.7rem] text-ink-3 sm:text-xs">{label}</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-ink sm:text-2xl" data-stat={label}>
              {value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */
function ago(t: ReturnType<typeof useI18n>['t'], iso: string): string {
  const h = t.timer.history
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return h.justNow
  if (min < 60) return fmt(h.minAgo, { n: min })
  if (min < 60 * 24) return fmt(h.hAgo, { n: Math.floor(min / 60) })
  return fmt(h.dAgo, { n: Math.floor(min / 1440) })
}

export function HistoryTable({ solves, onPenalty, onDelete }: { solves: Solve[]; onPenalty: (id: string, p: Penalty) => void; onDelete: (id: string) => void }) {
  const { t } = useI18n()
  const h = t.timer.history
  const [all, setAll] = useState(false)
  const bestMs = best(solves)
  const rows = solves.map((s, i) => ({ s, n: i + 1 })).reverse()
  const visible = all ? rows : rows.slice(0, 8)
  return (
    <section aria-labelledby="history-title" className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h2 id="history-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Clock size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {h.title}
        </h2>
        {rows.length > 8 && (
          <button type="button" onClick={() => setAll((v) => !v)} className="btn text-sm text-[#8fb8ff] hover:text-ink">
            {all ? h.showLess : fmt(h.showAll, { n: rows.length })}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink-3">{h.empty}</p>
      ) : (
        <div className={cx('mt-3 overflow-x-auto', all && 'max-h-[420px] overflow-y-auto')}>
          <table className="w-full min-w-[440px] text-sm" data-history="">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th scope="col" className="py-2 pr-2 font-medium">{h.num}</th>
                <th scope="col" className="py-2 pr-2 font-medium">{h.time}</th>
                <th scope="col" className="py-2 pr-2 font-medium">{h.delta}</th>
                <th scope="col" className="py-2 pr-2 font-medium">{h.when}</th>
                <th scope="col" className="py-2 text-right font-medium">{h.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ s, n }, idx) => {
                const eff = effective(s)
                const isBest = bestMs !== null && eff === bestMs
                const delta = eff === DNF || bestMs === null ? null : eff - bestMs
                return (
                  <tr key={s.id} className={cx('border-t border-line', idx === 0 && 'bg-accent/[0.08]')}>
                    <td className="py-2 pr-2 font-mono text-ink-3">{n}</td>
                    <td className={cx('py-2 pr-2 font-mono text-base font-semibold', isBest ? 'text-[#4fe08f]' : 'text-ink')}>
                      {formatSolve(s)}
                      {isBest && <Trophy size={13} className="ml-1.5 inline text-st-yellow" aria-label={t.timer.stats.best} />}
                    </td>
                    <td className="py-2 pr-2 font-mono text-ink-3">{delta === null ? '-' : delta === 0 ? '0.00' : `+${formatTime(delta)}`}</td>
                    <td className="py-2 pr-2 text-ink-3">{ago(t, s.at)}</td>
                    <td className="py-2 text-right">
                      <PenaltyButtons compact solve={s} label={fmt(h.penaltyFor, { n })} onPenalty={(p) => onPenalty(s.id, p)} onDelete={() => onDelete(s.id)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */
export function SessionCard({ sessions, active, solves, onSelect, onNew }: { sessions: Session[]; active: Session; solves: Solve[]; onSelect: (id: string) => void; onNew: () => void }) {
  const { t } = useI18n()
  const s = t.timer.session
  const rows = [
    { label: s.solves, value: String(solves.length) },
    { label: s.mean, value: formatTime(mean(solves), 'average') },
    { label: s.best, value: formatTime(best(solves)) },
    { label: t.timer.stats.bestAo5, value: formatTime(bestAverage(solves, 5), 'average') },
  ]
  return (
    <section aria-labelledby="session-title" className="glass rounded-3xl p-5">
      <h2 id="session-title" className="font-display text-lg font-semibold">{s.title}</h2>
      <div className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="session-select">{s.pick}</label>
        <select
          id="session-select"
          value={active.id}
          onChange={(e) => onSelect(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-xl border border-line-strong/60 bg-canvas/70 px-3 text-sm text-ink outline-none focus:border-accent-hover"
        >
          {sessions.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={onNew} className="btn inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-canvas/60 px-3 text-sm text-ink-2 hover:text-ink">
          <Plus size={15} aria-hidden="true" /> {s.newSession}
        </button>
      </div>
      <dl className="mt-4 grid gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <dt className="text-ink-2">{r.label}</dt>
            <dd className="font-mono font-semibold text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */
export function AchievementsCard({ statuses }: { statuses: AchievementStatus[] }) {
  const { t } = useI18n()
  const a = t.timer.achievements
  return (
    <section aria-labelledby="ach-title" className="glass rounded-3xl p-5">
      <h2 id="ach-title" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Trophy size={18} className="text-st-yellow" aria-hidden="true" /> {a.title}
      </h2>
      <ul className="mt-3 grid gap-2">
        {ACHIEVEMENT_IDS.map((id) => {
          const st = statuses.find((x) => x.id === id)!
          const item = a.items[id]
          return (
            <li key={id} className={cx('flex items-center gap-3 rounded-xl border px-3 py-2.5', st.unlocked ? 'border-st-yellow/40 bg-st-yellow/[0.07]' : 'border-line')}>
              <span className={cx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', st.unlocked ? 'bg-st-yellow/20 text-st-yellow' : 'bg-white/5 text-ink-3')}>
                {st.unlocked ? <Award size={17} aria-hidden="true" /> : <Award size={17} className="opacity-50" aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx('truncate text-sm font-semibold', st.unlocked ? 'text-ink' : 'text-ink-2')}>{item.name}</p>
                {st.unlocked ? (
                  <p className="text-xs text-st-yellow">{a.unlocked}</p>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(st.progress * 100)}%` }} />
                    </span>
                    <span className="sr-only">{a.locked}.</span>
                    <span className="text-[11px] text-ink-3">{item.text}</span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Check, Circle, CircleDot, GraduationCap, LogIn, Minus, Timer, TrendingDown, TrendingUp, UserPlus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { Avatar } from '@/components/layout/UserMenu'
import { evaluateAchievements } from '@/features/achievements/achievements'
import { useAuth } from '@/features/auth/AuthProvider'
import { LESSON_IDS, LESSON_KEY, lessonPath, type LessonId } from '@/features/learn/lessons'
import { useLearnProgress } from '@/features/learn/LearnProgressProvider'
import { summarize, trend } from '@/features/profile/insights'
import { useSync } from '@/features/sync/SyncProvider'
import { TimeChart } from '@/features/timer/TimeChart'
import { AchievementsCard, ago } from '@/features/timer/TimerPanels'
import { formatSolve, formatTime } from '@/features/timer/stats'
import { useTimerStore } from '@/features/timer/TimerStore'
import { EVENT_LABEL, TIMER_EVENTS } from '@/features/timer/types'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx, fmt } from '@/lib/format'

/** The signed-in cuber's page: course progress, 3x3 numbers, whether they are improving, and their history. */
export default function ProfilePage() {
  const { t, locale } = useI18n()
  const p = t.profile
  const { user, ready } = useAuth()
  const sync = useSync()
  const store = useTimerStore()
  const { progress } = useLearnProgress()
  const lang = locale === 'pt' ? 'pt-BR' : 'en-US'
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }), [lang])
  const fmtDate = (iso: string) => dateFmt.format(new Date(iso))

  const solves333 = store.allSolves('333')
  const summary = useMemo(() => summarize(solves333), [solves333])
  const tr = useMemo(() => trend(solves333), [solves333])
  const chartSolves = useMemo(() => [...solves333].sort((a, b) => a.at.localeCompare(b.at)), [solves333])
  const recent = useMemo(() => [...solves333].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8), [solves333])
  const statuses = useMemo(() => evaluateAchievements({ lessons: progress.completed, solves: store.allSolves() }), [progress.completed, store])

  if (!ready) return <div className="min-h-[70svh]" />

  /* ---------- Not signed in ---------- */
  if (!user) {
    return (
      <section className="mx-auto grid min-h-[75svh] max-w-[720px] place-items-center px-4 pb-10 pt-28 text-center sm:px-6">
        <div className="glass w-full rounded-3xl p-8 sm:p-10">
          <StickerStrip width="w-16" className="mx-auto" />
          <Kicker className="mt-5">{p.kicker}</Kicker>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,4vw,2.4rem)] font-semibold tracking-tight">{p.guest.title}</h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-ink-2">{p.guest.text}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink to={routes.signIn} icon={<LogIn size={18} aria-hidden="true" />}>
              {p.guest.signIn}
            </ButtonLink>
            <ButtonLink to={routes.signUp} variant="secondary" icon={<UserPlus size={18} aria-hidden="true" />}>
              {p.guest.signUp}
            </ButtonLink>
          </div>
        </div>
      </section>
    )
  }

  /* ---------- Course ---------- */
  const lessonCopy = (id: LessonId) => t.learn[LESSON_KEY[id]] as { parts?: unknown[] }
  const done = progress.completed.length
  const nextLesson = LESSON_IDS.find((id) => !progress.completed.includes(id))
  const courseDone = done === LESSON_IDS.length

  /* ---------- Events ---------- */
  const events = TIMER_EVENTS.map((e) => ({ e, n: store.allSolves(e).length })).filter((x) => x.e === '333' || x.n > 0)

  const tile = (label: string, value: string, sub?: string, accent = false) => (
    <div className="rounded-2xl border border-line bg-canvas/50 px-3.5 py-3" data-profile-stat={label}>
      <p className="truncate text-[0.72rem] text-ink-3">{label}</p>
      <p className={cx('mt-0.5 font-display text-xl font-semibold tabular-nums sm:text-2xl', accent ? 'text-[#4fe08f]' : 'text-ink')}>{value}</p>
      {sub && <p className="truncate text-[0.7rem] text-ink-3">{sub}</p>}
    </div>
  )

  const TrendIcon = tr?.kind === 'better' ? TrendingUp : tr?.kind === 'worse' ? TrendingDown : Minus

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      {/* ---------- Who ---------- */}
      <header className="glass flex flex-wrap items-center gap-4 rounded-3xl p-5 sm:p-6">
        <Avatar name={user.name} size={64} />
        <div className="min-w-0 flex-1">
          <Kicker>{p.kicker}</Kicker>
          <h1 className="mt-1 truncate font-display text-[clamp(1.6rem,3.4vw,2.3rem)] font-semibold tracking-tight" data-profile-name="">
            {user.name}
          </h1>
          <p className="truncate text-sm text-ink-2">{user.email}</p>
        </div>
        <div className="text-sm text-ink-3 sm:text-right">
          <p>{fmt(p.memberSince, { date: fmtDate(user.createdAt) })}</p>
          {sync.userId && <p className="mt-0.5 text-xs">{p.synced}</p>}
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ---------- Left: 3x3 ---------- */}
        <div className="grid content-start gap-5">
          <section aria-labelledby="stats-title" className="glass rounded-3xl p-5 sm:p-6">
            <h2 id="stats-title" className="flex items-center gap-2 font-display text-lg font-semibold">
              <Timer size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {p.stats.title}
            </h2>
            {summary.count === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line p-5 text-center">
                <p className="text-ink-2">{p.stats.empty}</p>
                <ButtonLink to={routes.timer} className="mt-4" icon={<Timer size={17} aria-hidden="true" />}>
                  {p.stats.openTimer}
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {tile(p.stats.best, summary.best ? formatSolve(summary.best) : '–', summary.best ? fmt(p.stats.on, { date: fmtDate(summary.best.at) }) : undefined, true)}
                {tile(p.stats.mean, formatTime(summary.mean, 'average'))}
                {tile(p.stats.ao5, formatTime(summary.ao5, 'average'), `${p.stats.bestAo5}: ${formatTime(summary.bestAo5, 'average')}`)}
                {tile(p.stats.ao12, formatTime(summary.ao12, 'average'), `${p.stats.bestAo12}: ${formatTime(summary.bestAo12, 'average')}`)}
                {tile(p.stats.total, String(summary.count))}
                {tile(p.stats.dnfs, String(summary.dnfs))}
              </div>
            )}
          </section>

          {/* Am I improving? */}
          <section aria-labelledby="trend-title" className="glass rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="trend-title" className="flex items-center gap-2 font-display text-lg font-semibold">
                <BarChart3 size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {p.trend.title}
              </h2>
              {tr && (
                <span
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                    tr.kind === 'better' && 'bg-st-green/15 text-[#4fe08f]',
                    tr.kind === 'worse' && 'bg-[#ff6b7d]/12 text-[#ff8a96]',
                    tr.kind === 'steady' && 'bg-white/5 text-ink-2',
                  )}
                  data-trend={tr.kind}
                >
                  <TrendIcon size={14} aria-hidden="true" />
                  {tr.kind === 'better' ? p.trend.betterTag : tr.kind === 'worse' ? p.trend.worseTag : p.trend.steadyTag}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {tr
                ? fmt(p.trend[tr.kind], {
                    n: tr.window,
                    first: formatTime(tr.firstMs, 'average'),
                    last: formatTime(tr.lastMs, 'average'),
                    delta: `${(tr.deltaMs / 1000).toFixed(2)} s`,
                  })
                : p.trend.needMore}
            </p>
            <h3 className="mt-5 text-sm font-semibold text-ink">{p.chartTitle}</h3>
            <div className="mt-2">
              <TimeChart solves={chartSolves} />
            </div>
            <p className="mt-2 text-xs text-ink-3">{p.chartNote}</p>
          </section>

          {recent.length > 0 && (
            <section aria-labelledby="recent-title" className="glass rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="recent-title" className="font-display text-lg font-semibold">
                  {p.recent.title}
                </h2>
                <Link to={routes.timer} className="inline-flex items-center gap-1.5 text-sm text-[#8fb8ff] hover:text-ink">
                  {p.recent.all} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-line" data-recent="">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <span className={cx('font-mono font-semibold tabular-nums', s.id === summary.best?.id ? 'text-[#4fe08f]' : 'text-ink')}>{formatSolve(s)}</span>
                    <span className="text-ink-3">{ago(t, s.at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ---------- Right: course, events, achievements ---------- */}
        <div className="grid content-start gap-5">
          <section aria-labelledby="course-title" className="glass rounded-3xl p-5 sm:p-6" data-course="">
            <div className="flex items-start justify-between gap-3">
              <h2 id="course-title" className="flex items-center gap-2 font-display text-lg font-semibold">
                <GraduationCap size={18} className="text-[#8fb8ff]" aria-hidden="true" /> {p.course.title}
              </h2>
              {courseDone && (
                <span className="inline-flex items-center gap-1 rounded-full bg-st-green/15 px-2.5 py-1 text-xs font-semibold text-[#4fe08f]">
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> {p.course.done}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between text-sm">
              <span className="text-ink-2">{fmt(p.course.progress, { n: done, total: LESSON_IDS.length })}</span>
              <span className="font-mono text-ink-3">{Math.round((done / LESSON_IDS.length) * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2f6bff] to-[#4fe08f]" style={{ width: `${(done / LESSON_IDS.length) * 100}%` }} />
            </div>
            <ol className="mt-4 grid gap-1.5">
              {LESSON_IDS.map((id, i) => {
                const isDone = progress.completed.includes(id)
                const reached = progress.partsReached[id]
                const total = lessonCopy(id).parts?.length ?? 5
                const name = t.learn.lessons[LESSON_KEY[id]].title
                return (
                  <li key={id}>
                    <Link to={lessonPath(id)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5" data-lesson-status={isDone ? 'done' : reached !== undefined ? 'progress' : 'new'}>
                      {isDone ? (
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-st-green/20 text-[#4fe08f]">
                          <Check size={14} strokeWidth={3} aria-hidden="true" />
                        </span>
                      ) : reached !== undefined ? (
                        <CircleDot size={22} className="shrink-0 text-[#8fb8ff]" aria-hidden="true" />
                      ) : (
                        <Circle size={22} className="shrink-0 text-ink-3" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {i + 1}. {name}
                        </span>
                        <span className="block text-xs text-ink-3">
                          {isDone ? p.course.completed : reached !== undefined ? fmt(p.course.inProgress, { part: reached + 1, total }) : p.course.notStarted}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
            <ButtonLink
              to={nextLesson ? lessonPath(nextLesson) : routes.learn}
              variant={courseDone ? 'secondary' : 'primary'}
              className="mt-4 w-full"
              trailing={<ArrowRight size={17} aria-hidden="true" />}
            >
              {courseDone ? p.course.review : done === 0 && !Object.keys(progress.partsReached).length ? p.course.start : fmt(p.course.continue, { lesson: t.learn.lessons[LESSON_KEY[nextLesson!]].title })}
            </ButtonLink>
          </section>

          <section aria-labelledby="events-title" className="glass rounded-3xl p-5 sm:p-6">
            <h2 id="events-title" className="font-display text-lg font-semibold">
              {p.events.title}
            </h2>
            <ul className="mt-3 grid gap-2">
              {events.map(({ e, n }) => (
                <li key={e} className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5" data-event-row={e}>
                  <span className="font-display font-semibold">{EVENT_LABEL[e]}</span>
                  <span className="text-sm text-ink-2">{n === 0 ? p.events.none : n === 1 ? p.events.solveOne : fmt(p.events.solves, { n })}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-3">{p.events.more}</p>
          </section>

          <AchievementsCard statuses={statuses} />
        </div>
      </div>
    </div>
  )
}

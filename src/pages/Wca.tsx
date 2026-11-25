import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Medal,
  Play,
  Search,
  ShieldCheck,
  Timer,
  Trophy,
  UserPlus,
} from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { Reveal } from '@/components/ui/Reveal'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { LazyCube } from '@/features/cube/LazyCube'
import { CompetitionFinder } from '@/features/wca/CompetitionFinder'
import { EventIcon } from '@/features/wca/EventIcon'
import {
  EVENT_IDS,
  LEGENDS,
  RECORDS_CHECKED,
  WCA_RECORDS_URL,
  WCA_URL,
  WORLD_RECORDS,
  personUrl,
  type EventId,
  type RecordEntry,
} from '@/features/wca/records'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx, fmt } from '@/lib/format'

const STEP_ICONS = [UserPlus, Search, Play, ShieldCheck, BarChart3]

/** Display order of the featured events (object keys like '333' would otherwise sort numerically). */
const FEATURED = ['333', '222', '444', '555', 'pyram', 'minx', 'skewb', 'sq1', '333bf'] as const

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}

/** The competition timer the hero cube sits on (drawn, generic, no brand). */
function TimerPad({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 520 150" className="w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="pad-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2347" />
          <stop offset="1" stopColor="#070b1c" />
        </linearGradient>
        <filter id="pad-glow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="260" cy="128" rx="250" ry="18" fill="#2f7bff" opacity="0.18" />
      <path d="M40 112 L110 34 Q260 14 410 34 L480 112 Q260 140 40 112 Z" fill="url(#pad-body)" stroke="#2c3f78" />
      <ellipse cx="128" cy="76" rx="46" ry="18" fill="#123a8a" stroke="#3d7bff" strokeOpacity="0.6" transform="rotate(-8 128 76)" />
      <ellipse cx="392" cy="76" rx="46" ry="18" fill="#123a8a" stroke="#3d7bff" strokeOpacity="0.6" transform="rotate(8 392 76)" />
      <rect x="196" y="58" width="128" height="50" rx="10" fill="#040507" stroke="#2a2f3d" />
      <text x="260" y="95" textAnchor="middle" className="font-mono" fontSize="34" fontWeight="700" fill="#ff3b3b" filter="url(#pad-glow)">
        0.000
      </text>
    </svg>
  )
}

function Holders({ entry, more }: { entry: RecordEntry; more: string }) {
  const [first, ...rest] = entry.holders
  return (
    <span title={entry.holders.join(', ')}>
      {first}
      {rest.length > 0 && <span className="ml-1.5 text-ink-3">{fmt(more, { n: rest.length })}</span>}
    </span>
  )
}

export default function WcaPage() {
  const { t, locale } = useI18n()
  const w = t.wca
  const r = w.records
  const lang = locale === 'pt' ? 'pt-BR' : 'en-US'
  const [y, m, d] = RECORDS_CHECKED.split('-').map(Number)
  const checked = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
  const eventName = (id: EventId) =>
    (w.events.featured as Record<string, { name: string } | undefined>)[id]?.name ?? (w.events.more as Record<string, string>)[id] ?? id
  const half = Math.ceil(EVENT_IDS.length / 2)

  const recordTable = (ids: EventId[], key: string) => (
    <table key={key} className="w-full table-fixed text-left text-sm">
      <colgroup>
        <col className="w-[30%]" />
        <col className="w-[35%]" />
        <col className="w-[35%]" />
      </colgroup>
      <thead>
        <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.12em] text-ink-3">
          <th scope="col" className="py-2.5 pr-3 font-medium">{r.event}</th>
          <th scope="col" className="py-2.5 pr-3 font-medium">{r.single}</th>
          <th scope="col" className="py-2.5 font-medium">{r.average}</th>
        </tr>
      </thead>
      <tbody>
        {ids.map((id) => {
          const rec = WORLD_RECORDS[id]
          return (
            <tr key={id} className="border-b border-line/70 align-top last:border-0" data-record-row={id}>
              <th scope="row" className="py-2.5 pr-3 font-medium text-ink">{eventName(id)}</th>
              <td className="py-2.5 pr-3">
                <span className="block font-mono font-semibold text-[#4b9dff]">{rec.single.result}</span>
                <span className="block break-words text-xs text-ink-2">
                  <Holders entry={rec.single} more={r.others} />
                </span>
              </td>
              <td className="py-2.5">
                {rec.average ? (
                  <>
                    <span className="block font-mono font-semibold text-[#4b9dff]">
                      {rec.average.result}
                      {rec.average.kind === 'mean' && <span className="ml-1.5 font-sans text-[0.7rem] font-normal text-ink-3">{r.mean}</span>}
                    </span>
                    <span className="block break-words text-xs text-ink-2">
                      <Holders entry={rec.average} more={r.others} />
                    </span>
                  </>
                ) : (
                  <span className="text-ink-3">–</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  return (
    <div className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative mx-auto grid max-w-[1320px] items-center gap-6 px-4 pb-10 pt-28 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:pt-28">
        <div className="relative z-10">
          <Kicker className="hero-fade">{w.kicker}</Kicker>
          <h1 className="hero-fade mt-5 font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.03em]" style={{ animationDelay: '100ms' }}>
            {w.title} <span className="text-gradient">{w.titleAccent}</span>
          </h1>
          <p className="hero-fade mt-5 max-w-[46ch] text-[clamp(1.02rem,1.4vw,1.2rem)] leading-relaxed text-ink-2" style={{ animationDelay: '220ms' }}>
            {w.subtitle}
          </p>
          <div className="hero-fade mt-8 flex flex-wrap gap-3" style={{ animationDelay: '340ms' }}>
            <Button type="button" onClick={() => scrollTo('competitions')} icon={<Trophy size={18} aria-hidden="true" />}>
              {w.explore}
            </Button>
            <Button type="button" variant="secondary" onClick={() => scrollTo('how')} icon={<Play size={18} aria-hidden="true" />}>
              {w.howButton}
            </Button>
          </div>
        </div>

        {/* Stage: lights, the cube, the timer */}
        <div className="hero-fade relative" style={{ animationDelay: '200ms' }}>
          <div className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
            <div className="absolute left-[18%] top-0 h-[120%] w-24 -rotate-[18deg] bg-gradient-to-b from-[#8b5cf6]/30 to-transparent blur-xl" />
            <div className="absolute right-[20%] top-0 h-[120%] w-24 rotate-[16deg] bg-gradient-to-b from-[#22d3ee]/25 to-transparent blur-xl" />
            <div className="absolute left-1/2 top-[40%] h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.32),transparent_68%)] blur-2xl" />
          </div>
          <LazyCube label={w.stage.cubeLabel} idleSpin className="relative mx-auto h-[min(64vw,300px)] w-full max-w-[420px] lg:h-[320px]" />
          <div className="relative mx-auto -mt-10 max-w-[520px] px-2">
            <TimerPad label={w.stage.timer} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pb-16 sm:px-6 lg:px-8">
        {/* ---------- What is the WCA + Official events ---------- */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
          <Reveal as="section" className="glass rounded-3xl p-6 sm:p-7" >
            <h2 className="flex items-center gap-2.5 font-display text-[1.45rem] font-semibold tracking-tight">
              <Medal size={24} className="text-[#5aa8ff]" aria-hidden="true" /> {w.about.title}
            </h2>
            <p className="mt-3 leading-relaxed text-ink-2">{w.about.text}</p>
            <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
              {w.about.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="sr-only">{fact.label}</dt>
                  <dd className="font-display text-[1.35rem] font-semibold leading-tight text-ink">{fact.value}</dd>
                  <dd className="mt-1 text-xs leading-snug text-ink-3">{fact.label}</dd>
                </div>
              ))}
            </dl>
            <a
              href={`${WCA_URL}/about`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 font-medium text-[#7fb0ff] underline-offset-4 hover:underline"
            >
              {w.about.link} <ExternalLink size={15} aria-hidden="true" />
            </a>
          </Reveal>

          <Reveal as="section" delay={80} className="glass rounded-3xl p-6 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[1.45rem] font-semibold tracking-tight">{w.events.title}</h2>
              <p className="text-sm text-ink-3">{w.events.note}</p>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED.map((id) => (
                <li key={id} className="flex items-center gap-3.5 rounded-2xl border border-line bg-canvas/50 p-3.5 transition-colors hover:border-line-strong" data-event={id}>
                  <EventIcon id={id} className="h-12 w-12 shrink-0" />
                  <span>
                    <span className="block font-display font-semibold text-ink">{w.events.featured[id].name}</span>
                    <span className="block text-[0.82rem] leading-snug text-ink-2">{w.events.featured[id].text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-3">{w.events.moreTitle}</span>
              {(['666', '777', '333oh', '333fm', 'clock', '444bf', '555bf', '333mbf'] as const).map((id) => (
                <span key={id} className="rounded-full border border-line px-3 py-1 text-[0.82rem] text-ink-2" data-event={id}>
                  {w.events.more[id]}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ---------- How competitions work ---------- */}
        <Reveal as="section" className="glass scroll-mt-24 rounded-3xl p-6 outline-none sm:p-7">
          <div id="how" tabIndex={-1} className="grid gap-6 outline-none xl:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] xl:items-center">
            <div className="flex gap-4">
              <ClipboardList size={40} strokeWidth={1.4} className="mt-1 shrink-0 text-[#5aa8ff]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-[1.45rem] font-semibold tracking-tight">{w.how.title}</h2>
                <p className="mt-1.5 text-ink-2">{w.how.text}</p>
              </div>
            </div>
            <ol className="grid gap-3 md:grid-cols-5 md:gap-2">
              {w.how.steps.map((step, i) => {
                const Icon = STEP_ICONS[i]
                return (
                  <li key={step.title} className="relative flex md:block">
                    <div className="relative flex-1 rounded-2xl border border-line bg-canvas/50 p-4 pt-5">
                      <span className="absolute -top-2.5 left-4 grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <Icon size={24} strokeWidth={1.6} className="text-[#7fb0ff]" aria-hidden="true" />
                      <h3 className="mt-2 font-display font-semibold text-ink">{step.title}</h3>
                      <p className="mt-1 text-[0.82rem] leading-snug text-ink-2">{step.text}</p>
                    </div>
                    {i < w.how.steps.length - 1 && (
                      <ChevronRight
                        size={18}
                        className="absolute -right-[13px] top-1/2 z-10 hidden -translate-y-1/2 text-[#5aa8ff] md:block"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
          <p className="mt-5 border-t border-line pt-4 text-sm text-ink-3">{w.how.format}</p>
        </Reveal>

        {/* ---------- Records & legends ---------- */}
        <Reveal as="section" className="glass rounded-3xl p-6 sm:p-7" >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex gap-4">
              <Trophy size={40} strokeWidth={1.4} className="mt-1 shrink-0 text-[#5aa8ff]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-[1.45rem] font-semibold tracking-tight">{r.title}</h2>
                <p className="mt-1.5 text-ink-2">{r.text}</p>
              </div>
            </div>
            <StickerStrip width="w-20" className="mb-2" />
          </div>

          <h3 className="mt-7 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-3">{r.legendsLabel}</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {LEGENDS.map((l) => {
              const copy = r.legends[l.id]
              const initials = l.name
                .replace(/\(.*\)/, '')
                .trim()
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
              return (
                <li key={l.id} className="flex flex-col rounded-2xl border border-line bg-canvas/50 p-4" data-legend={l.id}>
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2f6bff] to-[#8b5cf6] font-display text-lg font-bold text-white"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <span>
                      <span className="block font-display font-semibold leading-tight text-ink">{l.name}</span>
                      <span className="block text-xs text-ink-3">{copy.country}</span>
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-[0.88rem] leading-relaxed text-ink-2">{copy.text}</p>
                  <a
                    href={personUrl(l.wcaId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#7fb0ff] underline-offset-4 hover:underline"
                  >
                    {r.profile} <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">{r.tableTitle}</h3>
            <p className="text-sm text-ink-3">{fmt(r.tableNote, { date: checked })}</p>
          </div>
          <div className="mt-3 grid items-start gap-x-8 lg:grid-cols-2" data-records="">
            {recordTable(EVENT_IDS.slice(0, half), 'a')}
            {recordTable(EVENT_IDS.slice(half), 'b')}
          </div>
          <a
            href={WCA_RECORDS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#7fb0ff] underline-offset-4 hover:underline"
          >
            {r.allRecords} <ExternalLink size={14} aria-hidden="true" />
          </a>
        </Reveal>

        {/* ---------- Find a competition (live WCA data) ---------- */}
        <CompetitionFinder />

        {/* ---------- Practice ---------- */}
        <Reveal as="aside" className={cx('glass relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8 lg:flex lg:items-center lg:gap-8')}>
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-[42rem] rotate-[-12deg] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.18),transparent)]"
            aria-hidden="true"
          />
          <Timer size={48} strokeWidth={1.3} className="relative shrink-0 text-[#5aa8ff]" aria-hidden="true" />
          <div className="relative mt-4 lg:mt-0 lg:flex-1">
            <h2 className="font-display text-[clamp(1.35rem,2.2vw,1.75rem)] font-semibold tracking-tight">{w.practice.title}</h2>
            <p className="mt-1.5 max-w-[64ch] text-ink-2">{w.practice.text}</p>
          </div>
          <ButtonLink to={routes.timer} className="relative mt-5 lg:mt-0" icon={<Play size={18} aria-hidden="true" />} trailing={<ArrowRight size={18} aria-hidden="true" />}>
            {w.practice.button}
          </ButtonLink>
        </Reveal>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, ExternalLink, Globe2, Loader2, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n/I18nProvider'
import { useInView } from '@/lib/useInView'
import { cx, fmt } from '@/lib/format'
import { WCA_URL } from './records'

/** The fields this page reads from the public WCA API (it returns many more). */
type Competition = {
  id: string
  name: string
  city: string
  country_iso2: string
  start_date: string
  end_date: string
  event_ids: string[]
  competitor_limit: number | null
  registration_open: string | null
  registration_close: string | null
  cancelled_at: string | null
  url: string
}

/** Countries offered in the filter (labels come from the browser, in the page's language). */
const COUNTRIES = [
  'AR', 'AU', 'AT', 'BE', 'BO', 'BR', 'CA', 'CL', 'CN', 'CO', 'CR', 'CZ', 'DK', 'DO', 'EC', 'EG', 'FI', 'FR', 'DE',
  'GT', 'HK', 'HU', 'IN', 'ID', 'IE', 'IL', 'IT', 'JP', 'KZ', 'KR', 'MY', 'MX', 'NL', 'NZ', 'NO', 'PA', 'PY', 'PE',
  'PH', 'PL', 'PT', 'RO', 'SG', 'SK', 'ZA', 'ES', 'SE', 'CH', 'TW', 'TH', 'TR', 'UA', 'AE', 'GB', 'US', 'UY', 'VE', 'VN',
]

type Range = 'any' | 'month' | 'quarter' | 'half'
const RANGE_DAYS: Record<Range, number | null> = { any: null, month: 30, quarter: 91, half: 182 }
const PAGE = 6

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const parseDay = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Guess a sensible starting country from the browser language (pt-BR -> BR). */
function guessCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    return region && COUNTRIES.includes(region) ? region : ''
  } catch {
    return ''
  }
}

async function fetchCompetitions(country: string, range: Range, signal: AbortSignal): Promise<Competition[]> {
  const today = new Date()
  const params = new URLSearchParams({ start: isoDay(today), sort: 'start_date', per_page: '100' })
  if (country) params.set('country_iso2', country)
  const days = RANGE_DAYS[range]
  if (days) params.set('end', isoDay(new Date(today.getTime() + days * 86_400_000)))
  const res = await fetch(`${WCA_URL}/api/v0/competitions?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`WCA API ${res.status}`)
  const data = (await res.json()) as Competition[]
  return data.filter((c) => !c.cancelled_at)
}

type State = { status: 'idle' | 'loading' | 'done' | 'error'; items: Competition[] }

export function CompetitionFinder() {
  const { t, locale } = useI18n()
  const f = t.wca.finder
  const lang = locale === 'pt' ? 'pt-BR' : 'en-US'
  const regionNames = useMemo(() => new Intl.DisplayNames([lang], { type: 'region' }), [lang])
  const countryName = useCallback(
    (code: string) => {
      try {
        return regionNames.of(code) ?? code
      } catch {
        return code
      }
    },
    [regionNames],
  )
  const countries = useMemo(
    () => COUNTRIES.map((c) => ({ code: c, name: countryName(c) })).sort((a, b) => a.name.localeCompare(b.name, lang)),
    [countryName, lang],
  )

  const [country, setCountry] = useState(guessCountry)
  const [city, setCity] = useState('')
  const [range, setRange] = useState<Range>('quarter')
  const [query, setQuery] = useState<{ country: string; range: Range; city: string } | null>(null)
  const [state, setState] = useState<State>({ status: 'idle', items: [] })
  const [shown, setShown] = useState(PAGE)
  const results = useRef<HTMLDivElement>(null)

  // First search runs once the section scrolls into view, not on page load.
  const { ref, inView } = useInView<HTMLElement>({ once: true, rootMargin: '200px', threshold: 0 })
  useEffect(() => {
    if (inView && !query) setQuery({ country, range, city })
  }, [inView, query, country, range, city])

  useEffect(() => {
    if (!query) return
    const ctrl = new AbortController()
    setState((s) => ({ status: 'loading', items: s.items }))
    setShown(PAGE)
    fetchCompetitions(query.country, query.range, ctrl.signal)
      .then((items) => setState({ status: 'done', items }))
      .catch((err) => {
        if (!ctrl.signal.aborted) {
          console.warn('WCA competitions request failed', err)
          setState({ status: 'error', items: [] })
        }
      })
    return () => ctrl.abort()
  }, [query?.country, query?.range]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const needle = fold((query?.city ?? '').trim())
    return needle ? state.items.filter((c) => fold(c.city).includes(needle)) : state.items
  }, [state.items, query?.city])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setQuery({ country, range, city })
    results.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const dateFmt = useMemo(() => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }), [lang])
  const dates = (c: Competition) => {
    const a = parseDay(c.start_date)
    const b = parseDay(c.end_date)
    return c.start_date === c.end_date ? dateFmt.format(a) : dateFmt.formatRange(a, b)
  }
  const registration = (c: Competition) => {
    const now = Date.now()
    const open = c.registration_open ? Date.parse(c.registration_open) : null
    const close = c.registration_close ? Date.parse(c.registration_close) : null
    if (open && now < open) return { tone: 'soon' as const, text: fmt(f.opens, { date: dateFmt.format(new Date(open)) }) }
    if (close && now < close) return { tone: 'open' as const, text: f.open }
    return { tone: 'closed' as const, text: f.closed }
  }

  const wcaSearch = `${WCA_URL}/competitions`
  const field = 'mt-1.5 h-12 w-full rounded-xl border border-line-strong/70 bg-canvas/70 pl-10 pr-3 text-[0.95rem] text-ink transition-colors hover:border-[#7d95d6] focus:border-accent-hover'

  return (
    <section ref={ref} id="competitions" tabIndex={-1} aria-labelledby="finder-title" className="glass scroll-mt-24 rounded-3xl p-6 outline-none sm:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] xl:items-end">
        <div className="flex gap-4">
          <MapPin size={40} strokeWidth={1.4} className="mt-1 shrink-0 text-[#5aa8ff]" aria-hidden="true" />
          <div>
            <h2 id="finder-title" className="font-display text-[clamp(1.35rem,2.2vw,1.75rem)] font-semibold tracking-tight">
              {f.title}
            </h2>
            <p className="mt-1.5 text-ink-2">{f.text}</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="block text-sm text-ink-2">
            {f.country}
            <span className="relative block">
              <Globe2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={cx(field, 'appearance-none')} data-finder="country">
                <option value="">{f.anyCountry}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="block text-sm text-ink-2">
            {f.city}
            <span className="relative block">
              <MapPin size={17} className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={f.cityPlaceholder}
                className={cx(field, 'placeholder:text-ink-3')}
                data-finder="city"
              />
            </span>
          </label>
          <label className="block text-sm text-ink-2">
            {f.date}
            <span className="relative block">
              <CalendarDays size={17} className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <select value={range} onChange={(e) => setRange(e.target.value as Range)} className={cx(field, 'appearance-none')} data-finder="date">
                {(Object.keys(f.dates) as Range[]).map((r) => (
                  <option key={r} value={r}>
                    {f.dates[r]}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <Button type="submit" className="h-12 sm:col-span-2 lg:col-span-1" trailing={<ArrowRight size={18} aria-hidden="true" />}>
            {f.search}
          </Button>
        </form>
      </div>

      <div ref={results} className="mt-7 scroll-mt-28" aria-live="polite" aria-busy={state.status === 'loading'}>
        {state.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {f.loading}
          </p>
        )}
        {state.status === 'error' && (
          <p className="text-sm text-ink-2">
            {f.error}{' '}
            <a href={wcaSearch} target="_blank" rel="noopener noreferrer" className="text-[#7fb0ff] underline underline-offset-4">
              {f.openWca}
            </a>
          </p>
        )}
        {state.status === 'done' && (
          <>
            <p className="text-sm text-ink-3" data-finder="count">
              {filtered.length === 1 ? f.countOne : fmt(f.count, { n: filtered.length })}
            </p>
            {filtered.length === 0 ? (
              <p className="mt-3 text-ink-2">{f.empty}</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(0, shown).map((c) => {
                  const reg = registration(c)
                  return (
                    <li key={c.id} data-competition="">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full flex-col rounded-2xl border border-line bg-canvas/60 p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="font-display font-semibold leading-snug text-ink">{c.name}</span>
                          <ExternalLink size={15} className="mt-1 shrink-0 text-ink-3 transition-colors group-hover:text-ink" aria-hidden="true" />
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-sm text-ink-2">
                          <CalendarDays size={14} aria-hidden="true" /> {dates(c)}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-ink-2">
                          <MapPin size={14} aria-hidden="true" /> {c.city} · {countryName(c.country_iso2)}
                        </span>
                        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 text-xs text-ink-3">
                          <span
                            className={cx(
                              'rounded-full px-2 py-0.5 font-medium',
                              reg.tone === 'open' && 'bg-st-green/15 text-[#5ee39a]',
                              reg.tone === 'soon' && 'bg-accent/15 text-[#8fb8ff]',
                              reg.tone === 'closed' && 'bg-white/5 text-ink-3',
                            )}
                          >
                            {reg.text}
                          </span>
                          <span>{fmt(f.events, { n: c.event_ids.length })}</span>
                          {c.competitor_limit ? (
                            <span className="flex items-center gap-1">
                              <Users size={12} aria-hidden="true" /> {fmt(f.competitors, { n: c.competitor_limit })}
                            </span>
                          ) : null}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {filtered.length > shown && (
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn rounded-lg border border-line px-3.5 py-2 text-ink-2 hover:border-line-strong hover:text-ink">
                  {f.showMore}
                </button>
              )}
              <a href={wcaSearch} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#7fb0ff] underline-offset-4 hover:underline">
                {f.openWca} <ExternalLink size={14} aria-hidden="true" />
              </a>
              <span className="text-ink-3">{f.source}</span>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

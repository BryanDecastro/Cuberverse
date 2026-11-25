import { useLayoutEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Box, ExternalLink, Play, Timer, Trophy, Users, Zap } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { LazyCube } from '@/features/cube/LazyCube'
import { EraArt } from '@/features/history/EraArt'
import { WCA_RECORDS_URL, WORLD_RECORDS } from '@/features/history/records'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx, fmt } from '@/lib/format'

gsap.registerPlugin(ScrollTrigger)

const STAT_ICONS = [Box, Users, Zap]

/**
 * Licensed photos can replace the drawn artwork: add an entry here keyed by
 * the event id (file in public/history/), and the card shows it instead.
 */
const PHOTOS: Record<string, string | undefined> = {}

/**
 * Scroll choreography (GSAP + ScrollTrigger). Everything is visible without it:
 * animations only run when motion is allowed, and all of it is reverted on leave.
 */
function useHistoryMotion(root: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add({ wide: '(min-width: 1024px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
      const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean }
      const q = gsap.utils.selector(el)

      // The progress line always tracks the scroll (it carries meaning, not decoration).
      gsap.fromTo(
        q('[data-line-fill]'),
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: q('[data-timeline]')[0], start: 'top 65%', end: 'bottom 65%', scrub: motion ? 0.4 : true } },
      )
      for (const node of q('[data-node]')) {
        ScrollTrigger.create({
          trigger: node,
          start: 'top 65%',
          onEnter: () => node.setAttribute('data-lit', ''),
          onLeaveBack: () => node.removeAttribute('data-lit'),
        })
      }
      if (!motion) return

      gsap.from(q('[data-hero-item]'), { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' })
      gsap.from(q('[data-hero-cube]'), { scale: 0.85, autoAlpha: 0, duration: 1.2, ease: 'power3.out', delay: 0.15 })
      gsap.from(q('[data-hero-stat]'), { x: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.35 })
      gsap.to(q('[data-hero-cube]'), {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: q('[data-hero]')[0], start: 'top top', end: 'bottom top', scrub: true },
      })

      for (const card of q('[data-card]')) {
        const side = card.getAttribute('data-side') === 'right' ? 1 : -1
        gsap.from(card, {
          x: wide ? side * 56 : 0,
          y: wide ? 0 : 32,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        })
        const art = card.querySelector('[data-art]')
        if (art)
          gsap.fromTo(
            art,
            { yPercent: -5 },
            { yPercent: 5, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
      }
      for (const block of q('[data-rise]'))
        gsap.from(block, {
          y: 36,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: block, start: 'top 90%', once: true },
        })
    })
    // Fonts and the lazy 3D chunk can shift layout after mount.
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh).catch(() => {})
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      mm.revert()
    }
  }, [root])
}

export default function HistoryPage() {
  const { t, locale } = useI18n()
  const h = t.history
  const [y, m, d] = WORLD_RECORDS.checked.split('-').map(Number)
  const checked = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
  const records = [
    { label: h.records.single, r: WORLD_RECORDS.single, solves: null },
    { label: h.records.average, r: WORLD_RECORDS.average, solves: WORLD_RECORDS.average.solves },
  ]
  const root = useRef<HTMLDivElement>(null)
  useHistoryMotion(root)

  const toTimeline = () => {
    const target = document.getElementById('timeline')
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
  }

  return (
    <div ref={root} className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section
        data-hero=""
        className="relative mx-auto grid max-w-[1320px] items-center gap-8 px-4 pb-14 pt-28 sm:px-6 lg:grid-cols-[1.1fr_1fr_auto] lg:gap-6 lg:px-8 lg:pb-16 lg:pt-28"
      >
        <div className="relative z-10">
          <div data-hero-item="">
            <Kicker>{h.kicker}</Kicker>
          </div>
          <h1 data-hero-item="" className="mt-5 font-display text-[clamp(2.5rem,5.2vw,4.4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
            {h.title} <span className="text-gradient">{h.titleAccent}</span>
          </h1>
          <p data-hero-item="" className="mt-5 max-w-[44ch] text-[clamp(1.02rem,1.4vw,1.2rem)] leading-relaxed text-ink-2">
            {h.subtitle}
          </p>
          <div data-hero-item="" className="mt-8 flex flex-wrap gap-3">
            <Button type="button" onClick={toTimeline} icon={<Play size={18} aria-hidden="true" />}>
              {h.explore}
            </Button>
            <ButtonLink to={routes.learn} variant="secondary" icon={<ArrowLeft size={18} aria-hidden="true" />}>
              {h.back}
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.35),rgb(139_92_246/0.14)_45%,transparent_70%)] blur-2xl"
            aria-hidden="true"
          />
          <div data-hero-cube="">
            <LazyCube label={h.cubeLabel} pedestal idleSpin className="h-[min(80vw,360px)] w-full lg:h-[400px]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:w-[220px] lg:flex-col">
          {h.stats.map((s, i) => {
            const Icon = STAT_ICONS[i]
            return (
              <div key={s.label} data-hero-stat="" className="glass flex flex-1 items-center gap-3.5 rounded-2xl px-4 py-3.5">
                <Icon size={24} strokeWidth={1.6} className="shrink-0 text-[#5aa8ff]" aria-hidden="true" />
                <p className="text-sm leading-snug">
                  <span className="block font-display font-semibold text-ink">{s.value}</span>
                  <span className="text-ink-3">{s.label}</span>
                </p>
              </div>
            )
          })}
          <StickerStrip className="mx-auto mt-2 hidden lg:flex" width="w-20" />
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section
        id="timeline"
        tabIndex={-1}
        aria-labelledby="timeline-title"
        className="relative scroll-mt-20 border-t border-line pb-12 pt-14 outline-none lg:pb-14"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <header className="text-center">
            <Kicker>{h.timelineKicker}</Kicker>
            <h2 id="timeline-title" className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold tracking-tight">
              {h.timelineTitle}
            </h2>
          </header>

          <div data-timeline="" className="relative mt-12 lg:mt-16">
            {/* The spine: a faint track and the fill that follows the scroll */}
            <div className="absolute bottom-0 left-[13px] top-0 w-[2px] rounded-full bg-line lg:left-1/2 lg:-translate-x-1/2" aria-hidden="true">
              <div data-line-fill="" className="h-full w-full origin-top rounded-full bg-gradient-to-b from-[#22d3ee] via-[#2f7bff] to-[#8b5cf6]" />
            </div>

            <ol aria-label={h.timelineLabel} className="relative grid gap-8 lg:gap-0">
              {h.events.map((ev, i) => {
                const right = i % 2 === 1
                const photo = PHOTOS[ev.id]
                return (
                  <li
                    key={ev.id}
                    className={cx(
                      'relative grid grid-cols-[28px_minmax(0,1fr)] gap-x-4 lg:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] lg:gap-x-0',
                      // Rows overlap so the two sides interleave; the empty half never blocks the card behind it.
                      i > 0 && 'lg:-mt-20',
                      'lg:pointer-events-none',
                    )}
                  >
                    {/* Node on the spine */}
                    <div className={cx('relative row-start-1 lg:col-start-2', 'col-start-1')} aria-hidden="true">
                      <span
                        data-node=""
                        className="timeline-node absolute left-1/2 top-7 grid h-[18px] w-[18px] -translate-x-1/2 place-items-center rounded-full border-2 border-line-strong bg-canvas transition-[border-color,box-shadow] duration-500"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-line-strong transition-colors duration-500" />
                      </span>
                    </div>

                    <article
                      data-card=""
                      data-side={right ? 'right' : 'left'}
                      className={cx(
                        'glass group row-start-1 grid overflow-hidden rounded-2xl transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong',
                        right ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]' : 'sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]',
                        'col-start-2 lg:pointer-events-auto',
                        right ? 'lg:col-start-3 lg:ml-2' : 'lg:col-start-1 lg:mr-2',
                      )}
                    >
                      <div
                        className={cx(
                          'relative aspect-[400/260] overflow-hidden sm:aspect-auto sm:min-h-[190px]',
                          right && 'sm:order-2',
                        )}
                      >
                        <div data-art="" className="absolute inset-[-6%_0]">
                          {photo ? (
                            <img src={photo} alt={ev.art} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <EraArt id={ev.id} label={ev.art} />
                          )}
                        </div>
                      </div>
                      <div className="p-5 sm:p-6">
                        <p className="font-display text-[1.7rem] font-bold leading-none tracking-tight text-[#4b9dff]">{ev.year}</p>
                        <h3 className="mt-2.5 font-display text-[1.08rem] font-semibold leading-snug text-ink">{ev.title}</h3>
                        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{ev.text}</p>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* ---------- Where it stands today ---------- */}
          <section data-rise="" aria-labelledby="records-title" className="glass relative mt-16 overflow-hidden rounded-3xl p-6 sm:p-8 lg:mt-20">
            <div
              className="pointer-events-none absolute -left-24 -top-28 h-72 w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(239_59_59/0.16),transparent)]"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-end justify-between gap-3">
              <div>
                <Kicker>{h.records.kicker}</Kicker>
                <h2 id="records-title" className="mt-2 font-display text-[clamp(1.4rem,2.4vw,1.9rem)] font-semibold tracking-tight">
                  {h.records.title}
                </h2>
              </div>
              <StickerStrip width="w-20" className="mb-2" />
            </div>
            <div className="relative mt-6 grid gap-4 md:grid-cols-2">
              {records.map(({ label, r, solves }) => (
                <article key={label} data-record="" className="rounded-2xl border border-line bg-canvas/60 p-5 sm:p-6">
                  <p className="flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-3">
                    <Timer size={14} aria-hidden="true" /> {label}
                  </p>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-[clamp(2.8rem,6vw,4rem)] font-bold leading-none tracking-tight text-[#ff5a5a] [text-shadow:0_0_24px_rgb(255_59_59/0.45)]">
                      {r.time}
                    </span>
                    <span className="text-sm text-ink-3">{h.records.seconds}</span>
                  </p>
                  <p className="mt-4 font-display text-lg font-semibold text-ink">{r.person}</p>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {h.records.china} · {r.competition}
                  </p>
                  {solves && (
                    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm text-ink-3" aria-label={solves.join(', ')}>
                      {solves.map((s, i) => (
                        <span key={i}>{s}</span>
                      ))}
                    </p>
                  )}
                </article>
              ))}
            </div>
            <p className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3">
              <span>{fmt(h.records.checked, { date: checked })}</span>
              <a
                href={WCA_RECORDS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#7fb0ff] underline-offset-4 hover:underline"
              >
                {h.records.source} <ExternalLink size={14} aria-hidden="true" />
              </a>
            </p>
          </section>

          {/* ---------- Bridge to WCA & Legends ---------- */}
          <aside
            data-cta=""
            data-rise=""
            className="glass relative mt-6 overflow-hidden rounded-3xl px-6 py-7 sm:px-8 lg:flex lg:items-center lg:gap-8"
          >
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-[42rem] rotate-[-12deg] rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.28),transparent)]"
              aria-hidden="true"
            />
            <Trophy size={52} strokeWidth={1.3} className="relative shrink-0 text-[#5aa8ff]" aria-hidden="true" />
            <div className="relative mt-4 lg:mt-0 lg:flex-1">
              <Kicker>{h.cta.kicker}</Kicker>
              <h2 className="mt-2 font-display text-[clamp(1.4rem,2.4vw,1.9rem)] font-semibold tracking-tight">{h.cta.title}</h2>
              <p className="mt-1.5 max-w-[60ch] text-ink-2">{h.cta.text}</p>
            </div>
            <ButtonLink
              to={routes.wca}
              className="relative mt-5 lg:mt-0"
              trailing={<ArrowRight size={18} aria-hidden="true" />}
            >
              {h.cta.button}
            </ButtonLink>
          </aside>

        </div>
      </section>
    </div>
  )
}

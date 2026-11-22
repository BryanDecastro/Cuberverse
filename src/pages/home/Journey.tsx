import { Award, Timer } from 'lucide-react'
import { Kicker } from '@/components/ui/Kicker'
import { Reveal } from '@/components/ui/Reveal'
import { useInView } from '@/lib/useInView'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'

const stepColors = ['#19b85a', '#2f7bff', '#ffc93c']

export function Journey() {
  const { t } = useI18n()
  const j = t.journey
  const { ref, inView } = useInView<HTMLOListElement>({ once: true, threshold: 0.25 })

  return (
    <section aria-labelledby="journey-title" className="mx-auto max-w-[1320px] px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <Kicker>{j.kicker}</Kicker>
          <h2 id="journey-title" className="mt-3 max-w-[16ch] font-display text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.05] tracking-tight">
            {j.title}
          </h2>
          <p className="mt-4 max-w-[40ch] text-lg text-ink-2">{j.subtitle}</p>

          {/* Achievement preview */}
          <div className="relative mt-10 max-w-[400px] overflow-hidden rounded-2xl border border-st-yellow/35 bg-gradient-to-br from-st-yellow/[0.12] via-panel/70 to-panel/70 p-5">
            <div className="flex items-center gap-4">
              <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-st-yellow/15 text-st-yellow ring-1 ring-st-yellow/40">
                <span className="ring-pulse absolute inset-0 rounded-2xl shadow-[0_0_28px_rgb(255_201_60/0.45)]" aria-hidden="true" />
                <Award size={28} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-st-yellow">{j.badgeLabel}</p>
                <p className="font-display text-lg font-semibold">{j.badgeTitle}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-2">{j.badgeText}</p>
          </div>
        </Reveal>

        <ol ref={ref} className={cx('relative grid gap-6', inView && 'in')}>
          {/* Self-drawing spine */}
          <svg className="absolute left-[27px] top-6 h-[calc(100%-48px)] w-[2px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 2 100" aria-hidden="true">
            <line x1="1" y1="0" x2="1" y2="100" stroke="rgb(130 160 255 / 0.15)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <line className="draw" pathLength={1} x1="1" y1="0" x2="1" y2="100" stroke="url(#spine)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <defs>
              <linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#19b85a" />
                <stop offset="50%" stopColor="#2f7bff" />
                <stop offset="100%" stopColor="#ffc93c" />
              </linearGradient>
            </defs>
          </svg>

          {j.steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={150 + i * 140} className="relative flex gap-6">
              <span
                className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-bold text-canvas shadow-[0_10px_30px_-10px_currentColor]"
                style={{ background: stepColors[i], color: stepColors[i] }}
              >
                <span className="text-canvas">{i === 2 ? <Timer size={24} aria-hidden="true" /> : i + 1}</span>
              </span>
              <div className="glass flex-1 rounded-2xl p-6">
                <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-2">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

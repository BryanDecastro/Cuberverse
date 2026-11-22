import { useCallback, useRef, useState } from 'react'
import { ArrowRight, GraduationCap, Hand, LogIn, RotateCcw, Shuffle, Timer } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { LazyCube } from '@/features/cube/LazyCube'
import type { CubeApi, SequenceKind } from '@/features/cube/CubeScene'
import type { Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuth } from '@/features/auth/AuthProvider'
import { routes } from '@/config/routes'
import { cx } from '@/lib/format'

function MoveTicker({ seq, index, kind }: { seq: Move[]; index: number; kind: SequenceKind | null }) {
  return (
    <div className="flex min-h-8 flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[0.95rem]" aria-hidden="true">
      {seq.map((m, i) => (
        <span
          key={i}
          className={cx(
            'rounded-md px-1.5 py-0.5 transition-[color,background-color] duration-200',
            i === index
              ? kind === 'solve'
                ? 'bg-st-green/20 text-[#5ee39a]'
                : 'bg-accent/25 text-white'
              : index >= 0 && i < index
                ? 'text-ink-3'
                : index === -1
                  ? 'text-ink-3'
                  : 'text-ink-2',
          )}
        >
          {m}
        </span>
      ))}
    </div>
  )
}

export function Hero() {
  const { t } = useI18n()
  const { user } = useAuth()
  const api = useRef<CubeApi>(null)
  const [seq, setSeq] = useState<Move[]>([])
  const [kind, setKind] = useState<SequenceKind | null>(null)
  const [index, setIndex] = useState(-1)

  const onSequence = useCallback((s: Move[], k: SequenceKind) => {
    setSeq(s)
    setKind(k)
    setIndex(0)
  }, [])

  const takeOver = (fn: (a: CubeApi) => void) => {
    if (!api.current) return
    api.current.stopAutoplay()
    fn(api.current)
  }

  return (
    <section className="relative mx-auto grid min-h-[100svh] max-w-[1320px] items-center gap-6 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:px-8 lg:pb-10 lg:pt-24">
      <div className="relative z-10">
        <Kicker className="reveal in">{t.hero.kicker}</Kicker>
        <h1 className="mt-5 font-display text-[clamp(2.9rem,7.4vw,6.2rem)] font-bold leading-[0.98] tracking-[-0.035em]">
          {t.hero.title.map((word, i) => (
            <span
              key={word}
              className={cx('hero-word block', i === t.hero.title.length - 1 && 'text-gradient')}
              style={{ animationDelay: `${120 + i * 130}ms` }}
            >
              {word}
            </span>
          ))}
        </h1>
        <p className="hero-fade mt-6 max-w-[34ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-ink-2" style={{ animationDelay: '560ms' }}>
          {t.hero.subtitle}
        </p>

        <div className="hero-fade mt-9 flex flex-wrap gap-3" style={{ animationDelay: '700ms' }}>
          <ButtonLink to={routes.learn} size="lg" icon={<GraduationCap size={20} aria-hidden="true" />} trailing={<ArrowRight size={18} aria-hidden="true" />}>
            {t.hero.ctaLearn}
          </ButtonLink>
          <ButtonLink to={routes.timer} size="lg" variant="secondary" icon={<Timer size={20} aria-hidden="true" />}>
            {t.hero.ctaTimer}
          </ButtonLink>
          {!user && (
            <ButtonLink to={routes.signIn} size="lg" variant="ghost" icon={<LogIn size={19} aria-hidden="true" />}>
              {t.hero.ctaSignIn}
            </ButtonLink>
          )}
        </div>

        <dl className="hero-fade mt-12 grid max-w-[520px] grid-cols-3 gap-4 border-t border-line pt-6" style={{ animationDelay: '860ms' }}>
          {t.hero.stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl font-semibold tracking-tight text-ink">{s.value}</dd>
              <dd className="mt-1 text-[0.8rem] leading-snug text-ink-3">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hero-fade relative" style={{ animationDelay: '250ms' }}>
        {/* Soft light pool behind the cube */}
        <div
          className="pointer-events-none absolute left-1/2 top-[45%] h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.35),rgb(139_92_246/0.12)_45%,transparent_70%)] blur-2xl"
          aria-hidden="true"
        />
        <LazyCube
          apiRef={api}
          autoplay
          label={t.hero.cubeLabel}
          onSequence={onSequence}
          onStep={setIndex}
          className="h-[min(78vw,420px)] w-full sm:h-[480px] lg:h-[min(62vh,600px)]"
        />
        <div className="relative mx-auto mt-2 flex max-w-[460px] flex-col items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-3">
            <span className={cx('h-1.5 w-1.5 rounded-full', kind === 'solve' ? 'bg-st-green' : 'bg-accent', 'ring-pulse')} aria-hidden="true" />
            {t.hero.nowPlaying}
            <span className="text-line-strong">/</span>
            <span className="flex items-center gap-1 normal-case tracking-normal">
              <Hand size={13} aria-hidden="true" /> {t.hero.dragHint}
            </span>
          </div>
          <MoveTicker seq={seq} index={index} kind={kind} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => takeOver((a) => a.scramble(12))}
              className="btn inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-panel/60 px-3.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              <Shuffle size={15} aria-hidden="true" /> {t.hero.scramble}
            </button>
            <button
              type="button"
              onClick={() => takeOver((a) => a.solve())}
              className="btn inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-panel/60 px-3.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              <RotateCcw size={15} aria-hidden="true" /> {t.hero.solve}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

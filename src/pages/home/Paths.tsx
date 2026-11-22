import { Link } from 'react-router-dom'
import { ArrowRight, Box, Orbit, TrendingUp, type LucideIcon } from 'lucide-react'
import { Kicker } from '@/components/ui/Kicker'
import { Reveal } from '@/components/ui/Reveal'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'

type Tone = { ring: string; glow: string; icon: string; chip: string }

const tones: Record<'green' | 'blue' | 'violet', Tone> = {
  green: {
    ring: 'hover:border-[#2fd37a]/60',
    glow: 'from-[#19b85a]/18',
    icon: 'text-[#3ee089] bg-[#19b85a]/12 ring-[#19b85a]/30',
    chip: 'group-hover:bg-[#19b85a] group-hover:text-white',
  },
  blue: {
    ring: 'hover:border-[#4b8dff]/70',
    glow: 'from-[#2f7bff]/20',
    icon: 'text-[#6aa5ff] bg-[#2f7bff]/12 ring-[#2f7bff]/30',
    chip: 'group-hover:bg-[#2f7bff] group-hover:text-white',
  },
  violet: {
    ring: 'hover:border-[#a07bff]/60',
    glow: 'from-[#8b5cf6]/20',
    icon: 'text-[#b69bff] bg-[#8b5cf6]/12 ring-[#8b5cf6]/30',
    chip: 'group-hover:bg-[#8b5cf6] group-hover:text-white',
  },
}

export function Paths() {
  const { t } = useI18n()
  const p = t.paths
  const cards: Array<{ to: string; icon: LucideIcon; tone: Tone; title: string; text: string; cta: string; step: string }> = [
    { to: routes.learn, icon: Box, tone: tones.green, step: '01', ...p.beginner },
    { to: routes.timer, icon: TrendingUp, tone: tones.blue, step: '02', ...p.solver },
    { to: routes.history, icon: Orbit, tone: tones.violet, step: '03', ...p.explore },
  ]

  return (
    <section aria-labelledby="paths-title" className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Kicker>{p.kicker}</Kicker>
          <h2 id="paths-title" className="mt-3 max-w-[18ch] font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">
            {p.title}
          </h2>
        </div>
        <p className="max-w-[36ch] text-ink-2">{p.subtitle}</p>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.to} delay={i * 110}>
            <Link
              to={c.to}
              className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-panel/55 p-7 backdrop-blur transition-[border-color,transform,box-shadow] duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] ${c.tone.ring}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.tone.glow} via-transparent to-transparent opacity-80`} aria-hidden="true" />
              <div className="relative flex items-start justify-between">
                <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${c.tone.icon}`}>
                  <c.icon size={28} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-ink-3">{c.step}</span>
              </div>
              <h3 className="relative mt-8 font-display text-[1.45rem] font-semibold leading-tight tracking-tight">{c.title}</h3>
              <p className="relative mt-3 flex-1 leading-relaxed text-ink-2">{c.text}</p>
              <span className="relative mt-8 flex items-center justify-between border-t border-line pt-5 text-sm font-semibold text-ink">
                {c.cta}
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 ${c.tone.chip}`}>
                  <ArrowRight size={18} aria-hidden="true" />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

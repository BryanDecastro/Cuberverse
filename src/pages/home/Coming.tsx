import { Crown, MessagesSquare } from 'lucide-react'
import { Kicker } from '@/components/ui/Kicker'
import { Reveal } from '@/components/ui/Reveal'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'

export function Coming() {
  const { t } = useI18n()
  const c = t.coming
  return (
    <section aria-labelledby="coming-title" className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="text-center">
        <Kicker>{c.kicker}</Kicker>
        <h2 id="coming-title" className="mt-3 font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold tracking-tight">
          {c.title}
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Reveal>
          <Link
            to={routes.community}
            className="group flex h-full items-start gap-5 rounded-3xl border border-line bg-panel/50 p-7 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-cyan/50"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan ring-1 ring-cyan/30">
              <MessagesSquare size={24} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-xl font-semibold">{c.community.title}</h3>
                <span className="rounded-full border border-cyan/40 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-cyan">{c.community.tag}</span>
              </div>
              <p className="mt-2 leading-relaxed text-ink-2">{c.community.text}</p>
            </div>
          </Link>
        </Reveal>
        <Reveal delay={110}>
          <div className="flex h-full items-start gap-5 rounded-3xl border border-line bg-panel/50 p-7">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet/12 text-[#b69bff] ring-1 ring-violet/35">
              <Crown size={24} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-xl font-semibold">{c.pro.title}</h3>
                <span className="rounded-full border border-violet/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-[#b69bff]">{c.pro.tag}</span>
              </div>
              <p className="mt-2 leading-relaxed text-ink-2">{c.pro.text}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

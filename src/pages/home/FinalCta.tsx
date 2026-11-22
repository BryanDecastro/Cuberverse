import { ArrowRight, GraduationCap, Timer } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'

export function FinalCta() {
  const { t } = useI18n()
  const c = t.finalCta
  return (
    <section aria-labelledby="cta-title" className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-accent/30 bg-gradient-to-br from-[#0f1d4a] via-panel to-[#1a1240] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(47_123_255/0.45),transparent_65%)]" aria-hidden="true" />
          <StickerStrip className="relative mx-auto" width="w-28" />
          <h2 id="cta-title" className="relative mx-auto mt-8 max-w-[18ch] font-display text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
            {c.title}
          </h2>
          <p className="relative mt-4 text-lg text-ink-2">{c.text}</p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to={routes.learn} size="lg" icon={<GraduationCap size={20} aria-hidden="true" />} trailing={<ArrowRight size={18} aria-hidden="true" />}>
              {c.primary}
            </ButtonLink>
            <ButtonLink to={routes.timer} size="lg" variant="secondary" icon={<Timer size={20} aria-hidden="true" />}>
              {c.secondary}
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

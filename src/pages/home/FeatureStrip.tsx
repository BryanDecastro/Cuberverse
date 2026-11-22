import { BarChart3, BookOpen, GraduationCap, Timer } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { useI18n } from '@/i18n/I18nProvider'

const icons = [GraduationCap, Timer, BarChart3, BookOpen]

export function FeatureStrip() {
  const { t } = useI18n()
  return (
    <section aria-label="Features" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
      <Reveal className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" aria-hidden="true" />
        <ul className="grid grid-cols-1 gap-y-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.map((f, i) => {
            const Icon = icons[i]
            return (
              <li key={f.title} className="flex items-start gap-4 px-2 lg:border-l lg:border-line lg:px-8 lg:first:border-l-0 lg:first:pl-2">
                <Icon size={30} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#8fb8ff]" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-[1.02rem] font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-3">{f.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="absolute inset-x-0 bottom-0 h-px bg-line" aria-hidden="true" />
      </Reveal>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { LanguageSwitch } from './LanguageSwitch'

export function Footer() {
  const { t } = useI18n()
  const f = t.footer
  const cols = [
    { title: f.columns.learn, links: [{ to: routes.learn, label: f.links.tutorial }, { to: routes.signIn, label: f.links.signIn }] },
    { title: f.columns.practice, links: [{ to: routes.timer, label: f.links.timer }, { to: routes.profile, label: f.links.profile }] },
    {
      title: f.columns.explore,
      links: [
        { to: routes.history, label: f.links.history },
        { to: routes.wca, label: f.links.wca },
      ],
    },
  ]

  return (
    <footer className="relative mt-24 border-t border-line bg-canvas-2/60">
      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 font-display text-lg font-semibold text-ink">{f.tagline}</p>
            <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-ink-2">{f.description}</p>
            <StickerStrip className="mt-6" />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-3">{c.title}</h2>
                <ul className="mt-4 grid gap-1">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="inline-flex min-h-9 items-center text-sm text-ink-2 transition-colors hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-start gap-3 rounded-xl border border-st-yellow/25 bg-st-yellow/[0.06] px-4 py-3">
          <FlaskConical size={18} className="mt-0.5 shrink-0 text-st-yellow" aria-hidden="true" />
          <p className="text-sm text-ink-2">{f.prototype}</p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[90ch] text-xs leading-relaxed text-ink-3">
            {f.rights}. {f.trademark}
          </p>
          <LanguageSwitch className="self-start sm:self-auto" />
        </div>
      </div>
    </footer>
  )
}

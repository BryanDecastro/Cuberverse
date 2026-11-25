import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { CubeIllustration } from '@/features/cube/CubeIllustration'
import { navItems } from '@/components/layout/navItems'
import { Avatar, DemoBadge } from '@/components/layout/UserMenu'
import { useAuth } from '@/features/auth/AuthProvider'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { fmt } from '@/lib/format'

/** Placeholder for sections arriving in later stages. Keeps navigation real. */
export default function ComingSoon({ page, path }: { page: string; path: string }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const others = navItems.filter((n) => n.to !== path && n.to !== routes.home)
  const isProfile = path === routes.profile

  return (
    <section className="mx-auto grid min-h-[80svh] max-w-[1100px] items-center gap-10 px-4 pb-10 pt-32 sm:px-6 md:grid-cols-[1.2fr_1fr] lg:px-8">
      <div>
        <Kicker>{t.comingSoon.kicker}</Kicker>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] tracking-tight">
          {fmt(t.comingSoon.title, { page })}
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-2">{t.comingSoon.text}</p>

        {isProfile && user && (
          <div className="glass mt-8 flex max-w-[460px] items-center gap-4 rounded-2xl p-4">
            <Avatar name={user.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-display font-semibold">{user.name}</p>
                {user.isDemo && <DemoBadge label={t.nav.demo} />}
              </div>
              <p className="mt-1 text-sm text-ink-3">{user.isDemo ? t.comingSoon.demoProfile : fmt(t.comingSoon.realProfile, { email: user.email })}</p>
            </div>
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <ButtonLink to={routes.home} variant="secondary" icon={<ArrowLeft size={18} aria-hidden="true" />}>
            {t.comingSoon.back}
          </ButtonLink>
        </div>
        <p className="mt-10 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-3">{t.comingSoon.other}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-panel/50 px-3 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                <Icon size={15} aria-hidden="true" /> {label(t)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative hidden md:block" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.3),transparent_65%)] blur-2xl" />
        <CubeIllustration className="relative mx-auto w-[80%]" />
        <StickerStrip className="mx-auto mt-6" />
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogIn, Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuth } from '@/features/auth/AuthProvider'
import { routes } from '@/config/routes'
import { cx } from '@/lib/format'
import { navItems } from './navItems'
import { LanguageSwitch } from './LanguageSwitch'
import { Avatar, DemoBadge, UserMenu } from './UserMenu'

export function Header() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname])

  // Drawer: lock page scroll, close on Escape.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500',
        scrolled || open ? 'border-b border-line bg-canvas/80 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === routes.home}
                className={({ isActive }) =>
                  cx(
                    'relative flex h-10 items-center gap-2 rounded-xl px-3 text-[0.9rem] font-medium transition-colors duration-300',
                    isActive
                      ? 'bg-accent/15 text-ink shadow-[inset_0_0_0_1px_rgb(75_141_255/0.45)]'
                      : 'text-ink-2 hover:bg-white/5 hover:text-ink',
                  )
                }
              >
                <Icon size={17} className="hidden xl:block" aria-hidden="true" />
                {label(t)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <LanguageSwitch className="hidden sm:inline-flex" />
          <div className="hidden lg:block">
            {user ? (
              <UserMenu />
            ) : (
              <ButtonLink to={routes.signIn} variant="secondary" icon={<LogIn size={17} aria-hidden="true" />}>
                {t.nav.signIn}
              </ButtonLink>
            )}
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-panel/60 text-ink lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        inert={!open}
        className={cx(
          'overflow-y-auto border-t border-line bg-canvas/95 backdrop-blur-xl transition-[max-height,opacity] duration-500 ease-[var(--ease-out-soft)] lg:hidden',
          open ? 'max-h-[calc(100dvh-72px)] opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0',
        )}
      >
        <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-4 sm:px-6">
          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-panel/60 p-3">
              <Avatar name={user.name} size={40} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-ink-3">{user.email}</p>
              </div>
              <span className="ml-auto">
                <DemoBadge label={t.nav.demo} />
              </span>
            </div>
          )}
          <ul className="grid gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === routes.home}
                  className={({ isActive }) =>
                    cx(
                      'flex h-13 items-center gap-3 rounded-xl px-4 font-display text-lg font-medium',
                      isActive ? 'bg-accent/15 text-ink' : 'text-ink-2 hover:bg-white/5',
                    )
                  }
                >
                  <Icon size={20} aria-hidden="true" />
                  {label(t)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LanguageSwitch />
            {user ? (
              <>
                <ButtonLink to={routes.profile} variant="secondary" className="flex-1">
                  {t.nav.profile}
                </ButtonLink>
                <button type="button" onClick={() => signOut()} className="btn h-11 rounded-xl px-4 text-sm text-ink-2 hover:text-ink">
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <ButtonLink to={routes.signIn} className="flex-1" icon={<LogIn size={17} aria-hidden="true" />}>
                {t.nav.signIn}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

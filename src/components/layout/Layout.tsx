import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nProvider'
import { Header } from './Header'
import { Footer } from './Footer'
import { EnvironmentBackground } from './EnvironmentBackground'

export function Layout({ bare = false }: { bare?: boolean }) {
  const { t } = useI18n()
  const { pathname } = useLocation()

  // New page: start at the top and move focus to main for screen readers.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])

  // Pause every CSS loop on hidden tabs.
  useEffect(() => {
    const on = () => document.body.classList.toggle('paused', document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  return (
    <>
      <a href="#main" className="skip-link">
        {t.nav.skip}
      </a>
      <EnvironmentBackground />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      {!bare && <Footer />}
    </>
  )
}

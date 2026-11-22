import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import Home from '@/pages/Home'

const AuthPage = lazy(() => import('@/pages/Auth'))
const ComingSoon = lazy(() => import('@/pages/ComingSoon'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const LearnPage = lazy(() => import('@/pages/Learn'))

/** Per-route document titles. */
function TitleSync() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  useEffect(() => {
    const map: Record<string, string> = {
      [routes.home]: `CubeVerse | ${t.footer.tagline}`,
      [routes.learn]: `${t.nav.learn} | CubeVerse`,
      [routes.timer]: `${t.nav.timer} | CubeVerse`,
      [routes.history]: `${t.nav.history} | CubeVerse`,
      [routes.wca]: `${t.nav.wca} | CubeVerse`,
      [routes.community]: `${t.nav.community} | CubeVerse`,
      [routes.profile]: `${t.nav.profile} | CubeVerse`,
      [routes.signIn]: `${t.auth.tabSignIn} | CubeVerse`,
      [routes.signUp]: `${t.auth.tabSignUp} | CubeVerse`,
      [routes.forgot]: `${t.auth.forgotTitle} | CubeVerse`,
    }
    document.title = map[pathname] ?? (pathname.startsWith(routes.learn + '/') ? map[routes.learn] : 'CubeVerse')
  }, [pathname, t])
  return null
}

function AppRoutes() {
  const { t } = useI18n()
  // These pages are still placeholders. Each gets its real component in a later stage.
  const placeholders = [
    { path: routes.timer, page: t.nav.timer },
    { path: routes.history, page: t.nav.history },
    { path: routes.wca, page: t.nav.wca },
    { path: routes.community, page: t.nav.community },
    { path: routes.profile, page: t.nav.profile },
  ]

  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path={routes.learn} element={<Navigate to={routes.learn + '/notation'} replace />} />
          <Route path={routes.learn + '/:lessonId'} element={<LearnPage />} />
          {placeholders.map((p) => (
            <Route key={p.path} path={p.path} element={<ComingSoon page={p.page} path={p.path} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<Layout bare />}>
          <Route path={routes.signIn} element={<AuthPage key="signin" mode="signin" />} />
          <Route path={routes.signUp} element={<AuthPage key="signup" mode="signup" />} />
          <Route path={routes.forgot} element={<AuthPage key="forgot" mode="forgot" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <TitleSync />
      <AppRoutes />
    </BrowserRouter>
  )
}

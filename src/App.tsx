import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import Home from '@/pages/Home'

const AuthPage = lazy(() => import('@/pages/Auth'))
const ProfilePage = lazy(() => import('@/pages/Profile'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const LearnPage = lazy(() => import('@/pages/Learn'))
const TimerPage = lazy(() => import('@/pages/Timer'))
const HistoryPage = lazy(() => import('@/pages/History'))
const WcaPage = lazy(() => import('@/pages/Wca'))

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
      [routes.profile]: `${t.nav.profile} | CubeVerse`,
      [routes.signIn]: `${t.auth.tabSignIn} | CubeVerse`,
      [routes.signUp]: `${t.auth.tabSignUp} | CubeVerse`,
      [routes.forgot]: `${t.auth.forgotTitle} | CubeVerse`,
      [routes.resetPassword]: `${t.auth.resetTitle} | CubeVerse`,
      [routes.authCallback]: `${t.auth.callbackTitle} | CubeVerse`,
    }
    document.title = map[pathname] ?? (pathname.startsWith(routes.learn + '/') ? map[routes.learn] : 'CubeVerse')
  }, [pathname, t])
  return null
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path={routes.learn} element={<Navigate to={routes.learn + '/notation'} replace />} />
          <Route path={routes.learn + '/:lessonId'} element={<LearnPage />} />
          <Route path={routes.timer} element={<TimerPage />} />
          <Route path={routes.history} element={<HistoryPage />} />
          <Route path={routes.wca} element={<WcaPage />} />
          <Route path={routes.profile} element={<ProfilePage />} />
          {/* The Community section was removed; old links go home. */}
          <Route path="/community" element={<Navigate to={routes.home} replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<Layout bare />}>
          <Route path={routes.signIn} element={<AuthPage key="signin" mode="signin" />} />
          <Route path={routes.signUp} element={<AuthPage key="signup" mode="signup" />} />
          <Route path={routes.forgot} element={<AuthPage key="forgot" mode="forgot" />} />
          <Route path={routes.resetPassword} element={<AuthPage key="reset" mode="reset" />} />
          <Route path={routes.authCallback} element={<AuthPage key="callback" mode="callback" />} />
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

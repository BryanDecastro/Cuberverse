import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabaseConfigured } from '@/lib/supabase'
import type { AuthService, SignUpResult, User } from './types'
import { demoAuthService } from './demoAuthService'
import { supabaseAuthService } from './supabaseAuthService'

// Real Supabase accounts when the environment is configured; the local demo otherwise.
const service: AuthService = supabaseConfigured ? supabaseAuthService : demoAuthService

type AuthValue = {
  user: User | null
  ready: boolean
  /** True after a password-reset link was opened in this tab (the user may now set a new password). */
  recovering: boolean
  isDemo: boolean
  supportsGoogle: boolean
  signInWithGoogle: () => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>
  resendConfirmation: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    let alive = true
    service.getSession().then((u) => {
      if (!alive) return
      setUser(u)
      setReady(true)
    })
    // Keeps every tab in step: sign-in/out elsewhere, token refresh, email links.
    const off = service.onChange((change) => {
      if (!alive) return
      setUser(change.user)
      setReady(true)
      if (change.event === 'password_recovery') setRecovering(true)
      if (change.event === 'signed_out') setRecovering(false)
    })
    return () => {
      alive = false
      off()
    }
  }, [])

  const wrap = useCallback(
    <A extends unknown[]>(fn: (...args: A) => Promise<User>) =>
      async (...args: A) => {
        const u = await fn(...args)
        setUser(u)
        return u
      },
    [],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      recovering,
      isDemo: service.isDemo,
      supportsGoogle: service.supportsGoogle,
      signInWithGoogle: wrap(service.signInWithGoogle),
      signInWithEmail: wrap(service.signInWithEmail),
      signUp: async (name, email, password) => {
        const res = await service.signUp(name, email, password)
        if (res.user) setUser(res.user)
        return res
      },
      resendConfirmation: service.resendConfirmation,
      requestPasswordReset: service.requestPasswordReset,
      updatePassword: async (password) => {
        const u = await service.updatePassword(password)
        setUser(u)
        setRecovering(false)
        return u
      },
      signOut: async () => {
        await service.signOut()
        setUser(null)
      },
    }),
    [user, ready, recovering, wrap],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

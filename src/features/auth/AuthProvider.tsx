import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabaseConfigured } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import type { SignUpResult, User } from './types'
import { supabaseAuthService as service } from './supabaseAuthService'

type AuthValue = {
  /** The signed-in user, only after Supabase has confirmed the session. */
  user: User | null
  /** True once the session check has finished (signed in or not). */
  ready: boolean
  /** False when the site was built without the Supabase variables: sign-in is then unavailable. */
  configured: boolean
  /** True after a password-reset link was opened in this tab (the user may now set a new password). */
  recovering: boolean
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
    // Remove the profile left by the old demo sign-in, if this browser still has one.
    storage.remove('demo-session')
    if (!supabaseConfigured) {
      console.error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (locally in .env.local, and in Vercel > Settings > Environment Variables).')
      setReady(true)
      return
    }
    let alive = true
    // Only a session the Supabase server confirms counts as signed in.
    service.verifyUser().then((u) => {
      if (!alive) return
      if (!u) void service.signOut().catch(() => {})
      setUser(u)
      setReady(true)
    })
    // Keeps every tab in step: sign-in/out elsewhere, token refresh, email links.
    const off = service.onChange((change) => {
      if (!alive) return
      setUser(change.user)
      if (change.event === 'password_recovery') setRecovering(true)
      if (change.event === 'signed_out') setRecovering(false)
    })
    return () => {
      alive = false
      off()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const u = await service.signInWithEmail(email, password)
    setUser(u)
    return u
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      configured: supabaseConfigured,
      recovering,
      signInWithEmail,
      signUp: async (name, email, password) => {
        const res = await service.signUp(name, email, password)
        if (res.user) setUser(res.user)
        return res
      },
      resendConfirmation: (email) => service.resendConfirmation(email),
      requestPasswordReset: (email) => service.requestPasswordReset(email),
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
    [user, ready, recovering, signInWithEmail],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthService, User } from './types'
import { demoAuthService } from './demoAuthService'

// Swap point for Supabase: replace demoAuthService with supabaseAuthService.
const service: AuthService = demoAuthService

type AuthValue = {
  user: User | null
  ready: boolean
  signInWithGoogle: () => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<User>
  requestPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    service.getSession().then((u) => {
      setUser(u)
      setReady(true)
    })
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
      signInWithGoogle: wrap(service.signInWithGoogle),
      signInWithEmail: wrap(service.signInWithEmail),
      signUp: wrap(service.signUp),
      requestPasswordReset: service.requestPasswordReset,
      signOut: async () => {
        await service.signOut()
        setUser(null)
      },
    }),
    [user, ready, wrap],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

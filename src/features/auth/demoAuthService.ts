import { storage } from '@/lib/storage'
import type { AuthService, User } from './types'

/**
 * DEMO ONLY, used when Supabase is not configured (no VITE_SUPABASE_URL).
 * No network, no real accounts, passwords are never stored.
 * The "session" is a demo profile kept in this browser's localStorage.
 */
const KEY = 'demo-session'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function makeUser(name: string, email: string, provider: User['provider']): User {
  return {
    id: `demo-${Math.random().toString(36).slice(2, 10)}`,
    name: name.trim() || 'Demo Cuber',
    email,
    avatarSeed: email || name,
    provider,
    isDemo: true,
    createdAt: new Date().toISOString(),
  }
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'cuber'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ')
}

export const demoAuthService: AuthService = {
  supportsGoogle: true,
  isDemo: true,
  async getSession() {
    return storage.get<User | null>(KEY, null)
  },
  onChange() {
    return () => {}
  },
  async signInWithGoogle() {
    await wait(700)
    const user = makeUser('Demo Cuber', 'demo.cuber@example.com', 'google')
    storage.set(KEY, user)
    return user
  },
  async signInWithEmail(email) {
    await wait(600)
    const user = makeUser(nameFromEmail(email), email, 'email')
    storage.set(KEY, user)
    return user
  },
  async signUp(name, email) {
    await wait(700)
    const user = makeUser(name, email, 'email')
    storage.set(KEY, user)
    return { user, needsConfirmation: false }
  },
  async resendConfirmation() {
    await wait(400)
  },
  async requestPasswordReset() {
    await wait(600)
  },
  async updatePassword() {
    await wait(400)
    const user = storage.get<User | null>(KEY, null)
    if (!user) throw new Error('No demo session')
    return user
  },
  async signOut() {
    storage.remove(KEY)
  },
}

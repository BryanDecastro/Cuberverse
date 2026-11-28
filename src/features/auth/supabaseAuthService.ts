import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { routes } from '@/config/routes'
import { AuthFailure, type AuthErrorCode, type AuthService, type User } from './types'

/**
 * Real accounts with Supabase Auth (email and password).
 * Passwords go straight to Supabase over HTTPS and are stored there hashed;
 * this app never keeps them. Sessions are persisted and refreshed by supabase-js.
 */

function client() {
  if (!supabase) throw new AuthFailure('not_configured', 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing)')
  return supabase
}

function toUser(u: SupabaseUser): User {
  const meta = (u.user_metadata ?? {}) as { name?: string; full_name?: string }
  const email = u.email ?? ''
  return {
    id: u.id,
    name: (meta.name || meta.full_name || email.split('@')[0] || 'Cuber').trim(),
    email,
    avatarSeed: email || u.id,
    provider: 'email',
    createdAt: u.created_at,
  }
}

/** Map Supabase errors to the few cases the screens explain. */
function fail(error: AuthError | Error): never {
  const e = error as AuthError & { code?: string; status?: number }
  const code = e.code ?? ''
  const msg = e.message ?? ''
  let out: AuthErrorCode = 'unknown'
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) out = 'invalid_credentials'
  else if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) out = 'email_not_confirmed'
  else if (code.startsWith('over_') || e.status === 429) out = 'rate_limited'
  else if (code === 'email_address_not_authorized' || code === 'email_address_invalid' || /sending.*email|not authorized/i.test(msg)) out = 'email_not_sendable'
  else if (code === 'weak_password') out = 'weak_password'
  else if (code === 'same_password') out = 'same_password'
  else if (code === 'session_not_found' || code === 'session_expired' || /auth session missing/i.test(msg)) out = 'no_session'
  else if (e.name === 'AuthRetryableFetchError' || e.status === 0 || /fetch/i.test(msg)) out = 'network'
  throw new AuthFailure(out, msg)
}

const redirect = (path: string) => `${window.location.origin}${path}`

export const supabaseAuthService: AuthService = {
  async getSession() {
    if (!supabase) return null
    const { data, error } = await supabase.auth.getSession()
    if (error) return null
    return data.session?.user ? toUser(data.session.user) : null
  },

  async verifyUser() {
    if (!supabase) return null
    // getUser() asks the Supabase server, so a forged or revoked session is rejected here.
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // Offline: keep the stored session instead of signing the person out.
      if (error.name === 'AuthRetryableFetchError' || error.status === 0) return this.getSession()
      return null
    }
    return data.user ? toUser(data.user) : null
  },

  onChange(cb) {
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // The stored session on page load is not trusted until verifyUser() checks it with the server.
      if (event === 'INITIAL_SESSION') return
      const user = session?.user ? toUser(session.user) : null
      // Run outside the auth lock, as supabase-js recommends for listeners.
      setTimeout(() => {
        if (event === 'PASSWORD_RECOVERY') cb({ user, event: 'password_recovery' })
        else if (event === 'SIGNED_OUT') cb({ user: null, event: 'signed_out' })
        else if (event === 'USER_UPDATED') cb({ user, event: 'updated' })
        else cb({ user, event: 'signed_in' })
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  },

  async signInWithEmail(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email, password })
    if (error) fail(error)
    return toUser(data.user!)
  },

  async signUp(name, email, password) {
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: {
        // Shown as the name in the app and in Authentication > Users.
        data: { name: name.trim(), full_name: name.trim() },
        emailRedirectTo: redirect(routes.authCallback),
      },
    })
    if (error) fail(error)
    // With "Confirm email" on, Supabase returns no session until the link is opened.
    if (data.session?.user) return { user: toUser(data.session.user), needsConfirmation: false }
    return { user: null, needsConfirmation: true }
  },

  async resendConfirmation(email) {
    const { error } = await client().auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirect(routes.authCallback) } })
    if (error) fail(error)
  },

  async requestPasswordReset(email) {
    const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: redirect(routes.resetPassword) })
    if (error) fail(error)
  },

  async updatePassword(password) {
    const { data, error } = await client().auth.updateUser({ password })
    if (error) fail(error)
    return toUser(data.user)
  },

  async signOut() {
    const { error } = await client().auth.signOut()
    // A session that already expired on the server still counts as signed out locally.
    if (error && !/session/i.test(error.message)) fail(error)
  },
}

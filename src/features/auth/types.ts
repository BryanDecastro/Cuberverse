/**
 * Auth contract, implemented by SupabaseAuthService (real accounts only).
 * There is no demo or local fallback: without Supabase configured, sign-in is unavailable.
 */
export type User = {
  id: string
  name: string
  email: string
  avatarSeed: string
  provider: 'email'
  createdAt: string
}

/** Why an auth call failed, in terms the screens can explain. */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'rate_limited'
  | 'email_not_sendable'
  | 'weak_password'
  | 'same_password'
  | 'no_session'
  | 'network'
  | 'not_configured'
  | 'unknown'

export class AuthFailure extends Error {
  constructor(
    public code: AuthErrorCode,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'AuthFailure'
  }
}

export type SignUpResult = {
  /** Set when the account is usable right away (email confirmation turned off). */
  user: User | null
  /** True when a confirmation email was sent and must be opened first. */
  needsConfirmation: boolean
}

/** What changed: a normal sign-in/out, or a password-reset link was opened. */
export type AuthChange = { user: User | null; event: 'signed_in' | 'signed_out' | 'updated' | 'password_recovery' }

export interface AuthService {
  /** The session stored in this browser (fast, not yet checked with the server). */
  getSession(): Promise<User | null>
  /** Ask Supabase whether the stored session is really valid; null when it is not. */
  verifyUser(): Promise<User | null>
  /** Subscribe to session changes (other tabs, token refresh, email links). Returns an unsubscribe function. */
  onChange(cb: (change: AuthChange) => void): () => void
  signInWithEmail(email: string, password: string): Promise<User>
  signUp(name: string, email: string, password: string): Promise<SignUpResult>
  resendConfirmation(email: string): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  /** Set a new password for the signed-in user (after opening a reset link). */
  updatePassword(password: string): Promise<User>
  signOut(): Promise<void>
}

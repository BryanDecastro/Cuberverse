/**
 * Auth contract. The site uses SupabaseAuthService when VITE_SUPABASE_URL and a
 * publishable key are set, and DemoAuthService (local only, no network) otherwise.
 */
export type User = {
  id: string
  name: string
  email: string
  avatarSeed: string
  provider: 'google' | 'email'
  isDemo: boolean
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
  /** Demo services can also fake Google; the real one handles email and password only. */
  readonly supportsGoogle: boolean
  readonly isDemo: boolean
  getSession(): Promise<User | null>
  /** Subscribe to session changes (other tabs, token refresh, email links). Returns an unsubscribe function. */
  onChange(cb: (change: AuthChange) => void): () => void
  signInWithGoogle(): Promise<User>
  signInWithEmail(email: string, password: string): Promise<User>
  signUp(name: string, email: string, password: string): Promise<SignUpResult>
  resendConfirmation(email: string): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  /** Set a new password for the signed-in user (after opening a reset link). */
  updatePassword(password: string): Promise<User>
  signOut(): Promise<void>
}

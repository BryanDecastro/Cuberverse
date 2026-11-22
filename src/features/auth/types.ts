/**
 * Auth contract. The prototype ships DemoAuthService; the production build
 * swaps in a SupabaseAuthService implementing the same interface
 * (supabase.auth.signInWithOAuth / signInWithPassword / signUp / resetPasswordForEmail).
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

export interface AuthService {
  getSession(): Promise<User | null>
  signInWithGoogle(): Promise<User>
  signInWithEmail(email: string, password: string): Promise<User>
  signUp(name: string, email: string, password: string): Promise<User>
  requestPasswordReset(email: string): Promise<void>
  signOut(): Promise<void>
}

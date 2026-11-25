/** Single source of truth for paths, so links never drift. */
export const routes = {
  home: '/',
  learn: '/learn',
  timer: '/timer',
  history: '/history',
  wca: '/wca',
  profile: '/profile',
  signIn: '/signin',
  signUp: '/signup',
  forgot: '/forgot-password',
  /** Where password-reset emails land: choose a new password. */
  resetPassword: '/reset-password',
  /** Where sign-up confirmation emails land. */
  authCallback: '/auth/callback',
} as const

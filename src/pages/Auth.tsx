import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Eye, EyeOff, FlaskConical, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { LazyCube } from '@/features/cube/LazyCube'
import { useAuth } from '@/features/auth/AuthProvider'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx, fmt } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'

export type AuthMode = 'signin' | 'signup' | 'forgot'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function Field({
  label,
  error,
  children,
  id,
  aside,
}: {
  label: string
  error?: string
  children: ReactNode
  id: string
  aside?: ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children}
      <p id={`${id}-err`} className={cx('overflow-hidden text-sm text-[#ff8a96] transition-[max-height,opacity,margin] duration-300', error ? 'mt-1.5 max-h-10 opacity-100' : 'max-h-0 opacity-0')}>
        {error}
      </p>
    </div>
  )
}

const inputCls =
  'h-12 w-full rounded-xl border bg-canvas/70 px-4 text-[0.98rem] text-ink placeholder:text-ink-3/80 outline-none transition-[border-color,box-shadow] duration-300 focus:border-accent-hover focus:shadow-[0_0_0_4px_rgb(47_123_255/0.18)]'

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { t } = useI18n()
  const a = t.auth
  const auth = useAuth()
  const navigate = useNavigate()
  const uid = useId()
  // The cube only shows beside the form on large screens; phones skip the 3D load.
  const isLarge = useMediaQuery('(min-width: 1024px)')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [busy, setBusy] = useState<'form' | 'google' | null>(null)
  const [sent, setSent] = useState(false)

  const isUp = mode === 'signup'
  const isForgot = mode === 'forgot'

  const validate = () => {
    const e: typeof errors = {}
    if (isUp && !name.trim()) e.name = a.errName
    if (!EMAIL_RE.test(email.trim())) e.email = a.errEmail
    if (!isForgot && password.length < 8) e.password = a.errPassword
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setBusy('form')
    try {
      if (isForgot) {
        await auth.requestPasswordReset(email.trim())
        setSent(true)
      } else if (isUp) {
        await auth.signUp(name, email.trim(), password)
        navigate(routes.profile)
      } else {
        await auth.signInWithEmail(email.trim(), password)
        navigate(routes.profile)
      }
    } finally {
      setBusy(null)
    }
  }

  const onGoogle = async () => {
    setBusy('google')
    try {
      await auth.signInWithGoogle()
      navigate(routes.profile)
    } finally {
      setBusy(null)
    }
  }

  const title = isForgot ? a.forgotTitle : isUp ? a.signUpTitle : a.signInTitle
  const sub = isForgot ? a.forgotSub : isUp ? a.signUpSub : a.signInSub

  return (
    <div className="mx-auto grid min-h-[100svh] max-w-[1320px] items-center gap-10 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
      {/* Left: the world */}
      <aside className="relative order-2 lg:order-1">
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.3),rgb(139_92_246/0.12)_45%,transparent_70%)] blur-2xl" aria-hidden="true" />
        {isLarge && <LazyCube autoplay label={t.hero.cubeLabel} className="mx-auto h-[420px] w-full max-w-[520px] xl:h-[460px]" quarterTurnSeconds={0.34} />}
        <div className="relative lg:-mt-4">
          <Kicker>{a.asideKicker}</Kicker>
          <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(2rem,3.6vw,2.9rem)] font-semibold leading-[1.05] tracking-tight">
            {a.asideTitle}
          </h1>
          <p className="mt-3 max-w-[44ch] text-ink-2">{a.asideText}</p>
          <ul className="mt-6 grid gap-2.5">
            {a.asidePoints.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-ink-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-st-green/15 text-[#4fe08f]">
                  <Check size={14} aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: the form */}
      <section aria-labelledby={`${uid}-title`} className="order-1 lg:order-2">
        <div className="glass relative mx-auto w-full max-w-[480px] overflow-hidden rounded-[1.75rem] p-6 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)] sm:p-9">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" aria-hidden="true" />
          <StickerStrip width="w-16" />

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-st-yellow/25 bg-st-yellow/[0.07] px-3.5 py-2.5 text-[0.82rem] leading-snug text-ink-2">
            <FlaskConical size={16} className="mt-0.5 shrink-0 text-st-yellow" aria-hidden="true" />
            {a.demoBanner}
          </div>

          {!isForgot && (
            <div role="tablist" aria-label={a.tabSignIn + ' / ' + a.tabSignUp} className="mt-6 grid grid-cols-2 rounded-xl border border-line bg-canvas/60 p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <Link
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  to={m === 'signin' ? routes.signIn : routes.signUp}
                  replace
                  className={cx(
                    'flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-300',
                    mode === m ? 'bg-accent/20 text-ink shadow-[inset_0_0_0_1px_rgb(75_141_255/0.45)]' : 'text-ink-3 hover:text-ink',
                  )}
                >
                  {m === 'signin' ? a.tabSignIn : a.tabSignUp}
                </Link>
              ))}
            </div>
          )}

          <h2 id={`${uid}-title`} className="mt-7 font-display text-[1.75rem] font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-1.5 text-ink-2">{sub}</p>

          {isForgot && sent ? (
            <div className="mt-7 rounded-2xl border border-st-green/30 bg-st-green/[0.08] p-5" role="status">
              <MailCheck size={26} className="text-[#4fe08f]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{fmt(a.forgotSent, { email: email.trim() })}</p>
              <Link to={routes.signIn} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8fb8ff] hover:text-ink">
                <ArrowLeft size={16} aria-hidden="true" /> {a.backToSignIn}
              </Link>
            </div>
          ) : (
            <>
              {!isForgot && (
                <>
                  <button
                    type="button"
                    onClick={onGoogle}
                    disabled={busy !== null}
                    className="btn mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-strong/70 bg-white/[0.04] text-[0.95rem] font-semibold text-ink transition-colors hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    <GoogleMark />
                    {busy === 'google' ? a.working : a.google}
                  </button>
                  <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-ink-3">
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                    {a.or}
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  </div>
                </>
              )}

              <form noValidate onSubmit={onSubmit} className={cx('grid gap-4', isForgot && 'mt-7')}>
                {isUp && (
                  <Field id={`${uid}-name`} label={a.name} error={errors.name}>
                    <input
                      id={`${uid}-name`}
                      className={cx(inputCls, errors.name ? 'border-[#ff6b7d]' : 'border-line-strong/60')}
                      autoComplete="name"
                      placeholder={a.namePh}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={!!errors.name}
                      aria-describedby={`${uid}-name-err`}
                    />
                  </Field>
                )}
                <Field id={`${uid}-email`} label={a.email} error={errors.email}>
                  <input
                    id={`${uid}-email`}
                    type="email"
                    inputMode="email"
                    className={cx(inputCls, errors.email ? 'border-[#ff6b7d]' : 'border-line-strong/60')}
                    autoComplete="email"
                    placeholder={a.emailPh}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={`${uid}-email-err`}
                  />
                </Field>
                {!isForgot && (
                  <Field
                    id={`${uid}-pw`}
                    label={a.password}
                    error={errors.password}
                    aside={
                      !isUp && (
                        <Link to={routes.forgot} className="text-sm text-[#8fb8ff] hover:text-ink">
                          {a.forgot}
                        </Link>
                      )
                    }
                  >
                    <div className="relative">
                      <input
                        id={`${uid}-pw`}
                        type={show ? 'text' : 'password'}
                        className={cx(inputCls, 'pr-12', errors.password ? 'border-[#ff6b7d]' : 'border-line-strong/60')}
                        autoComplete={isUp ? 'new-password' : 'current-password'}
                        placeholder={a.passwordPh}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!errors.password}
                        aria-describedby={`${uid}-pw-err`}
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? a.hidePassword : a.showPassword}
                        aria-pressed={show}
                        className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 hover:bg-white/5 hover:text-ink"
                      >
                        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                  </Field>
                )}

                <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy !== null}>
                  {busy === 'form' ? a.working : isForgot ? a.forgotSubmit : isUp ? a.submitUp : a.submitIn}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-ink-3">
                {isForgot ? (
                  <Link to={routes.signIn} className="inline-flex items-center gap-2 font-semibold text-[#8fb8ff] hover:text-ink">
                    <ArrowLeft size={16} aria-hidden="true" /> {a.backToSignIn}
                  </Link>
                ) : (
                  <>
                    {isUp ? a.toSignIn : a.toSignUp}{' '}
                    <Link to={isUp ? routes.signIn : routes.signUp} replace className="font-semibold text-[#8fb8ff] hover:text-ink">
                      {isUp ? a.toSignInLink : a.toSignUpLink}
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          <div className="mt-7 border-t border-line pt-5 text-center">
            <Link to={routes.home} className="inline-flex min-h-9 items-center text-sm font-semibold text-ink-2 hover:text-ink">
              {a.guest}
            </Link>
            {isUp && <p className="mt-3 text-xs leading-relaxed text-ink-3">{a.terms}</p>}
          </div>
        </div>
      </section>
    </div>
  )
}

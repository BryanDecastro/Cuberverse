import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { StickerStrip } from '@/components/ui/StickerStrip'
import { LazyCube } from '@/features/cube/LazyCube'
import { useAuth } from '@/features/auth/AuthProvider'
import { AuthFailure } from '@/features/auth/types'
import { initialAuthHash } from '@/lib/supabase'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx, fmt } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'callback'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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

/** An error Supabase put in the link itself (for example an expired confirmation link). */
const linkError = (() => {
  const p = new URLSearchParams(initialAuthHash.replace(/^#/, ''))
  return p.get('error_description') || p.get('error') || null
})()

/** A success or problem message inside the card, in the existing panel style. */
function Notice({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div
      className={cx('mt-7 rounded-2xl border p-5', ok ? 'border-st-green/30 bg-st-green/[0.08]' : 'border-[#ff6b7d]/35 bg-[#ff6b7d]/[0.07]')}
      role={ok ? 'status' : 'alert'}
    >
      {ok ? <MailCheck size={26} className="text-[#4fe08f]" aria-hidden="true" /> : <AlertCircle size={26} className="text-[#ff8a96]" aria-hidden="true" />}
      {children}
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
  const [busy, setBusy] = useState<'form' | null>(null)
  const [sent, setSent] = useState(false)
  const [confirmFor, setConfirmFor] = useState<string | null>(null)
  const [formError, setFormError] = useState<{ code: string; text: string } | null>(null)
  const [resend, setResend] = useState<'idle' | 'busy' | 'done'>('idle')
  const [resetDone, setResetDone] = useState(false)

  const isUp = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'
  const isCallback = mode === 'callback'
  // Reset needs the session opened by the email link; the callback reports how the link went.
  const resetLinkOk = auth.recovering || (auth.ready && !!auth.user)

  const validate = () => {
    const e: typeof errors = {}
    if (isUp && !name.trim()) e.name = a.errName
    if (!isReset && !EMAIL_RE.test(email.trim())) e.email = a.errEmail
    if (!isForgot && password.length < 8) e.password = a.errPassword
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const explain = (err: unknown) => {
    const code = err instanceof AuthFailure ? err.code : 'unknown'
    setFormError({ code, text: a.errors[code as keyof typeof a.errors] ?? a.errors.unknown })
  }

  const onResend = async (to: string) => {
    setResend('busy')
    try {
      await auth.resendConfirmation(to)
      setResend('done')
    } catch (err) {
      setResend('idle')
      explain(err)
    }
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setFormError(null)
    if (!validate()) return
    setBusy('form')
    try {
      if (isForgot) {
        await auth.requestPasswordReset(email.trim())
        setSent(true)
      } else if (isReset) {
        await auth.updatePassword(password)
        setResetDone(true)
      } else if (isUp) {
        const res = await auth.signUp(name, email.trim(), password)
        if (res.needsConfirmation) {
          setResend('idle')
          setConfirmFor(email.trim())
        } else navigate(routes.profile)
      } else {
        await auth.signInWithEmail(email.trim(), password)
        navigate(routes.profile)
      }
    } catch (err) {
      explain(err)
    } finally {
      setBusy(null)
    }
  }

  const title = confirmFor
    ? a.confirmTitle
    : isCallback
      ? a.callbackTitle
      : isReset
        ? a.resetTitle
        : isForgot
          ? a.forgotTitle
          : isUp
            ? a.signUpTitle
            : a.signInTitle
  const sub = confirmFor || isCallback ? '' : isReset ? a.resetSub : isForgot ? a.forgotSub : isUp ? a.signUpSub : a.signInSub
  const backLink = (
    <Link to={routes.signIn} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8fb8ff] hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" /> {a.backToSignIn}
    </Link>
  )
  const profileLink = (
    <Link to={routes.profile} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8fb8ff] hover:text-ink">
      {a.goProfile}
    </Link>
  )
  const resendButton = (to: string) => (
    <button
      type="button"
      onClick={() => onResend(to)}
      disabled={resend !== 'idle'}
      className="mt-3 text-sm font-semibold text-[#8fb8ff] hover:text-ink disabled:opacity-70"
    >
      {resend === 'busy' ? a.working : resend === 'done' ? a.resent : a.resend}
    </button>
  )

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

          {!auth.configured && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#ff6b7d]/35 bg-[#ff6b7d]/[0.07] px-3.5 py-2.5 text-[0.82rem] leading-snug text-ink-2" role="alert" data-auth-config="missing">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ff8a96]" aria-hidden="true" />
              {a.configMissing}
            </div>
          )}

          {(mode === 'signin' || mode === 'signup') && !confirmFor && (
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
          {sub && <p className="mt-1.5 text-ink-2">{sub}</p>}

          {confirmFor ? (
            <Notice ok>
              <p className="mt-3 text-sm leading-relaxed text-ink-2" data-auth-state="confirm-sent">
                {fmt(a.confirmSent, { email: confirmFor })}
              </p>
              {resendButton(confirmFor)}
              {formError && <p className="mt-2 text-sm text-[#ff8a96]">{formError.text}</p>}
              <div>{backLink}</div>
            </Notice>
          ) : isCallback ? (
            linkError || (auth.ready && !auth.user) ? (
              <Notice ok={false}>
                <p className="mt-3 text-sm leading-relaxed text-ink-2" data-auth-state="callback-error">
                  {a.callbackError}
                </p>
                <div>{backLink}</div>
              </Notice>
            ) : auth.user ? (
              <Notice ok>
                <p className="mt-3 text-sm leading-relaxed text-ink-2" data-auth-state="callback-done">
                  {a.callbackDone}
                </p>
                <div>{profileLink}</div>
              </Notice>
            ) : (
              <p className="mt-7 text-sm text-ink-2" role="status">
                {a.callbackWorking}
              </p>
            )
          ) : isReset && resetDone ? (
            <Notice ok>
              <p className="mt-3 text-sm leading-relaxed text-ink-2" data-auth-state="reset-done">
                {a.resetDone}
              </p>
              <div>{profileLink}</div>
            </Notice>
          ) : isReset && auth.ready && !resetLinkOk ? (
            <Notice ok={false}>
              <p className="mt-3 text-sm leading-relaxed text-ink-2" data-auth-state="reset-invalid">
                {a.resetInvalid}
              </p>
              <Link to={routes.forgot} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8fb8ff] hover:text-ink">
                {a.requestNew}
              </Link>
            </Notice>
          ) : isForgot && sent ? (
            <div className="mt-7 rounded-2xl border border-st-green/30 bg-st-green/[0.08] p-5" role="status">
              <MailCheck size={26} className="text-[#4fe08f]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-relaxed text-ink-2" data-auth-state="reset-sent">
                {fmt(a.forgotSent, { email: email.trim() })}
              </p>
              <Link to={routes.signIn} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8fb8ff] hover:text-ink">
                <ArrowLeft size={16} aria-hidden="true" /> {a.backToSignIn}
              </Link>
            </div>
          ) : (
            <>
              <form noValidate onSubmit={onSubmit} className="mt-7 grid gap-4">
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
                {!isReset && (
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
                )}
                {!isForgot && (
                  <Field
                    id={`${uid}-pw`}
                    label={isReset ? a.newPassword : a.password}
                    error={errors.password}
                    aside={
                      mode === 'signin' && (
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
                        autoComplete={isUp || isReset ? 'new-password' : 'current-password'}
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

                {formError && (
                  <div className="flex items-start gap-2 text-sm text-[#ff8a96]" role="alert" data-auth-error={formError.code}>
                    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      {formError.text}
                      {formError.code === 'email_not_confirmed' && EMAIL_RE.test(email.trim()) && <div>{resendButton(email.trim())}</div>}
                    </div>
                  </div>
                )}

                <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy !== null || !auth.configured || (isReset && !auth.ready)}>
                  {busy === 'form' ? a.working : isReset ? a.resetSubmit : isForgot ? a.forgotSubmit : isUp ? a.submitUp : a.submitIn}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-ink-3">
                {isForgot || isReset ? (
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

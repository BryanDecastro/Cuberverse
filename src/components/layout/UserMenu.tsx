import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'
import { cx } from '@/lib/format'

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f6bff] via-[#5b5cf6] to-[#22d3ee] font-display text-[0.8rem] font-semibold text-white ring-2 ring-white/10"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials || 'CV'}
    </span>
  )
}

export function DemoBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-md bg-st-yellow/15 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-st-yellow">
      {label}
    </span>
  )
}

export function UserMenu() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-panel/60 py-1 pl-1 pr-3 transition-colors hover:border-line-strong"
      >
        <Avatar name={user.name} />
        <span className="max-w-[9rem] truncate text-sm font-semibold text-ink">{user.name}</span>
        <ChevronDown size={16} className={cx('text-ink-3 transition-transform duration-300', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div
        role="menu"
        inert={!open}
        className={cx(
          'glass absolute right-0 top-[calc(100%+10px)] w-60 origin-top-right rounded-2xl p-2 shadow-2xl shadow-black/50 transition-[opacity,transform] duration-300 ease-[var(--ease-out-soft)]',
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        )}
      >
        <div className="px-3 pb-2 pt-1.5">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-3">{user.email}</p>
          <div className="mt-2">
            <DemoBadge label={t.nav.demo} />
          </div>
        </div>
        <div className="my-1 h-px bg-line" />
        <Link
          role="menuitem"
          to={routes.profile}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-2 hover:bg-white/5 hover:text-ink"
        >
          <UserRound size={16} aria-hidden="true" /> {t.nav.profile}
        </Link>
        <button
          role="menuitem"
          type="button"
          onClick={async () => {
            setOpen(false)
            await signOut()
            navigate(routes.home)
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink-2 hover:bg-white/5 hover:text-ink"
        >
          <LogOut size={16} aria-hidden="true" /> {t.nav.signOut}
        </button>
      </div>
    </div>
  )
}

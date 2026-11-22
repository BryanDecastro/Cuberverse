import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '@/lib/format'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'btn group relative inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold tracking-tight ' +
  'transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-[var(--ease-out-soft)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] shadow-[0_8px_30px_-8px_rgb(47_123_255/0.7),inset_0_1px_0_rgb(255_255_255/0.25)] ' +
    'hover:shadow-[0_12px_40px_-8px_rgb(47_123_255/0.9),inset_0_1px_0_rgb(255_255_255/0.3)] hover:-translate-y-0.5',
  secondary:
    'text-ink border border-line-strong/80 bg-panel/50 backdrop-blur hover:border-[#7d95d6] hover:bg-panel-2/80 hover:-translate-y-0.5',
  ghost: 'text-ink-2 hover:text-ink hover:bg-white/5',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-14 px-7 text-base',
}

type Common = { variant?: Variant; size?: Size; icon?: ReactNode; trailing?: ReactNode; className?: string; children: ReactNode }

export function ButtonLink({ to, variant = 'primary', size = 'md', icon, trailing, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link to={to} className={cx(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      <span>{children}</span>
      {trailing && <span className="transition-transform duration-300 group-hover:translate-x-0.5">{trailing}</span>}
    </Link>
  )
}

export function Button({ variant = 'primary', size = 'md', icon, trailing, className, children, ...rest }: Common & ComponentProps<'button'>) {
  return (
    <button className={cx(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      <span>{children}</span>
      {trailing && <span className="transition-transform duration-300 group-hover:translate-x-0.5">{trailing}</span>}
    </button>
  )
}

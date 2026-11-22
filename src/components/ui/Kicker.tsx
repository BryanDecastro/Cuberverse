import type { ReactNode } from 'react'
import { cx } from '@/lib/format'

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('font-mono text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#7fb0ff]', className)}>{children}</p>
  )
}

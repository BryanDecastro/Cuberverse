import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import { useInView } from '@/lib/useInView'
import { cx } from '@/lib/format'

/**
 * Eased entrance on first view. The stagger delay is retired once the
 * entrance has played, so later hovers never lag behind it.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: ElementType
  delay?: number
  className?: string
  children: ReactNode
}) {
  const { ref, inView } = useInView<HTMLElement>({ once: true, threshold: 0.12 })
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setSettled(true), delay + 950)
    return () => window.clearTimeout(id)
  }, [inView, delay])

  return (
    <Tag
      ref={ref}
      className={cx('reveal', inView && 'in', className)}
      style={settled ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

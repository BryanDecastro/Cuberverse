import { cx } from '@/lib/format'

const COLORS = ['#f4f6fb', '#ffc93c', '#e8283d', '#ff7a1a', '#1f6bff', '#19b85a']

/** Signature motif: the six sticker colors as a quiet segmented rule. */
export function StickerStrip({ className, width = 'w-24' }: { className?: string; width?: string }) {
  return (
    <div className={cx('sticker-strip', width, className)} aria-hidden="true">
      {COLORS.map((c) => (
        <span key={c} style={{ background: c, opacity: 0.85 }} />
      ))}
    </div>
  )
}

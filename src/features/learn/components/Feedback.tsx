import { CheckCircle2, XCircle } from 'lucide-react'
import { cx } from '@/lib/format'

/** Answer feedback: icon + label + explanation, never color alone. */
export function Feedback({ ok, label, text }: { ok: boolean; label: string; text: string }) {
  const Icon = ok ? CheckCircle2 : XCircle
  return (
    <div
      role="status"
      className={cx(
        'feedback-in flex items-start gap-3 rounded-2xl border p-4',
        ok ? 'border-st-green/40 bg-st-green/[0.09]' : 'border-[#ff6b7d]/40 bg-[#ff6b7d]/[0.08]',
      )}
    >
      <Icon size={22} className={cx('mt-0.5 shrink-0', ok ? 'text-[#4fe08f]' : 'text-[#ff8a96]')} aria-hidden="true" />
      <div>
        <p className="font-display font-semibold text-ink">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">{text}</p>
      </div>
    </div>
  )
}

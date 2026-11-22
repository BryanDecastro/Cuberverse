import type { RefObject } from 'react'
import { ArrowDownToLine, ArrowUpToLine, Rotate3d, RotateCcw, RotateCw } from 'lucide-react'
import type { CubeApi } from '@/features/cube/CubeScene'
import { useI18n } from '@/i18n/I18nProvider'

/** Camera buttons. They move the view only, never the pieces. */
export function ViewControls({ api, compact = false }: { api: RefObject<CubeApi | null>; compact?: boolean }) {
  const { t } = useI18n()
  const c = t.learn.camera
  const items = [
    { label: c.left, icon: RotateCcw, run: () => api.current?.orbit(Math.PI / 4, 0) },
    { label: c.right, icon: RotateCw, run: () => api.current?.orbit(-Math.PI / 4, 0) },
    { label: c.top, icon: ArrowUpToLine, run: () => api.current?.lookAt('U') },
    { label: c.bottom, icon: ArrowDownToLine, run: () => api.current?.lookAt('D') },
    { label: c.home, icon: Rotate3d, run: () => api.current?.lookAt('home') },
  ]
  return (
    <div role="group" aria-label={c.title} className="flex flex-wrap items-center gap-1.5">
      {!compact && (
        <span className="mr-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-3">{c.title}</span>
      )}
      {items.map(({ label, icon: Icon, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          title={label}
          aria-label={label}
          className="btn inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-line-strong/70 text-ink-2 transition-colors hover:border-[#7d95d6] hover:text-ink"
        >
          <Icon size={17} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

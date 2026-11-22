import { FACES, type Move } from '@/features/cube/moves'
import { STICKER_HEX } from '@/features/cube/CubeScene'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { describeMove, displayMove } from '../notationText'

/** All 18 outer-layer moves: one column per face, normal / prime / double. */
export function MovePad({ onMove, disabled = false, active }: { onMove: (m: Move) => void; disabled?: boolean; active?: Move | null }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
      {FACES.map((f) => (
        <div key={f} className="grid gap-1.5 sm:gap-2">
          {([f, `${f}'`, `${f}2`] as Move[]).map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => onMove(m)}
              aria-label={`${displayMove(m)}: ${describeMove(t, m)}`}
              title={describeMove(t, m)}
              className={cx(
                'btn relative flex h-11 items-center justify-center gap-1 rounded-xl border font-mono text-[0.95rem] font-medium transition-[background-color,border-color,transform] duration-200 active:scale-95 disabled:opacity-40 sm:h-12 sm:text-base',
                active === m ? 'border-accent-hover bg-accent/25 text-white' : 'border-line-strong/60 bg-canvas/60 text-ink hover:border-[#7d95d6] hover:bg-panel-2',
              )}
            >
              <span className="h-2 w-2 rounded-[3px]" style={{ background: STICKER_HEX[f] }} aria-hidden="true" />
              {displayMove(m)}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

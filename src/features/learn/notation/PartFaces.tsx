import { useEffect, useState } from 'react'
import { Eye, Hand, Palette } from 'lucide-react'
import { STICKER_HEX } from '@/features/cube/CubeScene'
import type { Face } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'
import { ViewControls } from '../components/ViewControls'
import { ControlsSlot, PanelSlot, useLessonCube } from '../shell/LessonCubeContext'

const ORDER: Face[] = ['F', 'R', 'U', 'L', 'B', 'D']

/** A three-quarter view that shows each face clearly, so hidden faces turn into view. */
const VIEW_FOR: Record<Face, [number, number]> = {
  F: [-0.62, 0.52],
  R: [-0.62, 0.52],
  U: [-0.62, 0.52],
  L: [0.62, 0.52],
  B: [Math.PI - 0.62, 0.52],
  D: [-0.62, -0.55],
}

export function PartFaces() {
  const { t } = useI18n()
  const p = t.learn.notation.p1
  const faces = t.learn.faces
  const cube = useLessonCube()
  const [selected, setSelected] = useState<Face | null>(null)

  useEffect(() => {
    cube.setHighlight(selected)
    if (selected) cube.api.current?.setView(...VIEW_FOR[selected])
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const select = (f: Face) => setSelected((cur) => (cur === f ? null : f))

  return (
    <>
      <ControlsSlot>
        <p className="mb-3 text-center text-sm text-ink-3">{p.tapHint}</p>
        <div role="radiogroup" aria-label={p.tapHint} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ORDER.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={selected === f}
              onClick={() => select(f)}
              className={cx(
                'btn flex flex-col items-center gap-0.5 rounded-2xl border px-2 py-2.5 transition-[background-color,border-color,transform] duration-300 active:scale-95',
                selected === f ? 'border-accent-hover bg-accent/20' : 'border-line-strong/60 bg-canvas/60 hover:bg-panel-2',
              )}
            >
              <span className="flex items-center gap-1.5 font-display text-xl font-semibold">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: STICKER_HEX[f] }} aria-hidden="true" />
                {f}
              </span>
              <span className="text-xs text-ink-3">{faces[f].name}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={cube.labels}
            onClick={() => cube.setLabels(!cube.labels)}
            className="btn inline-flex h-10 items-center gap-2.5 rounded-lg border border-line bg-canvas/60 px-3 text-sm text-ink-2 hover:text-ink"
          >
            <span className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300', cube.labels ? 'bg-accent' : 'bg-white/15')}>
              <span className={cx('absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300', cube.labels ? 'translate-x-[18px]' : 'translate-x-0.5')} />
            </span>
            {p.showLetters}
          </button>
          <ViewControls api={cube.api} />
        </div>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>
        <ul className="mt-5 grid gap-1.5">
          {ORDER.map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => select(f)}
                aria-pressed={selected === f}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-300',
                  selected === f ? 'border-accent-hover/70 bg-accent/12' : 'border-transparent hover:bg-white/[0.04]',
                )}
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-lg font-bold text-canvas"
                  style={{ background: STICKER_HEX[f] }}
                >
                  {f}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{faces[f].name}</span>
                  <span className="block text-xs leading-snug text-ink-3">{faces[f].where}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl border border-dashed border-line-strong/70 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Hand size={16} className="text-[#8fb8ff]" aria-hidden="true" />
              <Eye size={16} className="-ml-1 text-[#8fb8ff]" aria-hidden="true" />
              {p.noteTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.noteText}</p>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Palette size={16} className="text-[#8fb8ff]" aria-hidden="true" />
              {p.colorTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.colorText}</p>
          </div>
        </div>
      </PanelSlot>
    </>
  )
}

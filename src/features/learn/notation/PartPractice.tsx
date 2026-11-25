import { useState } from 'react'
import { Keyboard, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react'
import { invertMove, mergeMove, type Face, type Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { fmt } from '@/lib/format'
import { MovePad } from '../components/MovePad'
import { ViewControls } from '../components/ViewControls'
import { displayMove, moveDir } from '../notationText'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from '../shell/LessonCubeContext'
import { useMoveKeys } from '../shell/useMoveKeys'

const toolBtn =
  'btn inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-canvas/60 px-3.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40'

export function PartPractice() {
  const { t } = useI18n()
  const p = t.learn.notation.p3
  const cube = useLessonCube()
  const [moves, setMoves] = useState<Move[]>([])
  const [animating, setAnimating] = useState<Move | null>(null)

  // Show which face is turning while it turns.
  useCubeEvents({
    onMoveStart: (m) => {
      setAnimating(m)
      cube.setHighlight(m[0] as Face)
      cube.setArrow({ face: m[0] as Face, dir: moveDir(m) })
    },
    onIdle: () => {
      setAnimating(null)
      cube.setHighlight(null)
      cube.setArrow(null)
    },
  })

  // The engine queues moves strictly in order, so fast taps never overlap.
  const doMove = (m: Move) => {
    cube.api.current?.play([m])
    // The same turn twice in a row is written as one half turn (U U -> U2).
    setMoves((list) => mergeMove(list, m))
  }
  useMoveKeys(doMove)

  const undo = () => {
    const last = moves[moves.length - 1]
    if (!last) return
    cube.api.current?.play([invertMove(last)])
    setMoves((list) => list.slice(0, -1))
  }
  const reset = () => {
    cube.api.current?.reset()
    cube.setHighlight(null)
    cube.setArrow(null)
    setAnimating(null)
    setMoves([])
  }
  const replay = () => {
    if (!moves.length) return
    cube.api.current?.reset()
    cube.api.current?.play(moves)
  }

  return (
    <>
      <ControlsSlot>
        <MovePad onMove={doMove} active={animating} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={undo} disabled={!moves.length} className={toolBtn}>
              <Undo2 size={16} aria-hidden="true" /> {p.undo}
            </button>
            <button type="button" onClick={reset} className={toolBtn}>
              <RotateCcw size={16} aria-hidden="true" /> {p.reset}
            </button>
            <button type="button" onClick={replay} disabled={!moves.length} className={toolBtn}>
              <Play size={15} aria-hidden="true" /> {p.replay}
            </button>
          </div>
          <ViewControls api={cube.api} compact />
        </div>
        <p className="mt-3 hidden items-center gap-2 text-xs text-ink-3 sm:flex">
          <Keyboard size={14} aria-hidden="true" /> {p.keyboard}
        </p>
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>
        <div className="mt-5 rounded-2xl border border-line bg-canvas/50 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-ink">{p.history}</p>
            <p className="font-mono text-xs text-ink-3">{fmt(p.count, { n: moves.length })}</p>
          </div>
          {moves.length ? (
            <p className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto font-mono text-[0.95rem]" aria-live="polite">
              {moves.map((m, i) => (
                <span key={i} className={i === moves.length - 1 ? 'rounded-md bg-accent/25 px-1.5 text-white' : 'px-1.5 text-ink-2'}>
                  {displayMove(m)}
                </span>
              ))}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-3">{p.empty}</p>
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-st-yellow/30 bg-st-yellow/[0.06] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Lightbulb size={16} className="text-st-yellow" aria-hidden="true" /> {p.tipTitle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.tip}</p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">{t.learn.camera.hint}</p>
      </PanelSlot>
    </>
  )
}

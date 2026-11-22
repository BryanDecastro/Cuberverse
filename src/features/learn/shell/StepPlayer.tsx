import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { faceOf, invertSequence, parseAlg, type Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from './LessonCubeContext'
import { displayMove, moveDir } from '../notationText'

const SPEEDS = [0.5, 1, 2] as const

/**
 * Plays a planned list of steps on the lesson cube, one step at a time.
 * Deterministic like the algorithm player: nothing new starts until the cube
 * is idle, so the cube always shows setup + steps[0..applied).
 */
export type PlayerStep = { moves: Move[] }

export function StepPlayer({
  setup,
  steps,
  describe,
  viewFor,
  panelTop,
  doneText,
}: {
  setup: string
  steps: PlayerStep[]
  /** Plain explanation of step i. */
  describe: (i: number) => string
  /** Optional camera angle for step i. */
  viewFor?: (i: number) => [number, number] | null
  panelTop?: ReactNode
  doneText?: string
}) {
  const { t } = useI18n()
  const p = t.learn.notation.p4
  const w = t.learn.whiteCross.p3
  const cube = useLessonCube()

  const [applied, setApplied] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [anim, setAnim] = useState<number | null>(null)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const s = useRef({ applied, playing, anim, speed })
  s.current = { applied, playing, anim, speed }
  const timer = useRef<number | undefined>(undefined)

  const restart = () => {
    window.clearTimeout(timer.current)
    cube.api.current?.setState(parseAlg(setup))
    cube.setHighlight(null)
    cube.setArrow(null)
    setAnim(null)
    setApplied(0)
    s.current.applied = 0
    s.current.anim = null
  }

  // Set the position up as soon as the cube can take it.
  useEffect(() => {
    if (cube.ready) {
      restart()
      cube.api.current?.lookAt('home')
    }
    return () => window.clearTimeout(timer.current)
  }, [cube.ready, setup]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cube.api.current?.setSpeed(speed)
  }, [speed]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = (dirn: 1 | -1) => {
    const { applied: a, anim: busy } = s.current
    if (busy !== null) return
    const idx = dirn === 1 ? a : a - 1
    const st = steps[idx]
    if (!st) return
    const view = viewFor?.(idx)
    if (view) cube.api.current?.setView(...view)
    setAnim(idx)
    setApplied(dirn === 1 ? a + 1 : a - 1)
    s.current.anim = idx
    cube.api.current?.play(dirn === 1 ? st.moves : invertSequence(st.moves))
  }

  useCubeEvents({
    // Light up each face as it turns (whole-cube turns light nothing).
    onMoveStart: (m) => {
      const f = faceOf(m)
      cube.setHighlight(f)
      cube.setArrow(f ? { face: f, dir: moveDir(m) } : null)
    },
    onIdle: () => {
      setAnim(null)
      s.current.anim = null
      if (s.current.playing) {
        if (s.current.applied < steps.length) {
          timer.current = window.setTimeout(() => {
            if (s.current.playing) run(1)
          }, 600 / s.current.speed)
        } else setPlaying(false)
      }
    },
  })

  const play = () => {
    if (s.current.applied >= steps.length) restart()
    setPlaying(true)
    s.current.playing = true
    if (s.current.anim === null) run(1)
  }
  const pause = () => {
    window.clearTimeout(timer.current)
    setPlaying(false)
  }

  const busy = anim !== null
  const focus = anim ?? (applied > 0 ? applied - 1 : null)
  const finished = applied === steps.length && !busy
  const transport =
    'btn inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong/60 bg-canvas/60 text-ink transition-colors hover:bg-panel-2 disabled:opacity-35'

  return (
    <>
      <ControlsSlot>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className={transport} onClick={() => run(-1)} disabled={busy || playing || applied === 0} aria-label={w.prev} title={w.prev}>
            <SkipBack size={18} aria-hidden="true" />
          </button>
          {playing ? (
            <button type="button" onClick={pause} className="btn inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-6 font-display font-semibold text-white">
              <Pause size={18} fill="currentColor" aria-hidden="true" /> {p.pause}
            </button>
          ) : (
            <button type="button" onClick={play} disabled={busy} className="btn inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-6 font-display font-semibold text-white disabled:opacity-60">
              <Play size={18} fill="currentColor" aria-hidden="true" /> {p.play}
            </button>
          )}
          <button type="button" className={transport} onClick={() => run(1)} disabled={busy || playing || applied === steps.length} aria-label={w.next} title={w.next}>
            <SkipForward size={18} aria-hidden="true" />
          </button>
          <button type="button" className={transport} onClick={restart} aria-label={p.replay} title={p.replay}>
            <RotateCcw size={18} aria-hidden="true" />
          </button>
          <div role="radiogroup" aria-label={p.speed} className="ml-1 inline-flex rounded-xl border border-line bg-canvas/60 p-1">
            {SPEEDS.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={speed === v}
                onClick={() => setSpeed(v)}
                className={cx('h-9 min-w-11 rounded-lg px-2 font-mono text-sm transition-colors', speed === v ? 'bg-accent/25 text-white' : 'text-ink-3 hover:text-ink')}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-xs text-ink-3" aria-live="polite">
          {fmt(w.stepOf, { n: focus === null ? 0 : focus + 1, total: steps.length })}
        </p>
      </ControlsSlot>

      <PanelSlot>
        {panelTop}
        <ol className="mt-5 grid gap-2">
          {steps.map((st, i) => (
            <li
              key={i}
              aria-current={focus === i ? 'step' : undefined}
              className={cx(
                'flex gap-3 rounded-xl border p-3 text-sm leading-relaxed transition-colors duration-300',
                st.moves.length > 4 && 'flex-col gap-1',
                focus === i ? 'border-accent-hover/60 bg-accent/10 text-ink' : i < applied ? 'border-line text-ink-2' : 'border-line text-ink-3',
              )}
            >
              <span className="min-w-12 shrink-0 whitespace-nowrap font-mono text-[0.95rem] font-medium text-ink">{st.moves.map(displayMove).join(' ')}</span>
              <span>{describe(i)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-3" aria-live="polite">
          {finished ? (doneText ?? w.finished) : applied === 0 && !busy ? w.ready : ''}
        </p>
      </PanelSlot>
    </>
  )
}

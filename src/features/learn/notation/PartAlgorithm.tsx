import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles } from 'lucide-react'
import { invertMove, parseAlg, type Face, type Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { displayMove, moveDir } from '../notationText'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from '../shell/LessonCubeContext'

export const SEXY_MOVE: Move[] = parseAlg("R U R' U'")
const SPEEDS = [0.5, 1, 2] as const

const EXPLAIN_KEY: Record<string, 'R' | 'U' | 'Rp' | 'Up'> = { R: 'R', U: 'U', "R'": 'Rp', "U'": 'Up' }

/**
 * Deterministic step player. `applied` is how many moves of the algorithm the
 * cube currently shows; every action is one queued quarter turn, and nothing
 * new starts until the cube is idle, so the state always equals alg[0..applied).
 */
export function PartAlgorithm() {
  const { t } = useI18n()
  const p = t.learn.notation.p4
  const cube = useLessonCube()
  const alg = SEXY_MOVE

  const [applied, setApplied] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [animIdx, setAnimIdx] = useState<number | null>(null)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)

  // Refs mirror state for the timer and cube callbacks.
  const s = useRef({ applied, playing, animIdx, speed })
  s.current = { applied, playing, animIdx, speed }
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    cube.api.current?.setSpeed(speed)
  }, [speed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const step = (dirn: 1 | -1) => {
    const { applied: a, animIdx: busy } = s.current
    if (busy !== null) return
    if (dirn === 1 && a < alg.length) {
      const m = alg[a]
      setAnimIdx(a)
      setApplied(a + 1)
      showMove(m)
      cube.api.current?.play([m])
    } else if (dirn === -1 && a > 0) {
      const m = invertMove(alg[a - 1])
      setAnimIdx(a - 1)
      setApplied(a - 1)
      showMove(m)
      cube.api.current?.play([m])
    }
  }

  const showMove = (m: Move) => {
    cube.setHighlight(m[0] as Face)
    cube.setArrow({ face: m[0] as Face, dir: moveDir(m) })
  }

  const restart = () => {
    window.clearTimeout(timer.current)
    cube.api.current?.reset()
    cube.setHighlight(null)
    cube.setArrow(null)
    setAnimIdx(null)
    setApplied(0)
    s.current.applied = 0
    s.current.animIdx = null
  }

  const play = () => {
    if (s.current.applied >= alg.length) restart()
    setPlaying(true)
    if (s.current.animIdx === null) step(1)
  }
  const pause = () => {
    window.clearTimeout(timer.current)
    setPlaying(false)
  }
  const replay = () => {
    restart()
    setPlaying(true)
    step(1)
  }

  useCubeEvents({
    onIdle: () => {
      setAnimIdx(null)
      s.current.animIdx = null
      if (s.current.playing) {
        if (s.current.applied < alg.length) {
          timer.current = window.setTimeout(() => {
            if (s.current.playing) step(1)
          }, 420 / s.current.speed)
        } else {
          setPlaying(false)
        }
      }
    },
  })

  // The move being explained: the one turning now, else the last one applied.
  const focus = animIdx ?? (applied > 0 ? applied - 1 : null)
  const busy = animIdx !== null
  const finished = applied === alg.length && !busy

  const transport = 'btn inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong/60 bg-canvas/60 text-ink transition-colors hover:bg-panel-2 disabled:opacity-35'

  return (
    <>
      <ControlsSlot>
        <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label={p.name}>
          {alg.map((m, i) => {
            const isNow = animIdx === i
            const isDone = i < applied && !isNow
            return (
              <li
                key={i}
                aria-current={isNow ? 'step' : undefined}
                className={cx(
                  'flex h-16 min-w-16 items-center justify-center rounded-2xl border px-3 font-mono text-3xl font-medium transition-[background-color,border-color,color,transform] duration-300 sm:h-20 sm:min-w-20 sm:text-4xl',
                  isNow
                    ? 'scale-105 border-accent-hover bg-accent/25 text-white shadow-[0_0_30px_-8px_rgb(47_123_255/0.9)]'
                    : isDone
                      ? 'border-st-green/40 bg-st-green/[0.08] text-ink-2'
                      : 'border-line-strong/50 bg-canvas/50 text-ink',
                )}
              >
                {displayMove(m)}
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-center font-mono text-xs text-ink-3" aria-live="polite">
          {fmt(p.moveOf, { n: focus === null ? 0 : focus + 1, total: alg.length })}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button type="button" className={transport} onClick={() => step(-1)} disabled={busy || playing || applied === 0} aria-label={p.prev} title={p.prev}>
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
          <button type="button" className={transport} onClick={() => step(1)} disabled={busy || playing || applied === alg.length} aria-label={p.next} title={p.next}>
            <SkipForward size={18} aria-hidden="true" />
          </button>
          <button type="button" className={transport} onClick={replay} aria-label={p.replay} title={p.replay}>
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
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{p.lead}</p>
        <div className="mt-5 rounded-2xl border border-violet/35 bg-violet/[0.07] p-4">
          <p className="flex items-center gap-2 font-display font-semibold text-ink">
            <Sparkles size={16} className="text-[#b69bff]" aria-hidden="true" /> {p.name}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.about}</p>
        </div>
        <ol className="mt-5 grid gap-2">
          {alg.map((m, i) => (
            <li
              key={i}
              className={cx(
                'rounded-xl border p-3 text-sm leading-relaxed transition-colors duration-300',
                focus === i ? 'border-accent-hover/60 bg-accent/10 text-ink' : i < applied ? 'border-line text-ink-2' : 'border-line text-ink-3',
              )}
            >
              {p.explain[EXPLAIN_KEY[m]]}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-3" aria-live="polite">
          {finished ? p.finished : applied === 0 && !busy ? p.ready : ''}
        </p>
      </PanelSlot>
    </>
  )
}

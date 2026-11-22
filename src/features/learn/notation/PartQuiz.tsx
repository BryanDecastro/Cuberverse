import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, Flag, RotateCcw, Shuffle } from 'lucide-react'
import { STICKER_HEX } from '@/features/cube/CubeScene'
import { applyMoves, sameColors, solvedState, toColorMap } from '@/features/cube/model'
import type { Face, Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { Feedback } from '../components/Feedback'
import { MovePad } from '../components/MovePad'
import { ViewControls } from '../components/ViewControls'
import { describeMove, displayMove } from '../notationText'
import { SEXY_MOVE } from './PartAlgorithm'
import { ControlsSlot, PanelSlot, useCubeEvents, useLessonCube } from '../shell/LessonCubeContext'
import { useMoveKeys } from '../shell/useMoveKeys'

const TOTAL = 4
const FACE_ORDER: Face[] = ['U', 'L', 'F', 'R', 'B', 'D']
/** Moves on faces you can see from the normal view, so the answer is watchable. */
const WATCHABLE: Move[] = ['R', "R'", 'R2', 'U', "U'", 'U2', 'F', "F'", 'F2']

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** A watchable move plus three plausible wrong answers (same face first, then neighbours). */
function makeWatchQuestion(exclude?: Move) {
  const pool = WATCHABLE.filter((m) => m !== exclude)
  const answer = pool[Math.floor(Math.random() * pool.length)]
  const sameFace = WATCHABLE.filter((m) => m[0] === answer[0] && m !== answer)
  const other = shuffle(WATCHABLE.filter((m) => m[0] !== answer[0])).slice(0, 1)
  return { answer, options: shuffle([answer, ...sameFace, ...other]) }
}

type Result = { ok: boolean; text: string } | null

export function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.notation.p5
  const faces = t.learn.faces
  const cube = useLessonCube()
  const [ex, setEx] = useState(0)
  const [result, setResult] = useState<Result>(null)

  // Exercise 3 state
  const [pos, setPos] = useState(0)
  const [locked, setLocked] = useState(false)
  const pendingReset = useRef(false)
  const pendingCheck = useRef(false)

  // Exercise 4 state
  const [watch, setWatch] = useState(() => makeWatchQuestion())
  const watchTimer = useRef<number | undefined>(undefined)

  const q2options = useMemo(() => [q.q2options[1], q.q2options[0], q.q2options[2]], [q.q2options])
  const q2correct = q.q2options[0]

  const goTo = (n: number) => {
    setEx(n)
    setResult(null)
    setPos(0)
    setLocked(false)
    pendingReset.current = false
    pendingCheck.current = false
    cube.api.current?.reset()
    cube.api.current?.lookAt('home')
    cube.setHighlight(null)
    cube.setArrow(null)
  }

  const playWatch = (m: Move) => {
    window.clearTimeout(watchTimer.current)
    cube.api.current?.reset()
    cube.api.current?.lookAt('home')
    watchTimer.current = window.setTimeout(() => cube.api.current?.play([m]), 700)
  }

  useEffect(() => {
    if (ex === 3) playWatch(watch.answer)
    return () => window.clearTimeout(watchTimer.current)
  }, [ex, watch]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Exercise 3: perform R U R' U' ---------- */
  const onPadMove = (m: Move) => {
    if (ex !== 2 || locked || result?.ok) return
    const want = SEXY_MOVE[pos]
    cube.api.current?.play([m])
    if (m === want) {
      const next = pos + 1
      setPos(next)
      setResult(null)
      if (next === SEXY_MOVE.length) {
        setLocked(true)
        pendingCheck.current = true
      }
    } else {
      setLocked(true)
      pendingReset.current = true
      setResult({ ok: false, text: fmt(q.fb.q3no, { got: displayMove(m), want: displayMove(want) }) })
    }
  }
  useMoveKeys(onPadMove, ex === 2)

  useCubeEvents({
    onIdle: () => {
      if (pendingReset.current) {
        pendingReset.current = false
        window.setTimeout(() => {
          cube.api.current?.reset()
          setPos(0)
          setLocked(false)
        }, 900)
      } else if (pendingCheck.current) {
        pendingCheck.current = false
        // Check the cube's real state, not just the button presses.
        const expected = toColorMap(applyMoves(solvedState(), SEXY_MOVE))
        const actual = cube.api.current?.readState()
        const ok = !!actual && sameColors(expected, actual)
        setResult(ok ? { ok: true, text: q.fb.q3ok } : { ok: false, text: fmt(q.fb.q3no, { got: '?', want: displayMove(SEXY_MOVE[0]) }) })
        if (!ok) {
          cube.api.current?.reset()
          setPos(0)
          setLocked(false)
        }
      }
    },
  })

  /* ---------- Answers ---------- */
  const answerFace = (f: Face) => {
    if (result?.ok) return
    setResult(f === 'R' ? { ok: true, text: q.fb.q1ok } : { ok: false, text: fmt(q.fb.q1no, { face: `${f} (${faces[f].name})` }) })
    cube.setHighlight(f)
  }
  const answerMeaning = (opt: string) => {
    if (result?.ok) return
    setResult(opt === q2correct ? { ok: true, text: q.fb.q2ok } : { ok: false, text: q.fb.q2no })
  }
  const answerWatch = (m: Move) => {
    if (result) return
    const ok = m === watch.answer
    setResult(
      ok
        ? { ok: true, text: fmt(q.fb.q4ok, { move: displayMove(watch.answer) }) }
        : { ok: false, text: fmt(q.fb.q4no, { move: displayMove(watch.answer), why: describeMove(t, watch.answer) }) },
    )
  }

  const questions = [q.q1, q.q2, q.q3, q.q4]
  const optionBtn = (state: 'idle' | 'right' | 'wrong') =>
    cx(
      'btn flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-[background-color,border-color] duration-300',
      state === 'right' ? 'border-st-green/60 bg-st-green/10 text-ink' : state === 'wrong' ? 'border-[#ff6b7d]/50 bg-[#ff6b7d]/[0.07] text-ink' : 'border-line-strong/60 bg-canvas/50 text-ink hover:bg-panel-2',
    )
  const [picked, setPicked] = useState<string | null>(null)
  useEffect(() => setPicked(null), [ex, watch])
  const stateOf = (id: string, correct: boolean): 'idle' | 'right' | 'wrong' => (picked !== id ? 'idle' : correct ? 'right' : 'wrong')

  return (
    <>
      <ControlsSlot>
        {ex === 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-3">{q.q1hint}</p>
            <ViewControls api={cube.api} compact />
          </div>
        )}
        {ex === 1 && <ViewControls api={cube.api} />}
        {ex === 2 && (
          <>
            <ol className="mb-4 flex items-center justify-center gap-2" aria-label={q.q3}>
              {SEXY_MOVE.map((m, i) => (
                <li
                  key={i}
                  className={cx(
                    'flex h-12 min-w-12 items-center justify-center gap-1 rounded-xl border px-2 font-mono text-xl transition-colors duration-300',
                    i < pos ? 'border-st-green/50 bg-st-green/10 text-ink' : i === pos && !result?.ok ? 'border-accent-hover bg-accent/15 text-white' : 'border-line-strong/50 text-ink-2',
                  )}
                >
                  {i < pos && <CheckCircle2 size={14} className="text-[#4fe08f]" aria-label="✓" />}
                  {displayMove(m)}
                </li>
              ))}
            </ol>
            <MovePad onMove={onPadMove} disabled={locked || !!result?.ok} />
            <p className="mt-3 text-center text-xs text-ink-3">{q.q3hint}</p>
          </>
        )}
        {ex === 3 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => playWatch(watch.answer)}
              className="btn inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong/70 bg-canvas/60 px-4 text-sm font-semibold text-ink hover:bg-panel-2"
            >
              <Eye size={16} aria-hidden="true" /> {q.watchAgain}
            </button>
          </div>
        )}
      </ControlsSlot>

      <PanelSlot>
        <p className="leading-relaxed text-ink-2">{q.lead}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span key={i} className={cx('h-1.5 flex-1 rounded-full', i < ex ? 'bg-st-green' : i === ex ? 'bg-accent' : 'bg-white/10')} />
          ))}
        </div>
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[#7fb0ff]">{fmt(q.exercise, { n: ex + 1, total: TOTAL })}</p>
        <h3 className="mt-2 font-display text-xl font-semibold leading-snug">{questions[ex]}</h3>

        <div className="mt-4 grid gap-2">
          {ex === 0 &&
            FACE_ORDER.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setPicked(f)
                  answerFace(f)
                }}
                onMouseEnter={() => !result?.ok && cube.setHighlight(f)}
                onFocus={() => !result?.ok && cube.setHighlight(f)}
                onMouseLeave={() => !result?.ok && cube.setHighlight(picked as Face | null)}
                className={optionBtn(stateOf(f, f === 'R'))}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ background: STICKER_HEX[f] }} aria-hidden="true" />
                {faces[f].name}
              </button>
            ))}
          {ex === 1 &&
            q2options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setPicked(opt)
                  answerMeaning(opt)
                }}
                className={optionBtn(stateOf(opt, opt === q2correct))}
              >
                {opt}
              </button>
            ))}
          {ex === 3 && (
            <div className="grid grid-cols-2 gap-2">
              {watch.options.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={!!result}
                  onClick={() => {
                    setPicked(m)
                    answerWatch(m)
                  }}
                  className={cx(optionBtn(stateOf(m, m === watch.answer)), 'justify-center font-mono text-xl disabled:cursor-default')}
                >
                  {displayMove(m)}
                </button>
              ))}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-4">
            <Feedback ok={result.ok} label={result.ok ? q.correct : q.incorrect} text={result.text} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {result?.ok && ex < TOTAL - 1 && (
            <button type="button" onClick={() => goTo(ex + 1)} className="btn inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-5 font-display font-semibold text-white">
              {q.next} <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
          {result?.ok && ex === TOTAL - 1 && (
            <button type="button" onClick={onFinish} className="btn inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-5 font-display font-semibold text-white">
              <Flag size={17} aria-hidden="true" /> {q.finish}
            </button>
          )}
          {ex === 3 && result && !result.ok && (
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setWatch(makeWatchQuestion(watch.answer))
              }}
              className="btn inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong/70 px-4 text-sm font-semibold text-ink hover:bg-panel-2"
            >
              <Shuffle size={16} aria-hidden="true" /> {q.another}
            </button>
          )}
          {ex === 2 && !result?.ok && pos > 0 && !locked && (
            <button
              type="button"
              onClick={() => goTo(2)}
              className="btn inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-ink-2 hover:bg-white/5 hover:text-ink"
            >
              <RotateCcw size={15} aria-hidden="true" /> {t.learn.notation.p3.reset}
            </button>
          )}
        </div>
      </PanelSlot>
    </>
  )
}

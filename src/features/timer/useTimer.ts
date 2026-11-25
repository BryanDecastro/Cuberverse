import { useCallback, useEffect, useReducer, useRef, useState, type RefObject } from 'react'
import { initialTimer, inspectionDisplay, timerReducer, type InspectionStage, type Phase } from './engine'
import type { Penalty } from './types'
import { formatTime } from './stats'

/**
 * Binds the timer state machine to the keyboard and to touch.
 * - Space: hold until ready, release to start. Any key stops. Escape cancels a hold.
 * - With `inspection` on, a first tap of Space (or the pad) starts WCA inspection.
 * - Touch / pointer on `padRef`: same, with a finger.
 * While running, the display text is written straight to `displayRef` on every
 * frame, so React does not re-render 60 times a second during a solve.
 */
export function useTimer({
  padRef,
  displayRef,
  enabled,
  inspection = false,
  onStop,
}: {
  padRef: RefObject<HTMLElement | null>
  displayRef: RefObject<HTMLElement | null>
  enabled: boolean
  /** WCA 15 s inspection before each solve. */
  inspection?: boolean
  onStop: (ms: number, penalty: Penalty) => void
}) {
  const [state, dispatch] = useReducer(timerReducer, initialTimer)
  const live = useRef(state)
  live.current = state
  const onStopRef = useRef(onStop)
  onStopRef.current = onStop
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const inspectionRef = useRef(inspection)
  inspectionRef.current = inspection
  // Inspection countdown, re-rendered only when the shown second or warning changes.
  const [insp, setInsp] = useState<{ text: string; stage: InspectionStage } | null>(null)

  // Times come from the input event itself (event.timeStamp shares performance.now()'s clock),
  // so a busy main thread that runs the handler late does not change the measured time.
  const press = useCallback((at: number = performance.now()) => {
    const s = live.current
    if (!enabledRef.current && s.phase !== 'running') return
    dispatch({ type: 'press', at, inspect: inspectionRef.current })
  }, [])
  const release = useCallback((at: number = performance.now(), trigger = true) => dispatch({ type: 'release', at, trigger }), [])

  // Report the result once, when a run turns into a stop.
  const prevPhase = useRef<Phase>('idle')
  useEffect(() => {
    if (prevPhase.current === 'running' && state.phase === 'stopped' && state.result !== null) onStopRef.current(state.result, state.penalty)
    prevPhase.current = state.phase
  }, [state.phase, state.result, state.penalty])

  // Keyboard
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
    }
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return
      const s = live.current
      if (s.phase === 'running') {
        e.preventDefault()
        press(e.timeStamp)
        return
      }
      if (e.code === 'Escape') {
        dispatch({ type: 'cancel' })
        return
      }
      if (e.code === 'Space') {
        e.preventDefault() // no page scroll, no button click
        if (!e.repeat) press(e.timeStamp)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (typing(e)) return
      if (e.code === 'Space') e.preventDefault()
      // Every key release goes to the reducer, which decides: any key ends the wait after a stop
      // (even one released before React re-rendered), but only Space can start the clock.
      release(e.timeStamp, e.code === 'Space')
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [press, release])

  // Touch / pointer on the timer pad. Listening on window and checking the target keeps
  // working even when the pad element is replaced (for example leaving the first-solve view).
  useEffect(() => {
    const onPad = (e: PointerEvent) => !!padRef.current && padRef.current.contains(e.target as Node)
    const onControl = (e: PointerEvent) => !!(e.target as HTMLElement).closest('button, a, input, select')
    const down = (e: PointerEvent) => {
      const s = live.current
      // While running, a tap anywhere stops the clock.
      if (s.phase === 'running') {
        e.preventDefault()
        press(e.timeStamp)
        return
      }
      if (!onPad(e) || onControl(e)) return
      e.preventDefault()
      press(e.timeStamp)
    }
    const up = (e: PointerEvent) => {
      const s = live.current
      if (s.phase === 'holding' || s.phase === 'ready' || s.awaitRelease) release(e.timeStamp)
      else if (onPad(e) && !onControl(e)) release(e.timeStamp)
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [padRef, press, release])

  // Frame loop: arm after the hold time, count inspection down, and draw the running time.
  const inspecting = state.inspectStart !== null && (state.phase === 'inspecting' || state.phase === 'holding' || state.phase === 'ready')
  useEffect(() => {
    if (!inspecting) setInsp(null)
    if (state.phase !== 'holding' && state.phase !== 'running' && !inspecting) return
    let raf = 0
    const loop = () => {
      const now = performance.now()
      const s = live.current
      if (s.phase === 'holding') dispatch({ type: 'tick', at: now })
      if (s.inspectStart !== null && s.phase !== 'running') {
        const next = inspectionDisplay(now - s.inspectStart)
        setInsp((prev) => (prev && prev.text === next.text && prev.stage === next.stage ? prev : next))
      }
      if (s.phase === 'running' && displayRef.current) displayRef.current.textContent = formatTime(now - s.start)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state.phase, inspecting, displayRef])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  return { phase: state.phase, result: state.result, penalty: state.penalty, inspection: inspecting ? (insp ?? { text: '15', stage: 'ok' as const }) : null, reset }
}

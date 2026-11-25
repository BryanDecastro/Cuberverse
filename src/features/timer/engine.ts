/**
 * Timer state machine (pure, so it can be tested without a browser).
 *
 * Like a competition timer: hold the trigger (Space, or a touch) until it turns
 * green, release to start, then any key or touch stops it.
 *
 *   idle/stopped --press--> holding --(held HOLD_MS)--> ready --release--> running
 *   holding --release too early--> back to where it was
 *   running --press--> stopped (waits for that key to be released before a new hold)
 *
 * With WCA inspection on, a first tap starts a 15 second inspection instead:
 *
 *   idle/stopped --tap--> inspecting --hold--> holding --> ready --release--> running
 *
 * Starting after 15 s of inspection is +2, after 17 s a DNF (WCA Regulations A3a, 10e).
 * All times come from performance.now(), passed in by the caller.
 */
import type { Penalty } from './types'

export const HOLD_MS = 300
export const INSPECTION_MS = 15_000
export const INSPECTION_DNF_MS = 17_000

export type Phase = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running' | 'stopped'

export type TimerState = {
  phase: Phase
  /** Where to return if a hold is released too early. */
  restPhase: 'idle' | 'stopped' | 'inspecting'
  holdStart: number
  start: number
  /** When inspection began, while it is under way. */
  inspectStart: number | null
  /** Final elapsed ms once stopped. */
  result: number | null
  /** Penalty earned during inspection, applied to the solve that follows. */
  penalty: Penalty
  /** After stopping, ignore presses until the stopping key is released. */
  awaitRelease: boolean
}

export type TimerAction =
  | { type: 'press'; at: number; inspect?: boolean }
  /** `trigger: false` for keys other than the timer's trigger: they only end the post-stop wait. */
  | { type: 'release'; at: number; trigger?: boolean }
  | { type: 'tick'; at: number }
  | { type: 'cancel' }
  | { type: 'reset' }

export const initialTimer: TimerState = {
  phase: 'idle',
  restPhase: 'idle',
  holdStart: 0,
  start: 0,
  inspectStart: null,
  result: null,
  penalty: 'none',
  awaitRelease: false,
}

/** The penalty for starting the solve after `ms` of inspection. */
export function inspectionPenalty(ms: number): Penalty {
  if (ms > INSPECTION_DNF_MS) return 'dnf'
  if (ms > INSPECTION_MS) return '+2'
  return 'none'
}

export type InspectionStage = 'ok' | '8' | '12' | '+2' | 'dnf'

/** What the clock shows during inspection: seconds left, then +2, then DNF. */
export function inspectionDisplay(elapsed: number): { text: string; stage: InspectionStage } {
  if (elapsed < INSPECTION_MS) {
    const stage: InspectionStage = elapsed >= 12_000 ? '12' : elapsed >= 8_000 ? '8' : 'ok'
    return { text: String(Math.ceil((INSPECTION_MS - elapsed) / 1000)), stage }
  }
  if (elapsed <= INSPECTION_DNF_MS) return { text: '+2', stage: '+2' }
  return { text: 'DNF', stage: 'dnf' }
}

export function timerReducer(s: TimerState, a: TimerAction): TimerState {
  switch (a.type) {
    case 'press':
      if (s.phase === 'running') return { ...s, phase: 'stopped', restPhase: 'stopped', result: Math.max(0, Math.round(a.at - s.start)), awaitRelease: true }
      if (s.awaitRelease) return s
      if (s.phase === 'idle' || s.phase === 'stopped') {
        // A tap starts inspection; the key's release is swallowed so it cannot also arm the clock.
        if (a.inspect) return { ...s, phase: 'inspecting', inspectStart: a.at, result: null, penalty: 'none', awaitRelease: true }
        return { ...s, phase: 'holding', restPhase: s.phase, holdStart: a.at, penalty: 'none' }
      }
      if (s.phase === 'inspecting') return { ...s, phase: 'holding', restPhase: 'inspecting', holdStart: a.at }
      return s
    case 'tick':
      if (s.phase === 'holding' && a.at - s.holdStart >= HOLD_MS) return { ...s, phase: 'ready' }
      return s
    case 'release':
      if (s.awaitRelease) return { ...s, awaitRelease: false }
      if (a.trigger === false) return s
      // Decide on the real hold length (release time minus press time), not on whether a
      // late animation frame already showed 'ready': a quick tap never starts the clock.
      if (s.phase === 'holding' || s.phase === 'ready') {
        if (a.at - s.holdStart >= HOLD_MS) {
          const penalty = s.inspectStart === null ? 'none' : inspectionPenalty(a.at - s.inspectStart)
          return { ...s, phase: 'running', start: a.at, result: null, inspectStart: null, penalty }
        }
        return { ...s, phase: s.restPhase }
      }
      return s
    case 'cancel':
      // Escape abandons inspection altogether; otherwise it just drops the hold.
      if (s.phase === 'inspecting' || ((s.phase === 'holding' || s.phase === 'ready') && s.restPhase === 'inspecting'))
        return { ...s, phase: 'idle', restPhase: 'idle', inspectStart: null, penalty: 'none' }
      if (s.phase === 'holding' || s.phase === 'ready') return { ...s, phase: s.restPhase }
      return s
    case 'reset':
      return initialTimer
  }
}

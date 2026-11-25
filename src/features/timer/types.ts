/**
 * Timer data. Kept plain and serializable so the local store can later be
 * swapped for Supabase tables (sessions, solves) without touching the UI.
 */
export type TimerEvent = '333' | '222' | '444'
export const TIMER_EVENTS: TimerEvent[] = ['333', '222', '444']
export const EVENT_LABEL: Record<TimerEvent, string> = { '333': '3x3', '222': '2x2', '444': '4x4' }

/** WCA penalties: +2 seconds, or Did Not Finish. */
export type Penalty = 'none' | '+2' | 'dnf'

export type Solve = {
  id: string
  sessionId: string
  event: TimerEvent
  /** Raw time in milliseconds, before any penalty. */
  ms: number
  penalty: Penalty
  scramble: string
  /** ISO date. */
  at: string
}

export type Session = {
  id: string
  name: string
  event: TimerEvent
  createdAt: string
}

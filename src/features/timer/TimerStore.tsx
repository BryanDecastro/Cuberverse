import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { storage } from '@/lib/storage'
import { TIMER_EVENTS, type Penalty, type Session, type Solve, type TimerEvent } from './types'

/**
 * Sessions and solves, saved in this browser. The shape maps one-to-one to
 * future Supabase tables (sessions, solves); only this provider would change.
 */
type TimerData = {
  sessions: Session[]
  solves: Solve[]
  /** The session in use for each event. */
  active: Partial<Record<TimerEvent, string>>
}

const KEY = 'timer'
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** Load, and make sure every event has an active session from the start. */
function load(): TimerData {
  const raw = storage.get<TimerData>(KEY, { sessions: [], solves: [], active: {} })
  const d: TimerData = { sessions: raw.sessions ?? [], solves: raw.solves ?? [], active: raw.active ?? {} }
  for (const event of TIMER_EVENTS) {
    const ok = d.sessions.some((s) => s.id === d.active[event] && s.event === event)
    if (ok) continue
    const existing = d.sessions.find((s) => s.event === event)
    const session = existing ?? { id: uid(), name: 'Session 1', event, createdAt: new Date().toISOString() }
    if (!existing) d.sessions.push(session)
    d.active[event] = session.id
  }
  return d
}

type Value = {
  data: TimerData
  sessionsFor: (event: TimerEvent) => Session[]
  activeSession: (event: TimerEvent) => Session
  solvesIn: (sessionId: string) => Solve[]
  allSolves: (event?: TimerEvent) => Solve[]
  addSolve: (s: Omit<Solve, 'id' | 'at' | 'sessionId'>) => Solve
  setPenalty: (id: string, penalty: Penalty) => void
  deleteSolve: (id: string) => void
  newSession: (event: TimerEvent, name: string) => void
  selectSession: (event: TimerEvent, id: string) => void
}

const Ctx = createContext<Value | null>(null)

export function TimerStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TimerData>(load)

  const update = useCallback((fn: (d: TimerData) => TimerData) => {
    setData((prev) => {
      const next = fn(prev)
      storage.set(KEY, next)
      return next
    })
  }, [])


  const value = useMemo<Value>(() => {
    const sessionsFor = (event: TimerEvent) => data.sessions.filter((s) => s.event === event)
    // load() guarantees every event has an active session.
    const activeSession = (event: TimerEvent) => data.sessions.find((s) => s.id === data.active[event])!
    return {
      data,
      sessionsFor,
      activeSession,
      solvesIn: (sessionId) => data.solves.filter((s) => s.sessionId === sessionId),
      allSolves: (event) => (event ? data.solves.filter((s) => s.event === event) : data.solves),
      addSolve: (s) => {
        const made: Solve = { ...s, id: uid(), at: new Date().toISOString(), sessionId: activeSession(s.event).id }
        update((d) => ({ ...d, solves: [...d.solves, made] }))
        return made
      },
      setPenalty: (id, penalty) => update((d) => ({ ...d, solves: d.solves.map((x) => (x.id === id ? { ...x, penalty } : x)) })),
      deleteSolve: (id) => update((d) => ({ ...d, solves: d.solves.filter((x) => x.id !== id) })),
      newSession: (event, name) =>
        update((d) => {
          const created: Session = { id: uid(), name, event, createdAt: new Date().toISOString() }
          return { ...d, sessions: [...d.sessions, created], active: { ...d.active, [event]: created.id } }
        }),
      selectSession: (event, id) => update((d) => ({ ...d, active: { ...d.active, [event]: id } })),
    }
  }, [data, update])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimerStore(): Value {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTimerStore must be used inside <TimerStoreProvider>')
  return v
}

// eslint-disable-next-line react-refresh/only-export-components
export { TIMER_EVENTS }

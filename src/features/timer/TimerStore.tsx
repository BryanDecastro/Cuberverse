import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { storage } from '@/lib/storage'
import { enqueue, pendingIds, type Op } from '@/features/sync/cloud'
import { useSync } from '@/features/sync/SyncProvider'
import { TIMER_EVENTS, type Penalty, type Session, type Solve, type TimerEvent } from './types'

/**
 * Sessions and solves. Guests keep them in this browser. Signed-in users keep a
 * local copy (fast and offline-friendly) that is synced to their account in
 * Supabase; times made as a guest on this device join the account at sign-in.
 */
type TimerData = {
  sessions: Session[]
  solves: Solve[]
  /** The session in use for each event. */
  active: Partial<Record<TimerEvent, string>>
}

const GUEST_KEY = 'timer'
const keyFor = (userId: string | null) => (userId ? `timer:${userId}` : GUEST_KEY)
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const EMPTY: TimerData = { sessions: [], solves: [], active: {} }

/** Make sure every event has an active session. Returns the sessions it had to create. */
function ensureActive(d: TimerData): Session[] {
  const created: Session[] = []
  for (const event of TIMER_EVENTS) {
    if (d.sessions.some((s) => s.id === d.active[event] && s.event === event)) continue
    const existing = d.sessions.find((s) => s.event === event)
    const session = existing ?? { id: uid(), name: 'Session 1', event, createdAt: new Date().toISOString() }
    if (!existing) {
      d.sessions.push(session)
      created.push(session)
    }
    d.active[event] = session.id
  }
  return created
}

function load(key: string): TimerData {
  const raw = storage.get<TimerData>(key, EMPTY)
  const d: TimerData = { sessions: raw.sessions ?? [], solves: raw.solves ?? [], active: { ...(raw.active ?? {}) } }
  ensureActive(d)
  return d
}

/**
 * Combine what the account holds with this device's copy:
 * - the account is the reference (a solve deleted on another device stays deleted),
 * - but local changes still queued for upload win over the downloaded copy,
 * - and a guest's times on this device are added to the account (then cleared here).
 */
function mergeWithAccount(userId: string, local: TimerData, cloud: { sessions: Session[]; solves: Solve[]; active: TimerData['active'] | null }) {
  const { upserts, deletes, progress } = pendingIds(userId)
  const ops: Op[] = []
  const sessions = new Map(cloud.sessions.map((s) => [s.id, s]))
  for (const s of local.sessions) if (upserts.has('session:' + s.id)) sessions.set(s.id, s)
  const solves = new Map(cloud.solves.filter((s) => !deletes.has(s.id)).map((s) => [s.id, s]))
  for (const s of local.solves) if (upserts.has('solve:' + s.id)) solves.set(s.id, s)

  // Times recorded on this device before signing in.
  const guest = storage.get<TimerData>(GUEST_KEY, EMPTY)
  if (guest.solves?.length) {
    const used = new Set(guest.solves.map((s) => s.sessionId))
    for (const s of guest.sessions ?? []) {
      if (!used.has(s.id) || sessions.has(s.id)) continue
      sessions.set(s.id, s)
      ops.push({ k: 'session', session: s })
    }
    for (const s of guest.solves) {
      if (solves.has(s.id)) continue
      solves.set(s.id, s)
      ops.push({ k: 'solve', solve: s })
    }
    storage.remove(GUEST_KEY)
  }

  const merged: TimerData = {
    sessions: [...sessions.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    solves: [...solves.values()].sort((a, b) => a.at.localeCompare(b.at)),
    active: { ...(progress.active ?? cloud.active ?? local.active) },
  }
  const created = ensureActive(merged)
  for (const s of created) ops.push({ k: 'session', session: s })
  if (created.length || ops.length || !cloud.active) ops.push({ k: 'progress', active: merged.active })
  return { merged, ops }
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
  const { userId, snapshot } = useSync()
  const key = keyFor(userId)
  const [data, setData] = useState<TimerData>(() => load(key))
  const latest = useRef(data)
  latest.current = data

  // Switch to the right copy when someone signs in or out.
  const loadedKey = useRef(key)
  useEffect(() => {
    if (loadedKey.current === key) return
    loadedKey.current = key
    setData(load(key))
  }, [key])

  // Once the account has been downloaded, merge it in (once per sign-in).
  const mergedFor = useRef<object | null>(null)
  useEffect(() => {
    if (!userId || !snapshot || mergedFor.current === snapshot) return
    mergedFor.current = snapshot
    const { merged, ops } = mergeWithAccount(userId, load(key), snapshot)
    storage.set(key, merged)
    setData(merged)
    enqueue(userId, ops)
  }, [userId, snapshot, key])

  const value = useMemo<Value>(() => {
    const commit = (next: TimerData, ops: Op[]) => {
      storage.set(key, next)
      latest.current = next
      setData(next)
      if (userId) enqueue(userId, ops)
    }
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
        const d = latest.current
        const session = d.sessions.find((x) => x.id === d.active[s.event])!
        const made: Solve = { ...s, id: uid(), at: new Date().toISOString(), sessionId: session.id }
        // The session goes too (idempotent): it may still be a local placeholder.
        commit({ ...d, solves: [...d.solves, made] }, [
          { k: 'session', session },
          { k: 'solve', solve: made },
        ])
        return made
      },
      setPenalty: (id, penalty) => {
        const d = latest.current
        const solves = d.solves.map((x) => (x.id === id ? { ...x, penalty } : x))
        const changed = solves.find((x) => x.id === id)
        commit({ ...d, solves }, changed ? [{ k: 'solve', solve: changed }] : [])
      },
      deleteSolve: (id) => {
        const d = latest.current
        commit({ ...d, solves: d.solves.filter((x) => x.id !== id) }, [{ k: 'deleteSolve', id }])
      },
      newSession: (event, name) => {
        const d = latest.current
        const created: Session = { id: uid(), name, event, createdAt: new Date().toISOString() }
        const active = { ...d.active, [event]: created.id }
        commit({ ...d, sessions: [...d.sessions, created], active }, [
          { k: 'session', session: created },
          { k: 'progress', active },
        ])
      },
      selectSession: (event, id) => {
        const d = latest.current
        const active = { ...d.active, [event]: id }
        commit({ ...d, active }, [{ k: 'progress', active }])
      },
    }
  }, [data, key, userId])

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

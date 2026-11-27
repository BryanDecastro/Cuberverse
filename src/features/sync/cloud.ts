/**
 * Account sync for signed-in users: Timer sessions and solves, lesson progress
 * and the active session per event, stored in Supabase (see
 * supabase/migrations/*_timer_and_progress.sql; row level security keeps each
 * user's rows private).
 *
 * The site always works from a local copy (fast, offline-friendly). Every change
 * is also written to a per-user outbox in localStorage and sent to Supabase in
 * batches; if the network is down, the outbox is retried later, so nothing is lost.
 */
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import type { Session, Solve, TimerEvent } from '@/features/timer/types'

export type LearnData = { completed: string[]; partsReached: Record<string, number> }
export type ActiveSessions = Partial<Record<TimerEvent, string>>

export type Op =
  | { k: 'session'; session: Session }
  | { k: 'solve'; solve: Solve }
  | { k: 'deleteSolve'; id: string }
  | { k: 'progress'; learn?: LearnData; active?: ActiveSessions }

export type CloudSnapshot = {
  sessions: Session[]
  solves: Solve[]
  learn: LearnData | null
  active: ActiveSessions | null
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */
type SessionRow = { id: string; event: string; name: string; created_at: string }
type SolveRow = { id: string; session_id: string; event: string; ms: number; penalty: string; scramble: string; solved_at: string }

const toSession = (r: SessionRow): Session => ({ id: r.id, event: r.event as TimerEvent, name: r.name, createdAt: r.created_at })
const fromSession = (s: Session) => ({ id: s.id, event: s.event, name: s.name.slice(0, 60) || 'Session', created_at: s.createdAt })
const toSolve = (r: SolveRow): Solve => ({
  id: r.id,
  sessionId: r.session_id,
  event: r.event as TimerEvent,
  ms: r.ms,
  penalty: r.penalty as Solve['penalty'],
  scramble: r.scramble,
  at: r.solved_at,
})
const fromSolve = (s: Solve) => ({
  id: s.id,
  session_id: s.sessionId,
  event: s.event,
  ms: Math.max(0, Math.round(s.ms)),
  penalty: s.penalty,
  scramble: s.scramble.slice(0, 1000),
  solved_at: s.at,
})

/* ------------------------------------------------------------------ */
/* Reading the account                                                 */
/* ------------------------------------------------------------------ */
const PAGE = 1000

async function fetchAllRows<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase!.from(table).select(columns).order('id').range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...((data ?? []) as T[]))
    if (!data || data.length < PAGE) return out
  }
}

export async function fetchSnapshot(): Promise<CloudSnapshot> {
  if (!supabase) throw new Error('Supabase is not configured')
  const [sessions, solves, progress] = await Promise.all([
    fetchAllRows<SessionRow>('timer_sessions', 'id,event,name,created_at'),
    fetchAllRows<SolveRow>('timer_solves', 'id,session_id,event,ms,penalty,scramble,solved_at'),
    supabase.from('user_progress').select('learn,active_sessions').maybeSingle(),
  ])
  if (progress.error) throw progress.error
  return {
    sessions: sessions.map(toSession),
    solves: solves.map(toSolve),
    learn: (progress.data?.learn as LearnData | undefined) ?? null,
    active: (progress.data?.active_sessions as ActiveSessions | undefined) ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Outbox                                                              */
/* ------------------------------------------------------------------ */
const outboxKey = (userId: string) => `outbox:${userId}`
const listeners = new Set<() => void>()
let flushing: Promise<void> | null = null

export function pendingOps(userId: string): Op[] {
  return storage.get<Op[]>(outboxKey(userId), [])
}

export function onOutboxChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function saveOutbox(userId: string, ops: Op[]) {
  storage.set(outboxKey(userId), ops)
  listeners.forEach((l) => l())
}

/** Queue changes for the account and try to send them right away. */
export function enqueue(userId: string, ops: Op[]) {
  if (!ops.length) return
  saveOutbox(userId, [...pendingOps(userId), ...ops])
  void flush(userId)
}

/** Ids touched by queued ops (so a fresh download does not undo local changes still on their way). */
export function pendingIds(userId: string) {
  const upserts = new Set<string>()
  const deletes = new Set<string>()
  let progress: { learn?: LearnData; active?: ActiveSessions } = {}
  for (const op of pendingOps(userId)) {
    if (op.k === 'solve') upserts.add('solve:' + op.solve.id)
    else if (op.k === 'session') upserts.add('session:' + op.session.id)
    else if (op.k === 'deleteSolve') deletes.add(op.id)
    else progress = { ...progress, ...(op.learn ? { learn: op.learn } : {}), ...(op.active ? { active: op.active } : {}) }
  }
  return { upserts, deletes, progress }
}

/**
 * Send everything queued, in safe order: sessions, solves, deletions, progress.
 * Upserts are idempotent, so a batch that is retried after a failure never duplicates rows.
 */
export function flush(userId: string): Promise<void> {
  if (!supabase) return Promise.resolve()
  if (flushing) return flushing.then(() => (pendingOps(userId).length ? flush(userId) : undefined))
  flushing = (async () => {
    const batch = pendingOps(userId)
    if (!batch.length) return
    const sessions = new Map<string, ReturnType<typeof fromSession>>()
    const solves = new Map<string, ReturnType<typeof fromSolve>>()
    const deletes = new Set<string>()
    let progress: Record<string, unknown> | null = null
    for (const op of batch) {
      if (op.k === 'session') sessions.set(op.session.id, fromSession(op.session))
      else if (op.k === 'solve') {
        solves.set(op.solve.id, fromSolve(op.solve))
        deletes.delete(op.solve.id)
      } else if (op.k === 'deleteSolve') {
        solves.delete(op.id)
        deletes.add(op.id)
      } else {
        progress = { ...(progress ?? {}), ...(op.learn ? { learn: op.learn } : {}), ...(op.active ? { active_sessions: op.active } : {}) }
      }
    }
    const db = supabase!
    const run = async (p: PromiseLike<{ error: unknown }>) => {
      const { error } = await p
      if (error) throw error
    }
    try {
      if (sessions.size) await run(db.from('timer_sessions').upsert([...sessions.values()], { onConflict: 'user_id,id' }))
      const rows = [...solves.values()]
      for (let i = 0; i < rows.length; i += 500) await run(db.from('timer_solves').upsert(rows.slice(i, i + 500), { onConflict: 'user_id,id' }))
      if (deletes.size) await run(db.from('timer_solves').delete().in('id', [...deletes]))
      if (progress) await run(db.from('user_progress').upsert({ user_id: userId, ...progress }, { onConflict: 'user_id' }))
      // Drop exactly what was sent; anything queued meanwhile stays for the next round.
      saveOutbox(userId, pendingOps(userId).slice(batch.length))
    } catch (err) {
      const e = err as { code?: string; message?: string }
      // A row the database will never accept (bad data) must not block the queue forever.
      if (e?.code && /^(22|23)/.test(e.code)) {
        console.warn('Dropping changes the account rejected', e)
        saveOutbox(userId, pendingOps(userId).slice(batch.length))
      } else {
        console.warn('Account sync will retry later', e?.message ?? err)
      }
    }
  })().finally(() => {
    flushing = null
  })
  return flushing
}

/* ------------------------------------------------------------------ */
/* Retries                                                             */
/* ------------------------------------------------------------------ */
let retryTimer: number | undefined
/** Keep trying while something is queued: when the browser comes back online and every 30 s. */
export function startRetries(userId: string): () => void {
  const tick = () => {
    if (pendingOps(userId).length) void flush(userId)
  }
  window.addEventListener('online', tick)
  retryTimer = window.setInterval(tick, 30_000)
  tick()
  return () => {
    window.removeEventListener('online', tick)
    window.clearInterval(retryTimer)
  }
}

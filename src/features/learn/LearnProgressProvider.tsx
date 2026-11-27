import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { storage } from '@/lib/storage'
import { enqueue, pendingIds } from '@/features/sync/cloud'
import { useSync } from '@/features/sync/SyncProvider'
import { LESSON_IDS, type LessonId } from './lessons'

/**
 * Lesson progress. Guests keep it in this browser; signed-in users keep a local
 * copy synced to their account (Supabase, table user_progress). Progress only
 * ever grows, so combining copies is a simple union: nothing done is ever lost.
 */
export type LearnProgress = {
  completed: LessonId[]
  /** Highest part index reached per lesson (0-based). */
  partsReached: Partial<Record<LessonId, number>>
}

const GUEST_KEY = 'learn-progress'
const keyFor = (userId: string | null) => (userId ? `learn-progress:${userId}` : GUEST_KEY)
const EMPTY: LearnProgress = { completed: [], partsReached: {} }
const isLesson = (id: string): id is LessonId => (LESSON_IDS as readonly string[]).includes(id)

function clean(raw: Partial<{ completed: string[]; partsReached: Record<string, number> }> | null | undefined): LearnProgress {
  const parts: Partial<Record<LessonId, number>> = {}
  for (const [k, v] of Object.entries(raw?.partsReached ?? {})) if (isLesson(k) && Number.isFinite(v)) parts[k] = v
  // Ignore anything that is not a known lesson, in case the course changes.
  return { completed: (raw?.completed ?? []).filter(isLesson), partsReached: parts }
}

const load = (key: string) => clean(storage.get<LearnProgress>(key, EMPTY))

/** Everything completed anywhere, and the furthest part reached anywhere. */
function union(...all: LearnProgress[]): LearnProgress {
  const completed = LESSON_IDS.filter((id) => all.some((p) => p.completed.includes(id)))
  const partsReached: Partial<Record<LessonId, number>> = {}
  for (const id of LESSON_IDS) {
    const best = Math.max(-1, ...all.map((p) => p.partsReached[id] ?? -1))
    if (best >= 0) partsReached[id] = best
  }
  return { completed, partsReached }
}

const same = (a: LearnProgress, b: LearnProgress) => JSON.stringify(a) === JSON.stringify(b)

type Value = {
  progress: LearnProgress
  isCompleted: (id: LessonId) => boolean
  markCompleted: (id: LessonId) => void
  reachPart: (id: LessonId, part: number) => void
  percent: number
}

const Ctx = createContext<Value | null>(null)

export function LearnProgressProvider({ children }: { children: ReactNode }) {
  const { userId, snapshot } = useSync()
  const key = keyFor(userId)
  const [progress, setProgress] = useState<LearnProgress>(() => load(key))
  const latest = useRef(progress)
  latest.current = progress

  // Switch to the right copy when someone signs in or out.
  const loadedKey = useRef(key)
  useEffect(() => {
    if (loadedKey.current === key) return
    loadedKey.current = key
    setProgress(load(key))
  }, [key])

  // After sign-in: combine the account, this device's copy and any guest progress made here.
  const mergedFor = useRef<object | null>(null)
  useEffect(() => {
    if (!userId || !snapshot || mergedFor.current === snapshot) return
    mergedFor.current = snapshot
    const cloud = clean(snapshot.learn)
    const pending = pendingIds(userId).progress.learn
    const guest = load(GUEST_KEY)
    const merged = union(cloud, load(key), guest, ...(pending ? [clean(pending)] : []))
    storage.remove(GUEST_KEY)
    storage.set(key, merged)
    setProgress(merged)
    if (!snapshot.learn || !same(merged, cloud)) enqueue(userId, [{ k: 'progress', learn: merged }])
  }, [userId, snapshot, key])

  const update = useCallback(
    (fn: (p: LearnProgress) => LearnProgress) => {
      const prev = latest.current
      const next = fn(prev)
      if (next === prev) return
      latest.current = next
      storage.set(key, next)
      setProgress(next)
      if (userId) enqueue(userId, [{ k: 'progress', learn: next }])
    },
    [key, userId],
  )

  const markCompleted = useCallback(
    (id: LessonId) => update((p) => (p.completed.includes(id) ? p : { ...p, completed: [...p.completed, id] })),
    [update],
  )

  const reachPart = useCallback(
    (id: LessonId, part: number) =>
      update((p) => ((p.partsReached[id] ?? -1) >= part ? p : { ...p, partsReached: { ...p.partsReached, [id]: part } })),
    [update],
  )

  const value = useMemo<Value>(
    () => ({
      progress,
      isCompleted: (id) => progress.completed.includes(id),
      markCompleted,
      reachPart,
      percent: Math.round((progress.completed.length / LESSON_IDS.length) * 100),
    }),
    [progress, markCompleted, reachPart],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLearnProgress(): Value {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLearnProgress must be used inside <LearnProgressProvider>')
  return v
}

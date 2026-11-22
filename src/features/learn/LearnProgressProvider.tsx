import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { storage } from '@/lib/storage'
import { LESSON_IDS, type LessonId } from './lessons'

/**
 * Lesson progress, saved in this browser. The shape is ready to sync to
 * Supabase later (one row per user: completed lessons + parts reached).
 */
export type LearnProgress = {
  completed: LessonId[]
  /** Highest part index reached per lesson (0-based). */
  partsReached: Partial<Record<LessonId, number>>
}

const KEY = 'learn-progress'
const EMPTY: LearnProgress = { completed: [], partsReached: {} }

function load(): LearnProgress {
  const raw = storage.get<LearnProgress>(KEY, EMPTY)
  // Ignore anything that is not a known lesson, in case the course changes.
  return {
    completed: (raw.completed ?? []).filter((id) => (LESSON_IDS as readonly string[]).includes(id)),
    partsReached: raw.partsReached ?? {},
  }
}

type Value = {
  progress: LearnProgress
  isCompleted: (id: LessonId) => boolean
  markCompleted: (id: LessonId) => void
  reachPart: (id: LessonId, part: number) => void
  percent: number
}

const Ctx = createContext<Value | null>(null)

export function LearnProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<LearnProgress>(load)

  const update = useCallback((fn: (p: LearnProgress) => LearnProgress) => {
    setProgress((prev) => {
      const next = fn(prev)
      if (next !== prev) storage.set(KEY, next)
      return next
    })
  }, [])

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

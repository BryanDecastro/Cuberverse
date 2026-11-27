/**
 * Achievements are worked out from data that already exists (lesson progress
 * and saved solves), so they can never drift out of sync. Only "which ones has
 * the learner already been told about" is stored, to show a toast once.
 */
import { storage } from '@/lib/storage'
import { best } from '@/features/timer/stats'
import type { Solve } from '@/features/timer/types'

export const ACHIEVEMENT_IDS = ['firstLesson', 'firstSolve', 'firstTimed', 'sub60', 'sub30', 'sub20'] as const
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export type AchievementStatus = { id: AchievementId; unlocked: boolean; progress: number }

const SUB: Partial<Record<AchievementId, number>> = { sub60: 60000, sub30: 30000, sub20: 20000 }

export function evaluateAchievements(input: { lessons: string[]; solves: Solve[] }): AchievementStatus[] {
  const best333 = best(input.solves.filter((s) => s.event === '333'))
  return ACHIEVEMENT_IDS.map((id) => {
    if (id === 'firstLesson') return { id, unlocked: input.lessons.includes('notation'), progress: input.lessons.includes('notation') ? 1 : 0 }
    if (id === 'firstSolve') {
      const done = input.lessons.includes('final-solve')
      return { id, unlocked: done, progress: done ? 1 : Math.min(1, input.lessons.length / 7) }
    }
    if (id === 'firstTimed') return { id, unlocked: input.solves.length > 0, progress: input.solves.length > 0 ? 1 : 0 }
    const limit = SUB[id]!
    const unlocked = best333 !== null && best333 < limit
    return { id, unlocked, progress: unlocked ? 1 : best333 === null ? 0 : Math.min(0.99, limit / best333) }
  })
}

const SEEN_KEY = 'achievements-seen'

/** Unlocked achievements the learner has not been shown yet; marks them as shown. */
export function takeNewlyUnlocked(statuses: AchievementStatus[]): AchievementId[] {
  const seen = new Set(storage.get<AchievementId[]>(SEEN_KEY, []))
  const fresh = statuses.filter((s) => s.unlocked && !seen.has(s.id)).map((s) => s.id)
  if (fresh.length) storage.set(SEEN_KEY, [...seen, ...fresh])
  return fresh
}

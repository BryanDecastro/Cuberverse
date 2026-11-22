/**
 * The 3x3 beginner course. Order here is the order shown everywhere.
 * `available: false` lessons are listed but built in a later stage.
 */
export const LESSON_IDS = ['notation', 'white-cross', 'first-layer', 'second-layer', 'yellow-cross', 'yellow-face', 'final-solve'] as const

export type LessonId = (typeof LESSON_IDS)[number]

export const AVAILABLE_LESSONS: ReadonlySet<LessonId> = new Set<LessonId>(['notation', 'white-cross', 'first-layer', 'second-layer', 'yellow-cross', 'yellow-face', 'final-solve'])

export function isLessonId(v: string | undefined): v is LessonId {
  return !!v && (LESSON_IDS as readonly string[]).includes(v)
}

export function lessonPath(id: LessonId): string {
  return `/learn/${id}`
}

/** i18n key for each lesson's title and subtitle (see learn.lessons in en.ts). */
export const LESSON_KEY = {
  notation: 'notation',
  'white-cross': 'whiteCross',
  'first-layer': 'firstLayer',
  'second-layer': 'secondLayer',
  'yellow-cross': 'yellowCross',
  'yellow-face': 'yellowFace',
  'final-solve': 'finalSolve',
} as const satisfies Record<LessonId, string>

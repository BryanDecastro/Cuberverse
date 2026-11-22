import { useI18n } from '@/i18n/I18nProvider'
import { lessonPath } from '../lessons'
import { LessonShell } from '../shell/LessonShell'
import { PartGoal } from './PartGoal'
import { PartDaisy } from './PartDaisy'
import { PartCross } from './PartCross'
import { PartPractice } from './PartPractice'
import { PartQuiz } from './PartQuiz'

const PARTS = [PartGoal, PartDaisy, PartCross, PartPractice]

/** Lesson 2: the white cross, daisy method. */
export function WhiteCrossLesson() {
  const { t } = useI18n()
  const w = t.learn.whiteCross
  return (
    <LessonShell
      lessonId="white-cross"
      parts={w.parts}
      complete={w.complete}
      nextTo={lessonPath('first-layer')}
      renderPart={(i, finish) => {
        if (i < PARTS.length) {
          const Part = PARTS[i]
          return <Part key={i} />
        }
        return <PartQuiz key="quiz" onFinish={finish} />
      }}
    />
  )
}

import { useI18n } from '@/i18n/I18nProvider'
import { lessonPath } from '../lessons'
import { LessonShell } from '../shell/LessonShell'
import { PartFaces } from './PartFaces'
import { PartSymbols } from './PartSymbols'
import { PartPractice } from './PartPractice'
import { PartAlgorithm } from './PartAlgorithm'
import { PartQuiz } from './PartQuiz'

const PARTS = [PartFaces, PartSymbols, PartPractice, PartAlgorithm]

/** Lesson 1: Understanding Cube Notation. */
export function NotationLesson() {
  const { t } = useI18n()
  const n = t.learn.notation
  return (
    <LessonShell
      lessonId="notation"
      parts={n.parts}
      labelsFor={(i) => i === 0}
      complete={n.complete}
      nextTo={lessonPath('white-cross')}
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

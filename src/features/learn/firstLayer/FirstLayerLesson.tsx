import { cornerScramble, isFirstLayerSolved, planFirstLayer, solvedCorners } from '@/features/cube/firstLayer'
import { isCrossSolved, solvedCrossEdges } from '@/features/cube/crossSolver'
import { useI18n } from '@/i18n/I18nProvider'
import { fmt } from '@/lib/format'
import { lessonPath } from '../lessons'
import { LessonShell } from '../shell/LessonShell'
import { PlannerPractice } from '../shell/PlannerPractice'
import { TaskQuiz } from '../shell/TaskQuiz'
import { cornerStepText, WHITE_FOCUS } from './shared'
import { PartGoal } from './PartGoal'
import { PartCorner } from './PartCorner'
import { PartLayer } from './PartLayer'
import { FL_QUIZ_ALIGN, FL_QUIZ_INSERT } from './positions'

function PartPractice() {
  const { t } = useI18n()
  const f = t.learn.firstLayer
  return (
    <PlannerPractice
      makeScramble={() => cornerScramble()}
      plan={planFirstLayer}
      describe={(step) => cornerStepText(t, step)}
      isDone={isFirstLayerSolved}
      status={(s) => [
        { label: fmt(t.learn.whiteCross.crossEdges, { n: solvedCrossEdges(s) }), done: isCrossSolved(s) },
        { label: fmt(f.corners, { n: solvedCorners(s) }), done: solvedCorners(s) === 4 },
      ]}
      copy={f.p4}
    />
  )
}

function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.firstLayer.p5
  return (
    <TaskQuiz
      lead={q.lead}
      idleSetup="x2"
      focus={WHITE_FOCUS}
      onFinish={onFinish}
      exercises={[
        { kind: 'choice', question: q.q1, options: [q.q1options[1], q.q1options[0], q.q1options[2]], correct: q.q1options[0], ok: q.fb.q1ok, no: q.fb.q1no },
        { kind: 'choice', question: q.q2, options: [q.q2options[1], q.q2options[2], q.q2options[0]], correct: q.q2options[0], ok: q.fb.q2ok, no: q.fb.q2no },
        { kind: 'task', question: q.q3, hint: q.q3hint, setup: FL_QUIZ_INSERT, done: isFirstLayerSolved, maxMoves: 4, ok: q.fb.q3ok, no: q.fb.q3no },
        { kind: 'task', question: q.q4, hint: q.q4hint, setup: FL_QUIZ_ALIGN, done: isFirstLayerSolved, maxMoves: 5, ok: q.fb.q4ok, no: q.fb.q4no },
      ]}
    />
  )
}

const PARTS = [PartGoal, PartCorner, PartLayer, PartPractice]

/** Lesson 3: the white corners, completing the first layer. */
export function FirstLayerLesson() {
  const { t } = useI18n()
  const f = t.learn.firstLayer
  return (
    <LessonShell
      lessonId="first-layer"
      parts={f.parts}
      complete={f.complete}
      nextTo={lessonPath('second-layer')}
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

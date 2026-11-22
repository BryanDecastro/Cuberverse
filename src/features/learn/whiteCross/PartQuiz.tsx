import { crossEdgeSolvedOn, isDaisy, petalCount } from '@/features/cube/crossSolver'
import { useI18n } from '@/i18n/I18nProvider'
import { TaskQuiz } from '../shell/TaskQuiz'
import { CROSS_FOCUS } from './shared'
import { WC_CASES, WC_DAISY } from './positions'

export function PartQuiz({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const q = t.learn.whiteCross.p5
  return (
    <TaskQuiz
      lead={q.lead}
      idleSetup="x2"
      focus={CROSS_FOCUS}
      onFinish={onFinish}
      exercises={[
        { kind: 'choice', question: q.q1, options: q.q1options, correct: q.q1options[0], ok: q.fb.q1ok, no: q.fb.q1no },
        {
          kind: 'choice',
          question: q.q2,
          options: [q.q2options[1], q.q2options[0], q.q2options[2]],
          correct: q.q2options[0],
          ok: q.fb.q2ok,
          no: q.fb.q2no,
        },
        {
          kind: 'task',
          question: q.q3,
          hint: q.q3hint,
          setup: WC_DAISY,
          done: (s) => crossEdgeSolvedOn(s, 'F') && petalCount(s) === 3,
          maxMoves: 2,
          ok: q.fb.q3ok,
          no: q.fb.q3no,
        },
        { kind: 'task', question: q.q4, hint: q.q4hint, setup: WC_CASES.bottom.setup, done: isDaisy, maxMoves: 4, ok: q.fb.q4ok, no: q.fb.q4no },
      ]}
    />
  )
}

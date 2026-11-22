import { isCrossSolved, petalCount, planWhiteCross, solvedCrossEdges } from '@/features/cube/crossSolver'
import { applyMoves, solvedState } from '@/features/cube/model'
import { randomSequence, type Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { fmt } from '@/lib/format'
import { PlannerPractice } from '../shell/PlannerPractice'
import { stepText } from './shared'

/** Held yellow-up, then a short random scramble (never one that leaves the cross solved). */
const makeScramble = (): Move[] => {
  for (;;) {
    const m: Move[] = ['x2', ...randomSequence(12)]
    if (!isCrossSolved(applyMoves(solvedState(), m))) return m
  }
}

export function PartPractice() {
  const { t } = useI18n()
  const w = t.learn.whiteCross
  return (
    <PlannerPractice
      makeScramble={makeScramble}
      showScramble
      plan={planWhiteCross}
      describe={(step) => stepText(t, step)}
      isDone={isCrossSolved}
      status={(s) => {
        const solved = isCrossSolved(s)
        return [
          { label: fmt(w.petals, { n: solved ? 4 : petalCount(s) }), done: solved || petalCount(s) === 4 },
          { label: fmt(w.crossEdges, { n: solvedCrossEdges(s) }), done: solved },
        ]
      }}
      copy={w.p4}
    />
  )
}

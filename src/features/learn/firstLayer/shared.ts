import type { CornerStep } from '@/features/cube/firstLayer'
import type { Face } from '@/features/cube/moves'
import type { Dictionary } from '@/i18n/en'
import { fmt } from '@/lib/format'
import { displayMove } from '../notationText'

/** Keep centers and every piece with white in color. */
export const WHITE_FOCUS = (colors: Face[]) => colors.length === 1 || colors.includes('U')

export function cornerStepText(t: Dictionary, step: CornerStep): string {
  const [a, b] = step.colors.map((c) => t.learn.colors[c])
  return fmt(t.learn.firstLayer.steps[step.kind], {
    moves: step.moves.map(displayMove).join(' '),
    a,
    b,
    round: step.round ?? 1,
  })
}

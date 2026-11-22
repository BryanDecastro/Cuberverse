import type { EdgeStep } from '@/features/cube/secondLayer'
import type { Face } from '@/features/cube/moves'
import type { Dictionary } from '@/i18n/en'
import { fmt } from '@/lib/format'
import { displayMove } from '../notationText'

/** 'D' is the yellow color id. Keep centers and every piece without yellow in color. */
export const TWO_LAYER_FOCUS = (colors: Face[]) => colors.length === 1 || !colors.includes('D')

export function edgeStepText(t: Dictionary, step: EdgeStep): string {
  const [a, b] = step.colors.map((c) => t.learn.colors[c])
  return fmt(t.learn.secondLayer.steps[step.kind], { moves: step.moves.map(displayMove).join(' '), a, b })
}

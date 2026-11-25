import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { CubeApi, FaceArrow } from '@/features/cube/CubeScene'
import type { Face, Move } from '@/features/cube/moves'

export type CubeEvents = {
  onMoveStart?: (m: Move) => void
  onMoveEnd?: (m: Move) => void
  onIdle?: () => void
}

export type LessonCube = {
  api: RefObject<CubeApi | null>
  setHighlight: (f: Face | null) => void
  setArrow: (a: FaceArrow | null) => void
  setLabels: (on: boolean) => void
  labels: boolean
  /** Grey out pieces the predicate rejects (null shows every piece). Pass a stable function. */
  setFocus: (f: ((colors: Face[]) => boolean) | null) => void
  /** True once the 3D cube has loaded and its api can be called. */
  ready: boolean
  /**
   * Let the learner turn layers by dragging the cube. The active part registers its move
   * handler; passing the same function again with `null` unregisters only if still current.
   */
  setGesture: (handler: ((m: Move) => void) | null, owner?: (m: Move) => void) => void
  /** Everyone listening to cube events (a part and any players inside it). */
  listeners: RefObject<Set<CubeEvents>>
  slots: { controls: HTMLElement | null; panel: HTMLElement | null }
}

export const LessonCubeContext = createContext<LessonCube | null>(null)

export function useLessonCube(): LessonCube {
  const v = useContext(LessonCubeContext)
  if (!v) throw new Error('useLessonCube must be used inside a lesson')
  return v
}

/** Subscribe to cube events. Several components can listen at once; each always gets its latest handlers. */
export function useCubeEvents(handlers: CubeEvents) {
  const { listeners } = useLessonCube()
  const latest = useRef(handlers)
  latest.current = handlers
  useEffect(() => {
    const entry: CubeEvents = {
      onMoveStart: (m) => latest.current.onMoveStart?.(m),
      onMoveEnd: (m) => latest.current.onMoveEnd?.(m),
      onIdle: () => latest.current.onIdle?.(),
    }
    const set = listeners.current!
    set.add(entry)
    return () => {
      set.delete(entry)
    }
  }, [listeners])
}

/** Render into the area under the cube. */
export function ControlsSlot({ children }: { children: ReactNode }) {
  const { slots } = useLessonCube()
  return slots.controls ? createPortal(children, slots.controls) : null
}

/** Render into the right-hand explanation panel. */
export function PanelSlot({ children }: { children: ReactNode }) {
  const { slots } = useLessonCube()
  return slots.panel ? createPortal(children, slots.panel) : null
}

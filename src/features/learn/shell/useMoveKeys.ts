import { useEffect, useRef } from 'react'
import type { Face, Move } from '@/features/cube/moves'
import { useLessonCube } from './LessonCubeContext'

const KEYS: Record<string, Face> = { r: 'R', l: 'L', u: 'U', d: 'D', f: 'F', b: 'B' }

/**
 * Every way a learner turns the cube by hand, sent to one handler:
 * dragging a layer of the 3D cube (mouse or finger), and R L U D F B on the
 * keyboard (Shift for prime). Ignores typing in fields.
 */
export function useMoveKeys(onMove: (m: Move) => void, enabled = true) {
  const cb = useRef(onMove)
  cb.current = onMove
  const { setGesture } = useLessonCube()
  useEffect(() => {
    if (!enabled) return
    const handler = (m: Move) => cb.current(m)
    setGesture(handler)
    return () => setGesture(null, handler)
  }, [enabled, setGesture])
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      const face = KEYS[e.key.toLowerCase()]
      if (!face) return
      e.preventDefault()
      cb.current((e.shiftKey ? `${face}'` : face) as Move)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

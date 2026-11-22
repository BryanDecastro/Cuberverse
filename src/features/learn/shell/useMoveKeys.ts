import { useEffect, useRef } from 'react'
import type { Face, Move } from '@/features/cube/moves'

const KEYS: Record<string, Face> = { r: 'R', l: 'L', u: 'U', d: 'D', f: 'F', b: 'B' }

/** R L U D F B on the keyboard; Shift gives the prime move. Ignores typing in fields. */
export function useMoveKeys(onMove: (m: Move) => void, enabled = true) {
  const cb = useRef(onMove)
  cb.current = onMove
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

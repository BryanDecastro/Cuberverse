import { useEffect, useRef, useState } from 'react'

/** Toggles true while the element is on screen (or once, when `once`). */
export function useInView<T extends Element>(options: { once?: boolean; rootMargin?: string; threshold?: number } = {}) {
  const { once = false, rootMargin = '0px', threshold = 0.15 } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}

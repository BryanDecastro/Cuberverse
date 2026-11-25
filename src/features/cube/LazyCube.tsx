import { lazy, Suspense, useEffect, useState } from 'react'
import { useInView } from '@/lib/useInView'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { CubeIllustration } from './CubeIllustration'
import type { CubeSceneProps } from './CubeScene'

// Three.js lives in its own chunk, fetched after first paint.
const CubeScene = lazy(() => import('./CubeScene'))

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const on = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}

type Props = Omit<CubeSceneProps, 'active' | 'reducedMotion' | 'className'> & {
  className?: string
  label: string
  /** Stop rendering entirely (for example while a timed solve is running). */
  paused?: boolean
}

/**
 * The 3D cube with everything a page needs around it: poster while loading,
 * SVG fallback without WebGL, rendering paused off screen and on hidden tabs,
 * and reduced motion respected live.
 */
export function LazyCube({ className = '', label, paused = false, ...sceneProps }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '120px', threshold: 0 })
  const pageVisible = usePageVisible()
  const reducedMotion = useReducedMotion()
  const [webgl] = useState(hasWebGL)

  return (
    <div ref={ref} className={`relative ${className}`} role="img" aria-label={label}>
      {webgl ? (
        <Suspense fallback={<CubeIllustration className="absolute inset-0 m-auto h-[70%] w-[70%] opacity-90" />}>
          <CubeScene {...sceneProps} active={inView && pageVisible && !paused} reducedMotion={reducedMotion} className="absolute inset-0" />
        </Suspense>
      ) : (
        <CubeIllustration className="absolute inset-0 m-auto h-[80%] w-[80%]" />
      )}
    </div>
  )
}

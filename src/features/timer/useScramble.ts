import { useCallback, useEffect, useRef, useState } from 'react'
import { randomSequence } from '@/features/cube/moves'
import type { TimerEvent } from './types'

/**
 * WCA random-state scrambles from cubing.js (the same generator family the
 * official TNoodle program uses). cubing.js runs its search in a web worker
 * and is loaded only when the Timer opens. The next scramble is always
 * fetched ahead, so a new one is ready the moment a solve ends.
 */
async function generate(event: TimerEvent): Promise<{ text: string; official: boolean }> {
  try {
    // Production loads public/vendor/cubing (built on its own by scripts/copy-cubing.mjs):
    // bundled with the app, cubing.js's search worker breaks in production builds.
    // The dev server refuses to import files from /public, but serves the package
    // unbundled, where the worker runs fine. The dev branch is dropped from builds.
    const { randomScrambleForEvent } = import.meta.env.DEV
      ? await import('cubing/scramble')
      : ((await import(/* @vite-ignore */ `${import.meta.env.BASE_URL}vendor/cubing/scramble.js`)) as typeof import('cubing/scramble'))
    return { text: (await randomScrambleForEvent(event)).toString(), official: true }
  } catch (err) {
    // Only if cubing.js cannot start (very old browser): a long random-move scramble, clearly marked.
    console.warn('cubing.js scramble failed, using random moves', err)
    const length = event === '222' ? 11 : event === '444' ? 40 : 25
    return { text: randomSequence(length).join(' '), official: false }
  }
}

export function useScramble(event: TimerEvent) {
  const [current, setCurrent] = useState<string | null>(null)
  const [official, setOfficial] = useState(true)
  const next = useRef<Promise<{ text: string; official: boolean }> | null>(null)
  const eventRef = useRef(event)

  const prefetch = useCallback((ev: TimerEvent) => {
    next.current = generate(ev)
  }, [])

  const advance = useCallback(async () => {
    const ev = eventRef.current
    const pending = next.current ?? generate(ev)
    setCurrent(null)
    const res = await pending
    if (eventRef.current !== ev) return // event changed while waiting
    setCurrent(res.text)
    setOfficial(res.official)
    prefetch(ev)
  }, [prefetch])

  useEffect(() => {
    eventRef.current = event
    next.current = null
    void advance()
  }, [event, advance])

  return { scramble: current, official, newScramble: advance }
}

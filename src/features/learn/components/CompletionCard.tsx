import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, RotateCcw } from 'lucide-react'

const BURST = ['#f4f6fb', '#ffc93c', '#e8283d', '#ff7a1a', '#1f6bff', '#19b85a']

export type CompletionCopy = { title: string; text: string; next: string; review: string }

/** Lesson-complete moment: a quiet burst of sticker squares, the message, the next step. */
export function CompletionCard({ copy, nextTo, onReview }: { copy: CompletionCopy; nextTo: string; onReview: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <div className="completion-in relative overflow-hidden rounded-3xl border border-st-yellow/40 bg-gradient-to-br from-[#2a2208] via-panel to-panel p-6 text-center sm:p-8">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="burst-sticker absolute left-1/2 top-[38%] h-3 w-3 rounded-[3px]"
            style={
              {
                background: BURST[i % BURST.length],
                '--a': `${(i / 18) * 360}deg`,
                '--d': `${90 + (i % 3) * 38}px`,
                animationDelay: `${(i % 6) * 30}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <span className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-st-yellow/15 text-st-yellow ring-1 ring-st-yellow/50">
        <Award size={32} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h2 ref={heading} tabIndex={-1} className="relative mx-auto mt-5 max-w-[22ch] font-display text-2xl font-semibold leading-tight tracking-tight outline-none">
        {copy.title}
      </h2>
      <p className="relative mt-2 text-sm text-ink-2">{copy.text}</p>
      <div className="relative mt-6 flex flex-col gap-2.5">
        <Link
          to={nextTo}
          className="btn group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#1fb6e8] px-5 font-display font-semibold text-white shadow-[0_8px_30px_-8px_rgb(47_123_255/0.7)] transition-transform hover:-translate-y-0.5"
        >
          {copy.next}
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onReview} className="btn inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-ink-2 hover:bg-white/5 hover:text-ink">
          <RotateCcw size={15} aria-hidden="true" /> {copy.review}
        </button>
      </div>
    </div>
  )
}

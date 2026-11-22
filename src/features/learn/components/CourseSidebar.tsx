import { Link } from 'react-router-dom'
import { Check, ChevronRight, GraduationCap, Lock, Play } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'
import { cx, fmt } from '@/lib/format'
import { AVAILABLE_LESSONS, LESSON_IDS, LESSON_KEY, lessonPath, type LessonId } from '../lessons'
import { useLearnProgress } from '../LearnProgressProvider'

export function CourseSidebar({ current }: { current: LessonId }) {
  const { t } = useI18n()
  const c = t.learn.course
  const { progress, isCompleted, percent } = useLearnProgress()

  return (
    <nav aria-label={c.title} className="glass rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-[#8fb8ff] ring-1 ring-accent/30">
          <GraduationCap size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-[1.05rem] font-semibold leading-tight">{c.title}</p>
          <p className="text-xs text-ink-3">{c.meta}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-ink-2">{c.progress}</span>
          <span className="text-ink-3">{fmt(c.lessonsDone, { done: progress.completed.length, total: LESSON_IDS.length })}</span>
        </div>
        <div
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/8"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={c.progress}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2f6bff] to-[#22d3ee] transition-[width] duration-700 ease-[var(--ease-out-soft)]"
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>
        <p className="mt-1.5 text-right font-mono text-xs text-ink-3">{percent}%</p>
      </div>

      <ol className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-1 lg:max-xl:grid-cols-2">
        {LESSON_IDS.map((id, i) => {
          const done = isCompleted(id)
          const isCurrent = id === current
          const available = AVAILABLE_LESSONS.has(id)
          const copy = t.learn.lessons[LESSON_KEY[id]]
          return (
            <li key={id}>
              <Link
                to={lessonPath(id)}
                aria-current={isCurrent ? 'page' : undefined}
                className={cx(
                  'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-[background-color,border-color] duration-300',
                  isCurrent ? 'border-accent-hover/70 bg-accent/12 shadow-[0_0_24px_-12px_rgb(47_123_255/0.9)]' : 'border-transparent hover:bg-white/[0.04]',
                )}
              >
                <span
                  className={cx(
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                    done
                      ? 'bg-st-green text-canvas'
                      : isCurrent
                        ? 'bg-accent text-white'
                        : 'border border-line-strong/70 text-ink-3',
                  )}
                >
                  {done ? (
                    <Check size={16} strokeWidth={3} aria-label={c.completed} />
                  ) : isCurrent ? (
                    <Play size={13} fill="currentColor" aria-label={c.current} />
                  ) : available ? (
                    <span className="font-mono text-xs">{i + 1}</span>
                  ) : (
                    <Lock size={13} aria-label={c.soon} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx('block truncate text-[0.92rem] font-semibold', isCurrent || available || done ? 'text-ink' : 'text-ink-2')}>
                    {i + 1}. {copy.title}
                  </span>
                  <span className="block truncate text-xs text-ink-3">{available ? copy.sub : c.soon}</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { Kicker } from '@/components/ui/Kicker'
import { CubeIllustration } from '@/features/cube/CubeIllustration'
import { CourseSidebar } from '@/features/learn/components/CourseSidebar'
import { AVAILABLE_LESSONS, LESSON_IDS, LESSON_KEY, isLessonId, lessonPath, type LessonId } from '@/features/learn/lessons'
import { NotationLesson } from '@/features/learn/notation/NotationLesson'
import { WhiteCrossLesson } from '@/features/learn/whiteCross/WhiteCrossLesson'
import { FirstLayerLesson } from '@/features/learn/firstLayer/FirstLayerLesson'
import { SecondLayerLesson } from '@/features/learn/secondLayer/SecondLayerLesson'
import { YellowCrossLesson } from '@/features/learn/yellowCross/YellowCrossLesson'
import { YellowFaceLesson } from '@/features/learn/yellowFace/YellowFaceLesson'
import { FinalSolveLesson } from '@/features/learn/finalSolve/FinalSolveLesson'
import { useI18n } from '@/i18n/I18nProvider'
import { fmt } from '@/lib/format'

/** Built lessons. Anything else in the course shows the coming-soon panel. */
const LESSON_VIEWS: Partial<Record<LessonId, () => React.JSX.Element>> = {
  notation: NotationLesson,
  'white-cross': WhiteCrossLesson,
  'first-layer': FirstLayerLesson,
  'second-layer': SecondLayerLesson,
  'yellow-cross': YellowCrossLesson,
  'yellow-face': YellowFaceLesson,
  'final-solve': FinalSolveLesson,
}

function LessonComingSoon({ id }: { id: LessonId }) {
  const { t } = useI18n()
  const copy = t.learn.lessons[LESSON_KEY[id]]
  return (
    <section className="glass order-1 grid items-center gap-8 rounded-3xl p-6 sm:p-10 lg:col-span-2 lg:col-start-1 lg:row-start-1 xl:col-start-2 md:grid-cols-[1.2fr_1fr]">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong/60 px-2.5 py-1 text-xs font-semibold text-ink-2">
          <Clock size={13} aria-hidden="true" /> {t.learn.course.soon}
        </span>
        <h2 className="mt-4 font-display text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-tight tracking-tight">{t.learn.placeholder.title}</h2>
        <p className="mt-3 max-w-[44ch] leading-relaxed text-ink-2">
          <strong className="text-ink">{copy.title}.</strong> {t.learn.placeholder.text}
        </p>
        <Link
          to={lessonPath('notation')}
          className="btn mt-7 inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong/80 bg-panel/50 px-5 font-display font-semibold text-ink transition-colors hover:bg-panel-2"
        >
          <ArrowLeft size={18} aria-hidden="true" /> {t.learn.placeholder.back}
        </Link>
      </div>
      <CubeIllustration className="mx-auto hidden w-[75%] md:block" />
    </section>
  )
}

export default function LearnPage() {
  const { lessonId } = useParams()
  const { t } = useI18n()
  if (!isLessonId(lessonId)) return <Navigate to={lessonPath('notation')} replace />

  const copy = t.learn.lessons[LESSON_KEY[lessonId]]
  const index = LESSON_IDS.indexOf(lessonId)
  const intros: Partial<Record<LessonId, string>> = {
    notation: t.learn.notation.intro,
    'white-cross': t.learn.whiteCross.intro,
    'first-layer': t.learn.firstLayer.intro,
    'second-layer': t.learn.secondLayer.intro,
    'yellow-cross': t.learn.yellowCross.intro,
    'yellow-face': t.learn.yellowFace.intro,
    'final-solve': t.learn.finalSolve.intro,
  }
  const intro = intros[lessonId]
  const View = AVAILABLE_LESSONS.has(lessonId) ? LESSON_VIEWS[lessonId] : undefined

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <header className="mb-5 lg:mb-6">
          <Kicker>{t.learn.kicker}</Kicker>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-[1.05] tracking-tight">
            <span className="mr-3 align-middle font-mono text-[0.45em] font-medium text-[#8fb8ff]">
              {fmt(t.learn.lessonOf, { n: index + 1, total: LESSON_IDS.length })}
            </span>
            <span className="block sm:inline">{copy.title}</span>
          </h1>
          {intro && <p className="mt-3 max-w-[64ch] text-ink-2">{intro}</p>}
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] xl:grid-cols-[270px_minmax(0,1fr)_minmax(0,370px)]">
          {View ? <View key={lessonId} /> : <LessonComingSoon id={lessonId} />}
          <div className="order-4 lg:col-span-2 lg:row-start-3 xl:col-span-1 xl:col-start-1 xl:row-span-2 xl:row-start-1">
            <CourseSidebar current={lessonId} />
          </div>
        </div>
      </div>
    </>
  )
}

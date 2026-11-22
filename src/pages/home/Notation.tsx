import { useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Kicker } from '@/components/ui/Kicker'
import { Reveal } from '@/components/ui/Reveal'
import { LazyCube } from '@/features/cube/LazyCube'
import type { CubeApi } from '@/features/cube/CubeScene'
import type { Face, Move } from '@/features/cube/moves'
import { useI18n } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'

const FACE_COLOR: Record<Face, string> = {
  R: '#e8283d',
  L: '#ff7a1a',
  U: '#f4f6fb',
  D: '#ffc93c',
  F: '#19b85a',
  B: '#1f6bff',
}

/** The one interactive moment: tap real notation, watch the real layer turn. */
export function Notation() {
  const { t } = useI18n()
  const n = t.notation
  const api = useRef<CubeApi>(null)
  const [prime, setPrime] = useState(false)
  const [log, setLog] = useState<Move[]>([])

  const turn = (face: Face) => {
    const m = (prime ? `${face}'` : face) as Move
    api.current?.play([m], 'manual')
    setLog((l) => [...l.slice(-9), m])
  }

  return (
    <section aria-labelledby="notation-title" className="relative mx-auto max-w-[1320px] px-4 py-20 sm:px-6 lg:px-8">
      <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.25),transparent_65%)]" aria-hidden="true" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <LazyCube apiRef={api} label={t.hero.cubeLabel} pedestal={false} initialYaw={-0.7} initialPitch={0.45} quarterTurnSeconds={0.26} className="mx-auto aspect-square w-full max-w-[460px]" />
          </Reveal>

          <Reveal className="order-1 lg:order-2" delay={120}>
            <Kicker>{n.kicker}</Kicker>
            <h2 id="notation-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">
              {n.title}
            </h2>
            <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-2">{n.text}</p>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {n.moves.map(({ move, label }) => (
                <button
                  key={move}
                  type="button"
                  onClick={() => turn(move as Face)}
                  className="group flex flex-col items-center gap-1 rounded-2xl border border-line-strong/60 bg-canvas/60 px-2 py-3 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-panel-2 active:scale-95"
                  aria-label={`${move}${prime ? "'" : ''} (${label})`}
                >
                  <span className="flex items-center gap-1.5 font-mono text-xl font-medium text-ink">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: FACE_COLOR[move as Face] }} aria-hidden="true" />
                    {move}
                    {prime && "'"}
                  </span>
                  <span className="text-[0.72rem] text-ink-3">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={prime}
                onClick={() => setPrime((p) => !p)}
                className="btn inline-flex h-10 items-center gap-2.5 rounded-lg border border-line bg-canvas/60 px-3 text-sm text-ink-2 hover:text-ink"
              >
                <span className={cx('relative h-5 w-9 rounded-full transition-colors duration-300', prime ? 'bg-accent' : 'bg-white/15')}>
                  <span className={cx('absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300', prime ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                </span>
                <span className="font-mono">prime (')</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  api.current?.solve()
                  setLog([])
                }}
                className="btn inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 hover:bg-white/5 hover:text-ink"
              >
                <RotateCcw size={15} aria-hidden="true" /> {t.hero.solve}
              </button>
              <p className="min-h-6 font-mono text-sm text-[#8fb8ff]" aria-live="polite">
                {log.join(' ')}
              </p>
            </div>
            <p className="mt-4 text-sm text-ink-3">{n.tryHint}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

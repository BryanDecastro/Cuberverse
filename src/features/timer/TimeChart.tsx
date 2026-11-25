import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { fmt } from '@/lib/format'
import { DNF, best, effective, formatSolve, formatTime, rollingAverage } from './stats'
import type { Solve } from './types'

/**
 * Solve times with the rolling ao5. One y-axis (seconds), two series.
 * Colors validated with the dataviz palette check on the #0c1530 surface:
 * CVD separation 15.0, normal-vision 24.5, both >= 3:1 contrast.
 */
const SINGLE = '#0891b2'
const AO5 = '#7c3aed'
const MAX_POINTS = 50
const H = 220
const PAD = { top: 12, right: 12, bottom: 28, left: 44 }

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(max - min, 1)
  const raw = span / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  // Round outwards on both ends so every point sits inside the axis.
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = start; v <= end + step * 0.001; v += step) out.push(+v.toFixed(6))
  return out
}

export function TimeChart({ solves }: { solves: Solve[] }) {
  const { t } = useI18n()
  const c = t.timer.chart
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(560)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const offset = Math.max(0, solves.length - MAX_POINTS)
  const shown = solves.slice(offset)
  const ao5 = useMemo(() => rollingAverage(solves, 5).slice(offset), [solves, offset])
  const singles = shown.map(effective)

  const finite = [...singles, ...ao5].filter((v): v is number => v !== null && v !== DNF)
  if (shown.length < 2 || finite.length < 2) {
    return (
      <div ref={wrap} className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-line text-center text-sm text-ink-3">
        {c.empty}
      </div>
    )
  }

  const ticks = niceTicks(Math.min(...finite) / 1000, Math.max(...finite) / 1000)
  const yMin = ticks[0] * 1000
  const yMax = ticks[ticks.length - 1] * 1000
  const plotW = width - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (shown.length === 1 ? plotW / 2 : (i / (shown.length - 1)) * plotW)
  const y = (ms: number) => PAD.top + plotH - ((ms - yMin) / (yMax - yMin || 1)) * plotH

  /** Path that breaks at DNFs / missing points instead of drawing through them. */
  const path = (vals: Array<number | null>) => {
    let d = ''
    let pen = false
    vals.forEach((v, i) => {
      if (v === null || v === DNF) {
        pen = false
        return
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      pen = true
    })
    return d
  }

  const xEvery = Math.max(1, Math.ceil(shown.length / 6))
  const bestMs = best(solves)
  const summary = fmt(c.summary, { n: shown.length, best: formatTime(bestMs), latest: formatSolve(shown[shown.length - 1]) })

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * width
    const i = Math.round(((px - PAD.left) / plotW) * (shown.length - 1))
    setHover(Math.max(0, Math.min(shown.length - 1, i)))
  }

  const hv = hover !== null ? { i: hover, single: singles[hover], avg: ao5[hover] } : null

  return (
    <div ref={wrap} className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-ink-2" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full" style={{ background: SINGLE }} />
          <span className="h-2 w-2 -ml-3.5 rounded-full" style={{ background: SINGLE }} />
          {c.single}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full" style={{ background: AO5 }} /> {c.ao5}
        </span>
      </div>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label={summary}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="touch-pan-y"
      >
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tk * 1000)} y2={y(tk * 1000)} stroke="rgb(130 160 255 / 0.12)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tk * 1000)} textAnchor="end" dominantBaseline="middle" className="fill-ink-3 text-[11px]">
              {Number.isInteger(tk) ? tk : tk.toFixed(1)}s
            </text>
          </g>
        ))}
        {shown.map((_, i) =>
          i % xEvery === 0 || i === shown.length - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-3 text-[11px]">
              {offset + i + 1}
            </text>
          ) : null,
        )}
        <path d={path(ao5)} fill="none" stroke={AO5} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={path(singles)} fill="none" stroke={SINGLE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {singles.map((v, i) =>
          v === DNF ? null : <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={SINGLE} stroke="#0c1530" strokeWidth={2} />,
        )}
        {hv && (
          <g pointerEvents="none">
            <line x1={x(hv.i)} x2={x(hv.i)} y1={PAD.top} y2={PAD.top + plotH} stroke="rgb(238 242 255 / 0.35)" strokeWidth={1} />
            {hv.single !== DNF && <circle cx={x(hv.i)} cy={y(hv.single)} r={6} fill={SINGLE} stroke="#eef2ff" strokeWidth={2} />}
            {hv.avg !== null && hv.avg !== DNF && <circle cx={x(hv.i)} cy={y(hv.avg)} r={5} fill={AO5} stroke="#eef2ff" strokeWidth={2} />}
          </g>
        )}
      </svg>
      {hv && (
        <div
          className="pointer-events-none absolute top-8 z-10 rounded-xl border border-line-strong/70 bg-canvas/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(Math.max(x(hv.i) + 12, 0), width - 150) }}
          role="status"
        >
          <p className="font-mono text-ink-3">#{offset + hv.i + 1}</p>
          <p className="mt-1 flex items-center gap-2 text-ink">
            <span className="h-2 w-2 rounded-full" style={{ background: SINGLE }} aria-hidden="true" />
            {c.single}: <span className="font-mono font-semibold">{formatSolve(shown[hv.i])}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-ink">
            <span className="h-2 w-2 rounded-full" style={{ background: AO5 }} aria-hidden="true" />
            {c.ao5}: <span className="font-mono font-semibold">{formatTime(hv.avg, 'average')}</span>
          </p>
        </div>
      )}
    </div>
  )
}

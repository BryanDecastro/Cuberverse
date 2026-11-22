import { Link } from 'react-router-dom'
import { routes } from '@/config/routes'

/** The brand mark: a 2x2 cube face in four sticker colors. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#070b1a" stroke="rgb(130 160 255 / 0.25)" />
      <rect x="6" y="6" width="9" height="9" rx="2.4" fill="#1f6bff" />
      <rect x="17" y="6" width="9" height="9" rx="2.4" fill="#ffc93c" />
      <rect x="6" y="17" width="9" height="9" rx="2.4" fill="#19b85a" />
      <rect x="17" y="17" width="9" height="9" rx="2.4" fill="#e8283d" />
    </svg>
  )
}

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to={routes.home} onClick={onClick} className="group inline-flex items-center gap-2.5" aria-label="CubeVerse home">
      <span className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-90">
        <LogoMark />
      </span>
      <span className="font-display text-[1.32rem] font-semibold tracking-tight text-ink">
        Cube<span className="text-[#5b9dff]">Verse</span>
      </span>
    </Link>
  )
}

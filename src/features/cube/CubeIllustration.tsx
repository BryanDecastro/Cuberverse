/**
 * Static isometric cube: the poster shown while the 3D scene loads,
 * and the permanent fallback when WebGL is unavailable.
 */
const TOP = ['#f4f6fb', '#f4f6fb', '#f4f6fb', '#f4f6fb', '#f4f6fb', '#f4f6fb', '#f4f6fb', '#f4f6fb', '#f4f6fb']
const LEFT = ['#19b85a', '#19b85a', '#19b85a', '#19b85a', '#19b85a', '#19b85a', '#19b85a', '#19b85a', '#19b85a']
const RIGHT = ['#e8283d', '#e8283d', '#e8283d', '#e8283d', '#e8283d', '#e8283d', '#e8283d', '#e8283d', '#e8283d']

// Isometric basis
const ux = [0.866, 0.5]
const uy = [-0.866, 0.5]
const S = 34

function quad(o: [number, number], a: number[], b: number[], i: number, j: number, inset = 0.09) {
  const p = (u: number, v: number) => [o[0] + (a[0] * u + b[0] * v) * S, o[1] + (a[1] * u + b[1] * v) * S]
  const pts = [p(i + inset, j + inset), p(i + 1 - inset, j + inset), p(i + 1 - inset, j + 1 - inset), p(i + inset, j + 1 - inset)]
  return pts.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' ')
}

export function CubeIllustration({ className }: { className?: string }) {
  const cx = 160
  const top: [number, number] = [cx, 40]
  const down = [0, 1]
  return (
    <svg viewBox="0 0 320 340" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ci-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3d7bff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3d7bff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={300} rx={130} ry={26} fill="url(#ci-glow)" />
      <ellipse cx={cx} cy={300} rx={100} ry={18} fill="none" stroke="#5aa8ff" strokeWidth="1.5" />
      {/* body */}
      <polygon
        points={`${cx},34 ${cx + 3 * 0.866 * S + 6},${40 + 1.5 * S - 3} ${cx + 3 * 0.866 * S + 6},${40 + 4.5 * S + 3} ${cx},${40 + 6 * S + 6} ${cx - 3 * 0.866 * S - 6},${40 + 4.5 * S + 3} ${cx - 3 * 0.866 * S - 6},${40 + 1.5 * S - 3}`}
        fill="#07080e"
      />
      {TOP.map((c, n) => (
        <polygon key={`t${n}`} points={quad(top, ux, uy, n % 3, Math.floor(n / 3))} fill={c} />
      ))}
      {LEFT.map((c, n) => (
        <polygon key={`l${n}`} points={quad([cx - 3 * 0.866 * S, 40 + 1.5 * S], [0.866, 0.5], down, n % 3, Math.floor(n / 3))} fill={c} />
      ))}
      {RIGHT.map((c, n) => (
        <polygon key={`r${n}`} points={quad([cx, 40 + 3 * S], [0.866, -0.5], down, n % 3, Math.floor(n / 3))} fill={c} />
      ))}
    </svg>
  )
}

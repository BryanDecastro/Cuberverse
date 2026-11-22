/** One fixed environment behind every page: drifting glows, a faint grid, grain. */
export function EnvironmentBackground() {
  return (
    <div className="env-bg" aria-hidden="true">
      <div
        className="glow animate-drift-a"
        style={{ width: '60vw', height: '60vw', left: '-15vw', top: '-20vw', background: 'radial-gradient(circle, rgb(37 99 235 / 0.28), transparent 65%)', animationDelay: '-20s' }}
      />
      <div
        className="glow animate-drift-b"
        style={{ width: '50vw', height: '50vw', right: '-18vw', top: '10vh', background: 'radial-gradient(circle, rgb(124 58 237 / 0.2), transparent 65%)', animationDelay: '-35s' }}
      />
      <div
        className="glow animate-drift-a"
        style={{ width: '45vw', height: '45vw', left: '30vw', bottom: '-25vw', background: 'radial-gradient(circle, rgb(34 211 238 / 0.1), transparent 65%)', animationDelay: '-50s' }}
      />
      <div className="grid" />
      <div className="grain" />
    </div>
  )
}

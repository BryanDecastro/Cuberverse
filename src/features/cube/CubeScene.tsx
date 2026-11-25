import { useEffect, useImperativeHandle, useMemo, useRef, type MutableRefObject, type Ref } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { invertSequence, moveGeometry, randomSequence, type Face, type Move } from './moves'
import { slotKey, type Vec3 } from './model'

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
export type SequenceKind = 'scramble' | 'solve' | 'manual'

export type ViewTarget = Face | 'home'

/** Direction arrow drawn on a face: 1 clockwise, -1 counterclockwise, 2 half turn. */
export type FaceArrow = { face: Face; dir: 1 | -1 | 2 }

export type CubeApi = {
  /** Queue moves. Real geometry turns, so every state shown is legal. Moves run strictly in order. */
  play: (moves: Move[], kind?: SequenceKind) => void
  /** Scramble with a fresh random sequence. */
  scramble: (length?: number) => void
  /** Undo everything applied since solved. */
  solve: () => void
  /** Stop the idle demo loop (called on first user interaction). */
  stopAutoplay: () => void
  /** Instantly return to solved: cancels the queue and any turn in flight. */
  reset: () => void
  /** Instantly show the solved cube with these moves applied (no animation). Cancels anything in flight. */
  setState: (moves: Move[]) => void
  /** Turn speed multiplier (0.5, 1, 2...). */
  setSpeed: (multiplier: number) => void
  /** Move the CAMERA (never the pieces) to look straight at a face, or back home. */
  lookAt: (target: ViewTarget) => void
  /** Nudge the camera by radians. */
  orbit: (dYaw: number, dPitch: number) => void
  /** Ease the camera to an exact yaw/pitch (shortest way round). */
  setView: (yaw: number, pitch: number) => void
  /** True while a turn is animating or queued. */
  isBusy: () => boolean
  /** Sticker colors read back from the 3D geometry (slot key -> color). Valid when idle. */
  readState: () => Record<string, Face>
}

export type CubeSceneProps = {
  apiRef?: Ref<CubeApi>
  autoplay?: boolean
  reducedMotion?: boolean
  /** Pause rendering entirely (off screen, hidden tab). */
  active?: boolean
  onSequence?: (seq: Move[], kind: SequenceKind) => void
  onStep?: (index: number) => void
  onMoveStart?: (move: Move) => void
  onMoveEnd?: (move: Move) => void
  /** Fired when the last queued move finishes. */
  onIdle?: () => void
  /** Fired once the cube is mounted and the api is usable. */
  onReady?: () => void
  className?: string
  /** Show the glowing pedestal ring. */
  pedestal?: boolean
  initialYaw?: number
  initialPitch?: number
  quarterTurnSeconds?: number
  /** Slow automatic camera drift when nobody is dragging. */
  idleSpin?: boolean
  /** Glow one face (the face's fixed position, whatever pieces sit there). */
  highlight?: Face | null
  /** Floating R L U D F B letters next to each face. */
  labels?: boolean
  arrow?: FaceArrow | null
  /** Drag limits for camera pitch, radians. */
  pitchRange?: [number, number]
  /** Grey out every piece the predicate rejects (it receives the piece's own sticker colors). */
  focus?: ((colors: Face[]) => boolean) | null
  /**
   * Turn layers by dragging. When set, a drag that starts on the cube is read as a
   * face turn (mouse or finger) and reported here; the caller decides whether to play it.
   * A drag that starts beside the cube still moves the camera.
   */
  onGesture?: ((move: Move) => void) | null
}

/* ------------------------------------------------------------------ */
/* Materials and geometry, shared by every cubie                       */
/* ------------------------------------------------------------------ */
export const STICKER_HEX: Record<Face, string> = {
  U: '#f4f6fb', // white
  D: '#ffc93c', // yellow
  F: '#19b85a', // green
  B: '#1f6bff', // blue
  R: '#e8283d', // red
  L: '#ff7a1a', // orange
}

function roundedRectPath(shape: THREE.Shape | THREE.Path, size: number, radius: number) {
  const s = size / 2
  const r = radius
  shape.moveTo(-s + r, -s)
  shape.lineTo(s - r, -s)
  shape.quadraticCurveTo(s, -s, s, -s + r)
  shape.lineTo(s, s - r)
  shape.quadraticCurveTo(s, s, s - r, s)
  shape.lineTo(-s + r, s)
  shape.quadraticCurveTo(-s, s, -s, s - r)
  shape.lineTo(-s, -s + r)
  shape.quadraticCurveTo(-s, -s, -s + r, -s)
}

function roundedSquare(size: number, radius: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape()
  roundedRectPath(shape, size, radius)
  return new THREE.ShapeGeometry(shape, 6)
}

function useCubeAssets() {
  return useMemo(() => {
    const body = new RoundedBoxGeometry(0.97, 0.97, 0.97, 3, 0.12)
    const sticker = roundedSquare(0.8, 0.13)
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#07080e', roughness: 0.42, metalness: 0.1 })
    const stickerMats = Object.fromEntries(
      (Object.keys(STICKER_HEX) as Face[]).map((f) => [
        f,
        new THREE.MeshPhysicalMaterial({
          color: STICKER_HEX[f],
          roughness: 0.28,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.18,
          emissive: STICKER_HEX[f],
          emissiveIntensity: 0.2,
        }),
      ]),
    ) as Record<Face, THREE.MeshPhysicalMaterial>
    return { body, sticker, bodyMat, stickerMats }
  }, [])
}

/** Sticker placement per outward face: normal axis/sign and the plane's rotation. */
const STICKER_FACES: Array<{ face: Face; axis: 0 | 1 | 2; sign: 1 | -1; rot: [number, number, number] }> = [
  { face: 'R', axis: 0, sign: 1, rot: [0, Math.PI / 2, 0] },
  { face: 'L', axis: 0, sign: -1, rot: [0, -Math.PI / 2, 0] },
  { face: 'U', axis: 1, sign: 1, rot: [-Math.PI / 2, 0, 0] },
  { face: 'D', axis: 1, sign: -1, rot: [Math.PI / 2, 0, 0] },
  { face: 'F', axis: 2, sign: 1, rot: [0, 0, 0] },
  { face: 'B', axis: 2, sign: -1, rot: [0, Math.PI, 0] },
]
const FACE_PLACEMENT = Object.fromEntries(STICKER_FACES.map((s) => [s.face, s])) as Record<Face, (typeof STICKER_FACES)[number]>

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Snap a cubie's rotation matrix to exact quarter turns so float error never accumulates. */
function snapCubie(obj: THREE.Object3D) {
  obj.position.set(Math.round(obj.position.x), Math.round(obj.position.y), Math.round(obj.position.z))
  const m = new THREE.Matrix4().makeRotationFromQuaternion(obj.quaternion)
  const e = m.elements
  for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) e[i] = Math.round(e[i])
  obj.quaternion.setFromRotationMatrix(m)
}

/** Merge a move into a history stack (R then R becomes R2, R then R' cancels). */
function pushMerged(history: Move[], m: Move) {
  const last = history[history.length - 1]
  if (last && last[0] === m[0]) {
    const q = (mv: Move) => (mv.endsWith('2') ? 2 : mv.endsWith("'") ? 3 : 1)
    const total = (q(last) + q(m)) % 4
    history.pop()
    if (total === 0) return
    const face = m[0]
    history.push((total === 1 ? face : total === 2 ? `${face}2` : `${face}'`) as Move)
    return
  }
  history.push(m)
}

/* ------------------------------------------------------------------ */
/* Camera (view) model, kept apart from piece turns on purpose         */
/* ------------------------------------------------------------------ */
type View = { yaw: number; pitch: number; targetYaw: number; targetPitch: number; dragging: boolean }

/** A drag that started on the cube: where it started, and the hit point in cube coordinates. */
type Grab = { id: number; x: number; y: number; point: THREE.Vector3; done: boolean }
type Gesture = {
  grab: Grab | null
  /** Set by the cube: turns a screen drag (px) from the grab into a move, or null (middle slice). */
  resolve: ((g: Grab, dx: number, dy: number) => Move | null) | null
}

const FACE_ON_AXIS: Record<0 | 1 | 2, [Face, Face]> = { 0: ['R', 'L'], 1: ['U', 'D'], 2: ['F', 'B'] }

/**
 * The move a drag means. `point` is where the drag started, in cube coordinates
 * (cubies at -1..1, faces at about +-1.5); `along` is the in-plane axis the drag
 * follows and `sign` its direction. Pure, so it is unit-tested.
 */
export function gestureMove(point: Vec3, along: 0 | 1 | 2, sign: 1 | -1): Move | null {
  const abs = point.map(Math.abs)
  const k = (abs[0] >= abs[1] && abs[0] >= abs[2] ? 0 : abs[1] >= abs[2] ? 1 : 2) as 0 | 1 | 2
  if (along === k) return null
  const n: Vec3 = [0, 0, 0]
  n[k] = Math.sign(point[k]) || 1
  const tv: Vec3 = [0, 0, 0]
  tv[along] = sign
  // Turning about r = n x t moves the grabbed sticker along t.
  const r: Vec3 = [n[1] * tv[2] - n[2] * tv[1], n[2] * tv[0] - n[0] * tv[2], n[0] * tv[1] - n[1] * tv[0]]
  const j = ([0, 1, 2] as const).find((i) => r[i] !== 0)!
  const sigma = r[j]
  const layer = Math.max(-1, Math.min(1, Math.round(point[j])))
  if (layer === 0) return null // middle slices are not part of this notation
  const face = FACE_ON_AXIS[j][layer > 0 ? 0 : 1]
  // A face's clockwise turn is a negative rotation about its outward axis.
  return (sigma === -layer ? face : `${face}'`) as Move
}

const HOME_YAW = -0.62
const HOME_PITCH = 0.52

/** Yaw/pitch that put a face straight toward the camera. */
const FACE_VIEW: Record<Face, { yaw: number; pitch: number }> = {
  F: { yaw: 0, pitch: 0 },
  R: { yaw: -Math.PI / 2, pitch: 0 },
  B: { yaw: Math.PI, pitch: 0 },
  L: { yaw: Math.PI / 2, pitch: 0 },
  U: { yaw: 0, pitch: Math.PI / 2 },
  D: { yaw: 0, pitch: -Math.PI / 2 },
}

/** The equivalent of `target` (mod 2π) closest to `current`, so the camera never takes the long way. */
function nearestAngle(current: number, target: number) {
  const tau = Math.PI * 2
  return target + tau * Math.round((current - target) / tau)
}

/* ------------------------------------------------------------------ */
/* Overlays: face glow, direction arrow, floating letters              */
/* ------------------------------------------------------------------ */
function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function useOverlayTextures() {
  return useMemo(() => {
    const glow = canvasTexture(256, (g, s) => {
      const pad = 10
      const r = 34
      g.beginPath()
      g.roundRect(pad, pad, s - pad * 2, s - pad * 2, r)
      g.fillStyle = 'rgba(80,170,255,0.18)'
      g.fill()
      g.lineWidth = 9
      g.strokeStyle = 'rgba(120,200,255,0.95)'
      g.shadowColor = 'rgba(60,160,255,1)'
      g.shadowBlur = 18
      g.stroke()
    })
    const arrow = (dir: 1 | -1 | 2) =>
      canvasTexture(256, (g, s) => {
        const c = s / 2
        const R = s * 0.33
        // Canvas y points down, so a positive sweep reads clockwise on screen.
        const start = -Math.PI * 0.85
        const sweep = dir === 2 ? Math.PI * 1.05 : Math.PI * 1.45
        const end = start + sweep
        g.lineCap = 'round'
        g.lineWidth = 16
        g.strokeStyle = '#ffffff'
        g.shadowColor = 'rgba(0,0,0,0.65)'
        g.shadowBlur = 10
        g.beginPath()
        g.arc(c, c, R, start, end)
        g.stroke()
        const tip = (angle: number, sgn: 1 | -1) => {
          const x = c + R * Math.cos(angle)
          const y = c + R * Math.sin(angle)
          // Tangent pointing along the direction of travel.
          const tx = -Math.sin(angle) * sgn
          const ty = Math.cos(angle) * sgn
          const nx = Math.cos(angle)
          const ny = Math.sin(angle)
          const L = 34
          const W = 22
          g.beginPath()
          g.moveTo(x + tx * L, y + ty * L)
          g.lineTo(x + nx * W, y + ny * W)
          g.lineTo(x - nx * W, y - ny * W)
          g.closePath()
          g.fillStyle = '#ffffff'
          g.fill()
        }
        tip(end, 1)
        if (dir === 2) {
          g.shadowBlur = 0
          g.font = `700 ${s * 0.17}px Sora, system-ui, sans-serif`
          g.fillStyle = '#ffffff'
          g.textAlign = 'center'
          g.textBaseline = 'middle'
          g.fillText('180°', c, c + R * 0.2)
        }
      })
    const cw = arrow(1)
    const half = arrow(2)
    const label = (face: Face) =>
      canvasTexture(128, (g, s) => {
        const c = s / 2
        g.beginPath()
        g.arc(c, c, s * 0.42, 0, Math.PI * 2)
        g.fillStyle = 'rgba(8,13,32,0.88)'
        g.fill()
        g.lineWidth = 7
        g.strokeStyle = STICKER_HEX[face]
        g.stroke()
        g.font = `700 ${s * 0.46}px Sora, system-ui, sans-serif`
        g.fillStyle = '#ffffff'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(face, c, c + s * 0.03)
      })
    const labels = Object.fromEntries((['R', 'L', 'U', 'D', 'F', 'B'] as Face[]).map((f) => [f, label(f)])) as Record<Face, THREE.CanvasTexture>
    return { glow, cw, half, labels }
  }, [])
}

function Overlays({ highlight, labels, arrow }: { highlight: Face | null; labels: boolean; arrow: FaceArrow | null }) {
  const tex = useOverlayTextures()
  const glowMats = useRef<Partial<Record<Face, THREE.MeshBasicMaterial>>>({})
  const labelRefs = useRef<Partial<Record<Face, THREE.Sprite>>>({})
  const arrowMat = useRef<THREE.MeshBasicMaterial>(null)
  const clock = useRef(0)

  useFrame((_, d) => {
    clock.current += Math.min(d, 0.25)
    const k = 1 - Math.exp(-Math.min(d, 0.25) * 10)
    for (const s of STICKER_FACES) {
      const m = glowMats.current[s.face]
      if (m) {
        const target = highlight === s.face ? 0.78 + 0.22 * Math.sin(clock.current * 3.2) : 0
        m.opacity += (target - m.opacity) * k
        m.visible = m.opacity > 0.01
      }
      const spr = labelRefs.current[s.face]
      if (spr) {
        const on = highlight === s.face
        const targetScale = labels ? (on ? 0.78 : 0.56) : 0.001
        const sc = spr.scale.x + (targetScale - spr.scale.x) * k
        spr.scale.set(sc, sc, 1)
        const mat = spr.material as THREE.SpriteMaterial
        const tOp = labels ? (highlight && !on ? 0.45 : 1) : 0
        mat.opacity += (tOp - mat.opacity) * k
        spr.visible = mat.opacity > 0.01
      }
    }
    if (arrowMat.current) {
      const target = arrow ? 1 : 0
      arrowMat.current.opacity += (target - arrowMat.current.opacity) * k
    }
  })

  const arrowPlacement = arrow ? FACE_PLACEMENT[arrow.face] : null

  return (
    <group>
      {STICKER_FACES.map((s) => {
        const p: Vec3 = [0, 0, 0]
        p[s.axis] = s.sign * 1.5
        const lp: Vec3 = [0, 0, 0]
        lp[s.axis] = s.sign * 2.25
        return (
          <group key={s.face}>
            <mesh position={p} rotation={s.rot} renderOrder={2}>
              <planeGeometry args={[3.05, 3.05]} />
              <meshBasicMaterial
                ref={(m) => {
                  if (m) glowMats.current[s.face] = m
                }}
                map={tex.glow}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <sprite
              position={lp}
              scale={[0.001, 0.001, 1]}
              ref={(spr) => {
                if (spr) labelRefs.current[s.face] = spr
              }}
              renderOrder={3}
            >
              <spriteMaterial map={tex.labels[s.face]} transparent opacity={0} depthWrite={false} toneMapped={false} />
            </sprite>
          </group>
        )
      })}
      {arrowPlacement && arrow && (
        <mesh
          position={[0, 1, 2].map((k) => (k === arrowPlacement.axis ? arrowPlacement.sign * 1.53 : 0)) as Vec3}
          rotation={arrowPlacement.rot}
          // Mirror the clockwise texture for a counterclockwise arrow.
          scale={[arrow.dir === -1 ? -1 : 1, 1, 1]}
          renderOrder={4}
        >
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial
            ref={arrowMat}
            map={arrow.dir === 2 ? tex.half : tex.cw}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* The cube                                                            */
/* ------------------------------------------------------------------ */
type Turn = { move: Move; axis: 'x' | 'y' | 'z'; target: number; t: number; duration: number }

type CubeProps = Required<Pick<CubeSceneProps, 'autoplay' | 'reducedMotion' | 'quarterTurnSeconds' | 'idleSpin'>> &
  Pick<CubeSceneProps, 'apiRef' | 'onSequence' | 'onStep' | 'onMoveStart' | 'onMoveEnd' | 'onIdle' | 'onReady' | 'highlight' | 'labels' | 'arrow' | 'focus'> & {
    view: MutableRefObject<View>
    gesture: MutableRefObject<Gesture>
    gestures: boolean
  }

function Cube({
  apiRef,
  autoplay,
  reducedMotion,
  onSequence,
  onStep,
  onMoveStart,
  onMoveEnd,
  onIdle,
  onReady,
  view,
  quarterTurnSeconds,
  idleSpin,
  highlight = null,
  labels = false,
  arrow = null,
  focus = null,
  gesture,
  gestures,
}: CubeProps) {
  const { body, sticker, bodyMat, stickerMats } = useCubeAssets()
  const { camera, size } = useThree()
  const spin = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const pivot = useRef<THREE.Group>(null)
  const cubies = useRef<THREE.Group[]>([])

  const queue = useRef<Move[]>([])
  const seqIndex = useRef(0)
  const turn = useRef<Turn | null>(null)
  const history = useRef<Move[]>([])
  const autoplayOn = useRef(autoplay)
  const idleFor = useRef(0)
  const speed = useRef(1)

  useEffect(() => {
    autoplayOn.current = autoplay
  }, [autoplay])

  const positions = useMemo(() => {
    const list: [number, number, number][] = []
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) if (x || y || z) list.push([x, y, z])
    return list
  }, [])

  const startSequence = (moves: Move[], kind: SequenceKind) => {
    if (!moves.length) return
    queue.current = [...moves]
    seqIndex.current = 0
    onSequence?.(moves, kind)
  }

  /** Solved, nothing queued, nothing turning. */
  const resetAll = () => {
    queue.current = []
    history.current = []
    turn.current = null
    idleFor.current = 0
    if (pivot.current && root.current) {
      for (const c of [...pivot.current.children]) root.current.add(c)
      pivot.current.rotation.set(0, 0, 0)
    }
    cubies.current.forEach((c, i) => {
      c.position.set(...positions[i])
      c.quaternion.identity()
    })
  }

  /** Apply one move immediately, with the same geometry and snapping as an animated turn. */
  const turnInstant = (move: Move) => {
    if (!pivot.current || !root.current) return
    const { axis, layer, quarters } = moveGeometry(move)
    pivot.current.rotation.set(0, 0, 0)
    pivot.current.updateMatrixWorld()
    for (const c of cubies.current) {
      if (layer === 'all' || Math.round(c.position[axis]) === layer) pivot.current.attach(c)
    }
    pivot.current.rotation[axis] = (quarters * Math.PI) / 2
    pivot.current.updateMatrixWorld()
    for (const c of [...pivot.current.children]) {
      root.current.attach(c)
      snapCubie(c)
    }
    pivot.current.rotation.set(0, 0, 0)
    pushMerged(history.current, move)
  }

  // Grey out pieces outside the focus, so a step shows only what matters.
  const dimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a3147', roughness: 0.55, metalness: 0.05 }), [])
  useEffect(() => {
    for (const c of cubies.current) {
      const stickers = c.children.filter((ch) => ch.userData.face) as THREE.Mesh[]
      const colors = stickers.map((s) => s.userData.face as Face)
      const keep = !focus || focus(colors)
      for (const s of stickers) s.material = keep ? stickerMats[s.userData.face as Face] : dimMat
    }
  }, [focus, stickerMats, dimMat])

  // The api handle is attached before effects run, so it is safe to announce now.
  useEffect(() => {
    onReady?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(apiRef, () => ({
    play: (moves, kind = 'manual') => {
      // Manual taps append so quick taps all register, in order.
      if (kind === 'manual' && (queue.current.length || turn.current)) {
        queue.current.push(...moves)
        return
      }
      startSequence(moves, kind)
    },
    scramble: (length = 12) => startSequence(randomSequence(length), 'scramble'),
    solve: () => {
      // Include the turn in flight: it lands in history before the solve starts.
      const applied = turn.current ? [...history.current, turn.current.move] : history.current
      startSequence(invertSequence(applied), 'solve')
    },
    stopAutoplay: () => {
      autoplayOn.current = false
    },
    setState: (moves) => {
      resetAll()
      for (const m of moves) turnInstant(m)
    },
    reset: () => resetAll(),
    setSpeed: (m) => {
      speed.current = Math.max(0.1, m)
    },
    lookAt: (target) => {
      const v = view.current
      const goal = target === 'home' ? { yaw: HOME_YAW, pitch: HOME_PITCH } : FACE_VIEW[target]
      v.targetYaw = nearestAngle(v.yaw, goal.yaw)
      v.targetPitch = goal.pitch
    },
    orbit: (dYaw, dPitch) => {
      const v = view.current
      v.targetYaw += dYaw
      v.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, v.targetPitch + dPitch))
    },
    setView: (yaw, pitch) => {
      const v = view.current
      v.targetYaw = nearestAngle(v.yaw, yaw)
      v.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))
    },
    isBusy: () => !!turn.current || queue.current.length > 0,
    readState: () => {
      const out: Record<string, Face> = {}
      const n = new THREE.Vector3()
      for (const c of cubies.current) {
        const pos = [c.position.x, c.position.y, c.position.z].map(Math.round) as Vec3
        for (const child of c.children) {
          const face = child.userData.face as Face | undefined
          if (!face) continue
          const local = child.userData.normal as Vec3
          n.set(...local).applyQuaternion(c.quaternion)
          const normal = [n.x, n.y, n.z].map((v) => Math.round(v) + 0) as Vec3
          out[slotKey(pos, normal)] = face
        }
      }
      return out
    },
  }))

  useFrame((_, rawDelta) => {
    // Real time, so slow devices keep the same pace (just fewer frames).
    // Capped only to absorb the jump after rendering resumes.
    const delta = Math.min(rawDelta, 0.25)
    const v = view.current

    // View: optional idle drift, eased toward the target.
    if (idleSpin && !v.dragging && !reducedMotion) v.targetYaw += delta * 0.18
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 6)
    v.yaw += (v.targetYaw - v.yaw) * k
    v.pitch += (v.targetPitch - v.pitch) * k
    if (spin.current) spin.current.rotation.set(v.pitch, v.yaw, 0, 'XYZ')

    if (!root.current || !pivot.current) return

    // Idle demo loop: scramble, pause, solve, pause.
    if (!turn.current && !queue.current.length) {
      idleFor.current += delta
      if (autoplayOn.current && !reducedMotion) {
        const solved = history.current.length === 0
        if (solved && idleFor.current > 1.6) startSequence(randomSequence(10), 'scramble')
        else if (!solved && idleFor.current > 1.4) startSequence(invertSequence(history.current), 'solve')
      }
    } else {
      idleFor.current = 0
    }

    // Start the next turn.
    if (!turn.current && queue.current.length) {
      const move = queue.current.shift()!
      const { axis, layer, quarters } = moveGeometry(move)
      pivot.current.rotation.set(0, 0, 0)
      pivot.current.updateMatrixWorld()
      for (const c of cubies.current) {
        if (layer === 'all' || Math.round(c.position[axis]) === layer) pivot.current.attach(c)
      }
      const duration = reducedMotion ? 0.001 : (quarterTurnSeconds * (Math.abs(quarters) === 2 ? 1.45 : 1)) / speed.current
      turn.current = { move, axis, target: (quarters * Math.PI) / 2, t: 0, duration }
      onStep?.(seqIndex.current)
      onMoveStart?.(move)
      seqIndex.current += 1
    }

    // Advance the active turn.
    const tr = turn.current
    if (tr) {
      tr.t = Math.min(1, tr.t + delta / tr.duration)
      pivot.current.rotation[tr.axis] = easeInOut(tr.t) * tr.target
      if (tr.t >= 1) {
        pivot.current.updateMatrixWorld()
        for (const c of [...pivot.current.children]) {
          root.current.attach(c)
          snapCubie(c)
        }
        pivot.current.rotation.set(0, 0, 0)
        pushMerged(history.current, tr.move)
        turn.current = null
        onMoveEnd?.(tr.move)
        if (!queue.current.length) {
          onStep?.(-1)
          onIdle?.()
        }
      }
    }
  })

  // Drag-to-turn: pick the in-plane axis the screen drag follows (both axes are projected to
  // the screen from the grab point), then let gestureMove name the move.
  gesture.current.resolve = (g, dx, dy) => {
    const rt = root.current
    if (!rt) return null
    rt.updateMatrixWorld()
    const p = g.point
    const abs = [Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)]
    const k = abs[0] >= abs[1] && abs[0] >= abs[2] ? 0 : abs[1] >= abs[2] ? 1 : 2
    const toScreen = (v: THREE.Vector3) => {
      const w = rt.localToWorld(v.clone()).project(camera)
      return [(w.x * size.width) / 2, (-w.y * size.height) / 2]
    }
    const base = toScreen(p)
    let best: { along: 0 | 1 | 2; sign: 1 | -1; score: number } | null = null
    for (const a of [0, 1, 2] as const) {
      if (a === k) continue
      const step = p.clone()
      step.setComponent(a, p.getComponent(a) + 1)
      const s = toScreen(step)
      const vx = s[0] - base[0]
      const vy = s[1] - base[1]
      const len = Math.hypot(vx, vy) || 1
      const dot = (dx * vx + dy * vy) / len
      if (!best || Math.abs(dot) > best.score) best = { along: a, sign: dot >= 0 ? 1 : -1, score: Math.abs(dot) }
    }
    return best ? gestureMove([p.x, p.y, p.z], best.along, best.sign) : null
  }

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!gestures || !root.current) return
    const ne = e.nativeEvent
    if (ne.pointerType === 'mouse' && ne.button !== 0) return
    e.stopPropagation()
    root.current.updateMatrixWorld()
    gesture.current.grab = { id: ne.pointerId, x: ne.clientX, y: ne.clientY, point: root.current.worldToLocal(e.point.clone()), done: false }
  }

  return (
    <group ref={spin}>
      <group ref={root} scale={0.98} onPointerDown={gestures ? onPointerDown : undefined}>
        <group ref={pivot} />
        {positions.map((p, i) => (
          <group
            key={p.join(',')}
            position={p}
            ref={(g) => {
              if (g) cubies.current[i] = g
            }}
          >
            <mesh geometry={body} material={bodyMat} />
            {STICKER_FACES.filter((s) => p[s.axis] === s.sign).map((s) => {
              const pos: Vec3 = [0, 0, 0]
              pos[s.axis] = s.sign * 0.488
              const normal: Vec3 = [0, 0, 0]
              normal[s.axis] = s.sign
              return (
                <mesh
                  key={s.face}
                  geometry={sticker}
                  material={stickerMats[s.face]}
                  position={pos}
                  rotation={s.rot}
                  userData={{ face: s.face, normal }}
                />
              )
            })}
          </group>
        ))}
      </group>
      <Overlays highlight={highlight} labels={labels} arrow={arrow} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Pedestal: a glowing ring and a tilted orbit arc                     */
/* ------------------------------------------------------------------ */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(70,140,255,0.9)')
    grad.addColorStop(0.45, 'rgba(60,110,255,0.28)')
    grad.addColorStop(1, 'rgba(40,60,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function Pedestal({ reducedMotion }: { reducedMotion: boolean }) {
  const glow = useGlowTexture()
  const arc = useRef<THREE.Mesh>(null)
  useFrame((_, d) => {
    if (arc.current && !reducedMotion) arc.current.rotation.z += Math.min(d, 0.05) * 0.25
  })
  return (
    <group position={[0, -2.35, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.35, 0.018, 8, 128]} />
        <meshBasicMaterial color="#5aa8ff" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.62, 0.008, 8, 128]} />
        <meshBasicMaterial color="#3d6bff" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <group position={[0, 2.35, 0]} rotation={[1.2, 0.2, -0.35]}>
        <mesh ref={arc}>
          <torusGeometry args={[3.05, 0.012, 8, 160, Math.PI * 0.9]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.75} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
export default function CubeScene({
  apiRef,
  autoplay = false,
  reducedMotion = false,
  active = true,
  onSequence,
  onStep,
  onMoveStart,
  onMoveEnd,
  onIdle,
  onReady,
  className,
  pedestal = true,
  initialYaw = HOME_YAW,
  initialPitch = HOME_PITCH,
  quarterTurnSeconds = 0.3,
  idleSpin = true,
  highlight = null,
  labels = false,
  arrow = null,
  pitchRange = [-0.3, 1.1],
  focus = null,
  onGesture = null,
}: CubeSceneProps) {
  const view = useRef<View>({
    yaw: initialYaw,
    pitch: initialPitch,
    targetYaw: initialYaw,
    targetPitch: initialPitch,
    dragging: false,
  })
  const wrap = useRef<HTMLDivElement>(null)
  const range = useRef(pitchRange)
  range.current = pitchRange
  const gesture = useRef<Gesture>({ grab: null, resolve: null })
  const onGestureRef = useRef(onGesture)
  onGestureRef.current = onGesture
  const gestures = !!onGesture

  // Pointer drag moves the camera. Horizontal only on touch, so vertical page scroll still works.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    let lastX = 0
    let lastY = 0
    let id: number | null = null
    // With gestures on, a drag the cube grabbed (it started on a piece) turns a layer instead.
    const grabbed = (e: PointerEvent) => gesture.current.grab?.id === e.pointerId
    const down = (e: PointerEvent) => {
      if (grabbed(e)) {
        el.setPointerCapture(e.pointerId)
        return
      }
      id = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      view.current.dragging = true
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      const g = gesture.current.grab
      if (g && g.id === e.pointerId) {
        if (g.done) return
        const dx = e.clientX - g.x
        const dy = e.clientY - g.y
        // One turn per drag, decided once the finger or mouse has clearly moved.
        if (Math.hypot(dx, dy) < (e.pointerType === 'touch' ? 14 : 10)) return
        g.done = true
        const m = gesture.current.resolve?.(g, dx, dy)
        if (m) onGestureRef.current?.(m)
        return
      }
      if (e.pointerId !== id) return
      const v = view.current
      v.targetYaw += (e.clientX - lastX) * 0.01
      if (e.pointerType !== 'touch') {
        const [lo, hi] = range.current
        v.targetPitch = Math.max(lo, Math.min(hi, v.targetPitch + (e.clientY - lastY) * 0.008))
      }
      lastX = e.clientX
      lastY = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (grabbed(e)) {
        gesture.current.grab = null
        return
      }
      if (e.pointerId !== id) return
      id = null
      view.current.dragging = false
      el.style.cursor = 'grab'
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div ref={wrap} className={className} style={{ touchAction: gestures ? 'none' : 'pan-y', cursor: 'grab' }} data-gestures={gestures ? '' : undefined}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        flat
        dpr={[1, 1.75]}
        camera={{ position: [0, pedestal ? -0.35 : 0, pedestal ? 12.6 : labels ? 12.4 : 11.2], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        {/* Neutral key and fill keep sticker colors true; blue/violet only rim the edges from behind. */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 7, 6]} intensity={1.5} />
        <directionalLight position={[-5, 1, 5]} intensity={0.55} />
        <directionalLight position={[-6, 3, -6]} intensity={1.6} color="#3d7bff" />
        <directionalLight position={[3, -6, -4]} intensity={0.8} color="#8b5cf6" />
        <Cube
          apiRef={apiRef}
          autoplay={autoplay}
          reducedMotion={reducedMotion}
          onSequence={onSequence}
          onStep={onStep}
          onMoveStart={onMoveStart}
          onMoveEnd={onMoveEnd}
          onIdle={onIdle}
          onReady={onReady}
          view={view}
          quarterTurnSeconds={quarterTurnSeconds}
          idleSpin={idleSpin}
          highlight={highlight}
          labels={labels}
          arrow={arrow}
          focus={focus}
          gesture={gesture}
          gestures={gestures}
        />
        {pedestal && <Pedestal reducedMotion={reducedMotion} />}
      </Canvas>
    </div>
  )
}

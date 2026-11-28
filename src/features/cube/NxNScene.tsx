import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOME_PITCH, HOME_YAW, STICKER_FACES, useCubeAssets } from './CubeScene'
import type { Face } from './moves'
import { applyAlgN, solvedN } from './nxn'

/**
 * A 3D cube of any size (2x2, 4x4…) showing one scrambled state, in the same
 * look as the 3x3 scene (pieces, stickers, lights). Drag to look around.
 * The state comes from the N x N model, the same one that draws the net.
 */
type View = { yaw: number; pitch: number; targetYaw: number; targetPitch: number }

const NORMAL_FACE: Record<string, Face> = { '1,0,0': 'R', '-1,0,0': 'L', '0,1,0': 'U', '0,-1,0': 'D', '0,0,1': 'F', '0,0,-1': 'B' }
const PLACEMENT = Object.fromEntries(STICKER_FACES.map((s) => [s.face, s])) as Record<Face, (typeof STICKER_FACES)[number]>

function Cube({ size, scramble, view }: { size: number; scramble: string; view: React.MutableRefObject<View> }) {
  const { body, sticker, bodyMat, stickerMats } = useCubeAssets()
  const spin = useRef<THREE.Group>(null)

  const { cubies, stickers } = useMemo(() => {
    const state = applyAlgN(solvedN(size), scramble)
    const half = (size - 1) / 2
    // Outer cubies only (the inside is never seen).
    const cubies: [number, number, number][] = []
    for (let x = 0; x < size; x++)
      for (let y = 0; y < size; y++)
        for (let z = 0; z < size; z++) {
          const p: [number, number, number] = [x - half, y - half, z - half]
          if (p.some((v) => Math.abs(v) === half)) cubies.push(p)
        }
    // Doubled model coordinates -> real positions; each sticker sits on its cubie's face.
    const stickers = state.stickers.map((s) => {
      const face = NORMAL_FACE[s.normal.join(',')]
      const pl = PLACEMENT[face]
      const pos = s.pos.map((v, k) => v / 2 + s.normal[k] * 0.488) as [number, number, number]
      return { pos, rot: pl.rot, color: s.color, face }
    })
    return { cubies, stickers }
  }, [size, scramble])

  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __cubeverseNxN: { size, scramble, stickers } })
  }, [size, scramble, stickers])

  useFrame((_, d) => {
    const v = view.current
    const k = 1 - Math.exp(-Math.min(d, 0.25) * 8)
    v.yaw += (v.targetYaw - v.yaw) * k
    v.pitch += (v.targetPitch - v.pitch) * k
    spin.current?.rotation.set(v.pitch, v.yaw, 0, 'XYZ')
  })

  // Same on-screen size as the 3x3, whatever the number of layers.
  return (
    <group ref={spin}>
      <group scale={(3 / size) * 0.98}>
        {cubies.map((p) => (
          <mesh key={p.join(',')} geometry={body} material={bodyMat} position={p} />
        ))}
        {stickers.map((s, i) => (
          <mesh key={i} geometry={sticker} material={stickerMats[s.color]} position={s.pos} rotation={s.rot} userData={{ color: s.color, face: s.face }} />
        ))}
      </group>
    </group>
  )
}

export type NxNSceneProps = { size: number; scramble: string; active?: boolean; className?: string }

export default function NxNScene({ size, scramble, active = true, className }: NxNSceneProps) {
  const view = useRef<View>({ yaw: HOME_YAW, pitch: HOME_PITCH, targetYaw: HOME_YAW, targetPitch: HOME_PITCH })
  const wrap = useRef<HTMLDivElement>(null)

  // Drag to look around (horizontal only on touch, so the page can still scroll).
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    let id: number | null = null
    let lx = 0
    let ly = 0
    const down = (e: PointerEvent) => {
      id = e.pointerId
      lx = e.clientX
      ly = e.clientY
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      const v = view.current
      v.targetYaw += (e.clientX - lx) * 0.01
      if (e.pointerType !== 'touch') v.targetPitch = Math.max(-1.3, Math.min(1.3, v.targetPitch + (e.clientY - ly) * 0.008))
      lx = e.clientX
      ly = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      id = null
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
    <div ref={wrap} className={className} style={{ touchAction: 'pan-y', cursor: 'grab' }} data-nxn-scene={size}>
      <Canvas frameloop={active ? 'always' : 'never'} flat dpr={[1, 1.75]} camera={{ position: [0, 0, 11.2], fov: 30 }} gl={{ antialias: true, alpha: true }} aria-hidden="true">
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 7, 6]} intensity={1.5} />
        <directionalLight position={[-5, 1, 5]} intensity={0.55} />
        <directionalLight position={[-6, 3, -6]} intensity={1.6} color="#3d7bff" />
        <directionalLight position={[3, -6, -4]} intensity={0.8} color="#8b5cf6" />
        <Cube size={size} scramble={scramble} view={view} />
      </Canvas>
    </div>
  )
}

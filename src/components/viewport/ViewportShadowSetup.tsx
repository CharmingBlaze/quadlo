import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import type { DirectionalLight, WebGLRenderer } from 'three'
import { useAppStore } from '../../store/appStore'
import type { ViewType } from '../../store/appStore'
import { isOrthoView } from '../../scene/viewTypes'
import { computeObjectsFitFrame } from '../../viewport/fitViewports'
import {
  applyDirectionalShadowFit,
  markShadowMapDirty,
  resolveShadowFit,
  syncDirectionalShadowAfterSceneChange,
  type ShadowFitParams,
} from '../../viewport/viewportShadowBounds'

/** Sync renderer shadowMap with the user toggle. Manual updates only — no per-frame regen. */
export function ViewportShadowRendererSync() {
  const enabled = useAppStore((s) => s.viewportShadowsEnabled)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    gl.shadowMap.enabled = enabled
    gl.shadowMap.autoUpdate = false
    if (enabled) markShadowMapDirty(gl)
    invalidate()
  }, [enabled, gl, invalidate])

  return null
}

/** Ground contact receiver — skip bottom (plane faces away). Follows scene horizontally. */
export function ViewportShadowPlane({ view }: { view: ViewType }) {
  const enabled = useAppStore((s) => s.viewportShadowsEnabled)
  const objects = useAppStore((s) => s.objects)
  const center = useMemo(() => computeObjectsFitFrame(objects)?.center ?? { x: 0, y: 0, z: 0 }, [objects])

  if (!enabled) return null
  if (view === 'bottom') return null

  const opacity = isOrthoView(view) ? 0.38 : 0.34

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[center.x, -0.04, center.z]}
      receiveShadow
      raycast={() => null}
    >
      <planeGeometry args={[2400, 2400]} />
      <shadowMaterial opacity={opacity} transparent depthWrite={false} />
    </mesh>
  )
}

/** Aim the key light shadow camera at the live scene bounds (coalesced, hysteresis-gated). */
export function useKeyLightShadowFit(
  lightRef: RefObject<DirectionalLight | null>,
  castShadow: boolean
): void {
  const objects = useAppStore((s) => s.objects)
  const gl = useThree((s) => s.gl) as WebGLRenderer
  const invalidate = useThree((s) => s.invalidate)
  const lastFitRef = useRef<ShadowFitParams | null>(null)
  const frame = useMemo(() => computeObjectsFitFrame(objects), [objects])

  useLayoutEffect(() => {
    const light = lightRef.current
    if (!light) return
    if (!castShadow) {
      lastFitRef.current = null
      return
    }

    const params = resolveShadowFit(frame)
    // Bounds hysteresis avoids thrashing the shadow camera, but mesh edits that
    // stay inside the fit sphere still need a fresh shadow map (autoUpdate=false).
    lastFitRef.current = syncDirectionalShadowAfterSceneChange(
      light,
      gl,
      lastFitRef.current,
      params
    )
    invalidate()
  }, [lightRef, frame, objects, castShadow, gl, invalidate])
}

/** One-shot shadow camera setup for the game-sun key light. */
export function configureDirectionalShadow(
  light: DirectionalLight,
  frame = null as ReturnType<typeof computeObjectsFitFrame>
): void {
  applyDirectionalShadowFit(light, resolveShadowFit(frame))
}

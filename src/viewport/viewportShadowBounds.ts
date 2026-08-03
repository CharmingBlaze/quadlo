import type { DirectionalLight, OrthographicCamera } from 'three'
import type { Vec3 } from '../utils/math'
import type { ViewportFitFrame } from './fitViewports'

/** Shared key-light offset — matches Game display mode sun. */
export const GAME_SUN_OFFSET: Vec3 = { x: 80, y: 120, z: 60 }

/** 1024 keeps four viewports light on the GPU (~1MB VRAM); still sharp after scene fit. */
export const SHADOW_MAP_SIZE = 1024
export const SHADOW_FRUSTUM_MIN = 12
export const SHADOW_FRUSTUM_MAX = 420
export const SHADOW_FIT_MARGIN = 1.25
export const SHADOW_EMPTY_RADIUS = 6

export interface ShadowFitParams {
  center: Vec3
  radius: number
  sunOffset: Vec3
  mapSize: number
}

const SHADOW_REFIT_CENTER_EPS = 0.08
const SHADOW_REFIT_RADIUS_EPS = 0.08

/** Skip redundant shadow refits during small scene drifts or duplicate invalidations. */
export function shouldRefitShadowFit(
  prev: ShadowFitParams | null,
  next: ShadowFitParams
): boolean {
  if (!prev) return true
  const centerMove = Math.hypot(
    next.center.x - prev.center.x,
    next.center.y - prev.center.y,
    next.center.z - prev.center.z
  )
  const refRadius = Math.max(prev.radius, next.radius, 1)
  if (centerMove > refRadius * SHADOW_REFIT_CENTER_EPS) return true
  if (Math.abs(next.radius - prev.radius) / refRadius > SHADOW_REFIT_RADIUS_EPS) return true
  return false
}

/** Mark the shadow map dirty after a manual fit (requires autoUpdate=false). */
export function markShadowMapDirty(gl: { shadowMap: { needsUpdate: boolean } }): void {
  gl.shadowMap.needsUpdate = true
}

/**
 * After scene content changes: optionally refit the shadow camera (hysteresis),
 * then always dirty the shadow map so mesh edits inside the fit sphere still update.
 */
export function syncDirectionalShadowAfterSceneChange(
  light: DirectionalLight,
  gl: { shadowMap: { needsUpdate: boolean } },
  prev: ShadowFitParams | null,
  next: ShadowFitParams
): ShadowFitParams {
  if (shouldRefitShadowFit(prev, next)) {
    applyDirectionalShadowFit(light, next)
    markShadowMapDirty(gl)
    return next
  }
  markShadowMapDirty(gl)
  return prev ?? next
}

/** Resolve a shadow fit from a scene frame (or empty-scene defaults). */
export function resolveShadowFit(
  frame: ViewportFitFrame | null,
  sunOffset: Vec3 = GAME_SUN_OFFSET,
  mapSize: number = SHADOW_MAP_SIZE
): ShadowFitParams {
  if (!frame) {
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: SHADOW_EMPTY_RADIUS,
      sunOffset,
      mapSize,
    }
  }
  return {
    center: frame.center,
    radius: Math.max(SHADOW_EMPTY_RADIUS * 0.35, frame.radius),
    sunOffset,
    mapSize,
  }
}

/** Orthographic half-extent for the shadow camera (world units). */
export function shadowFrustumHalfExtent(radius: number): number {
  return Math.min(
    SHADOW_FRUSTUM_MAX,
    Math.max(SHADOW_FRUSTUM_MIN, radius * SHADOW_FIT_MARGIN)
  )
}

/**
 * Aim a directional light at the scene and tighten its shadow camera so
 * texels stay dense — Blender/Unity-style cascaded-less key shadow.
 */
export function applyDirectionalShadowFit(
  light: DirectionalLight,
  params: ShadowFitParams
): void {
  const { center, radius, sunOffset, mapSize } = params
  const half = shadowFrustumHalfExtent(radius)

  const sunLen = Math.hypot(sunOffset.x, sunOffset.y, sunOffset.z) || 1
  const sunDir = {
    x: sunOffset.x / sunLen,
    y: sunOffset.y / sunLen,
    z: sunOffset.z / sunLen,
  }
  // Keep the light far enough that the ortho volume covers the fit sphere.
  const lightDistance = Math.max(half * 2.8, sunLen * 0.85, 80)

  light.position.set(
    center.x + sunDir.x * lightDistance,
    center.y + sunDir.y * lightDistance,
    center.z + sunDir.z * lightDistance
  )
  light.target.position.set(center.x, center.y, center.z)
  light.target.updateMatrixWorld()

  light.shadow.mapSize.set(mapSize, mapSize)
  light.shadow.bias = -0.0004
  light.shadow.normalBias = 0.03
  light.shadow.radius = 1.5

  const cam = light.shadow.camera as OrthographicCamera
  cam.left = -half
  cam.right = half
  cam.top = half
  cam.bottom = -half
  cam.near = 0.5
  cam.far = lightDistance + half * 2.5
  cam.updateProjectionMatrix()
}

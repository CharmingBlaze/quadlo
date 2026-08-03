import { describe, expect, it } from 'vitest'
import { DirectionalLight } from 'three'
import {
  applyDirectionalShadowFit,
  GAME_SUN_OFFSET,
  markShadowMapDirty,
  resolveShadowFit,
  shadowFrustumHalfExtent,
  shouldRefitShadowFit,
  syncDirectionalShadowAfterSceneChange,
  SHADOW_EMPTY_RADIUS,
  SHADOW_FRUSTUM_MAX,
  SHADOW_FRUSTUM_MIN,
} from './viewportShadowBounds'

describe('viewportShadowBounds', () => {
  it('uses empty-scene defaults when there is no fit frame', () => {
    const fit = resolveShadowFit(null)
    expect(fit.center).toEqual({ x: 0, y: 0, z: 0 })
    expect(fit.radius).toBe(SHADOW_EMPTY_RADIUS)
    expect(fit.sunOffset).toEqual(GAME_SUN_OFFSET)
  })

  it('clamps frustum half-extent between min and max', () => {
    expect(shadowFrustumHalfExtent(1)).toBe(SHADOW_FRUSTUM_MIN)
    expect(shadowFrustumHalfExtent(10_000)).toBe(SHADOW_FRUSTUM_MAX)
    expect(shadowFrustumHalfExtent(40)).toBeGreaterThan(SHADOW_FRUSTUM_MIN)
    expect(shadowFrustumHalfExtent(40)).toBeLessThan(SHADOW_FRUSTUM_MAX)
  })

  it('skips refit until the scene bounds move meaningfully', () => {
    const base = resolveShadowFit({ center: { x: 0, y: 0, z: 0 }, radius: 40 })
    expect(shouldRefitShadowFit(null, base)).toBe(true)
    expect(shouldRefitShadowFit(base, base)).toBe(false)
    expect(
      shouldRefitShadowFit(
        base,
        resolveShadowFit({ center: { x: 1, y: 0, z: 0 }, radius: 40 })
      )
    ).toBe(false)
    expect(
      shouldRefitShadowFit(
        base,
        resolveShadowFit({ center: { x: 8, y: 0, z: 0 }, radius: 40 })
      )
    ).toBe(true)
    expect(
      shouldRefitShadowFit(
        base,
        resolveShadowFit({ center: { x: 0, y: 0, z: 0 }, radius: 50 })
      )
    ).toBe(true)
  })

  it('dirties the shadow map even when the fit camera is unchanged', () => {
    const light = new DirectionalLight(0xffffff, 1)
    const gl = { shadowMap: { needsUpdate: false } }
    const base = resolveShadowFit({ center: { x: 0, y: 0, z: 0 }, radius: 40 })
    applyDirectionalShadowFit(light, base)
    const leftBefore = light.shadow.camera.left

    const kept = syncDirectionalShadowAfterSceneChange(light, gl, base, base)
    expect(kept).toBe(base)
    expect(gl.shadowMap.needsUpdate).toBe(true)
    expect(light.shadow.camera.left).toBe(leftBefore)

    gl.shadowMap.needsUpdate = false
    const moved = resolveShadowFit({ center: { x: 20, y: 0, z: 0 }, radius: 40 })
    const next = syncDirectionalShadowAfterSceneChange(light, gl, base, moved)
    expect(next).toBe(moved)
    expect(gl.shadowMap.needsUpdate).toBe(true)
    expect(light.target.position.x).toBeCloseTo(20)
  })

  it('markShadowMapDirty sets needsUpdate', () => {
    const gl = { shadowMap: { needsUpdate: false } }
    markShadowMapDirty(gl)
    expect(gl.shadowMap.needsUpdate).toBe(true)
  })

  it('aims the key light at the scene center and fits the ortho volume', () => {
    const light = new DirectionalLight(0xffffff, 1)
    const center = { x: 20, y: 4, z: -10 }
    const radius = 30
    applyDirectionalShadowFit(light, resolveShadowFit({ center, radius }))

    expect(light.target.position.x).toBeCloseTo(center.x)
    expect(light.target.position.y).toBeCloseTo(center.y)
    expect(light.target.position.z).toBeCloseTo(center.z)

    // Light stays on the game sun direction from the center.
    const dx = light.position.x - center.x
    const dy = light.position.y - center.y
    const dz = light.position.z - center.z
    const len = Math.hypot(dx, dy, dz)
    const sunLen = Math.hypot(GAME_SUN_OFFSET.x, GAME_SUN_OFFSET.y, GAME_SUN_OFFSET.z)
    expect(dx / len).toBeCloseTo(GAME_SUN_OFFSET.x / sunLen, 5)
    expect(dy / len).toBeCloseTo(GAME_SUN_OFFSET.y / sunLen, 5)
    expect(dz / len).toBeCloseTo(GAME_SUN_OFFSET.z / sunLen, 5)

    const half = shadowFrustumHalfExtent(radius)
    expect(light.shadow.camera.left).toBeCloseTo(-half)
    expect(light.shadow.camera.right).toBeCloseTo(half)
    expect(light.shadow.camera.top).toBeCloseTo(half)
  })
})

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import { useAppStore } from '../../store/appStore'
import type { ViewType } from '../../store/appStore'

const SHADOW_MAP_SIZE = 2048
const SHADOW_FRUSTUM = 220

/** Sync renderer shadowMap with the user toggle. */
export function ViewportShadowRendererSync() {
  const enabled = useAppStore((s) => s.viewportShadowsEnabled)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    gl.shadowMap.enabled = enabled
    invalidate()
  }, [enabled, gl, invalidate])

  return null
}

/** Subtle ground contact — GridHelper does not receive shadows well. */
export function ViewportShadowPlane({ view }: { view: ViewType }) {
  const enabled = useAppStore((s) => s.viewportShadowsEnabled)
  if (!enabled || view !== 'perspective') return null

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.04, 0]}
      receiveShadow
      raycast={() => null}
    >
      <planeGeometry args={[2400, 2400]} />
      <shadowMaterial opacity={0.32} transparent depthWrite={false} />
    </mesh>
  )
}

export function configureDirectionalShadow(light: THREE.DirectionalLight): void {
  const cam = light.shadow.camera
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
  light.shadow.bias = -0.0003
  light.shadow.normalBias = 0.025
  cam.near = 1
  cam.far = 800
  cam.left = -SHADOW_FRUSTUM
  cam.right = SHADOW_FRUSTUM
  cam.top = SHADOW_FRUSTUM
  cam.bottom = -SHADOW_FRUSTUM
  cam.updateProjectionMatrix()
}

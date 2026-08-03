import { useRef } from 'react'
import type { DirectionalLight } from 'three'
import { useAppStore } from '../store/appStore'
import { VIEWPORT_DISPLAY_CONFIG } from '../rendering/viewportDisplay'
import { useTheme } from '../theme/useTheme'
import { useKeyLightShadowFit } from './viewport/ViewportShadowSetup'
import { GAME_SUN_OFFSET } from '../viewport/viewportShadowBounds'

const GAME_SUN_POSITION: [number, number, number] = [
  GAME_SUN_OFFSET.x,
  GAME_SUN_OFFSET.y,
  GAME_SUN_OFFSET.z,
]

function KeyDirectionalLight({
  intensity,
  color,
  castShadow,
}: {
  intensity: number
  color?: string
  castShadow: boolean
}) {
  const lightRef = useRef<DirectionalLight>(null)
  useKeyLightShadowFit(lightRef, castShadow)

  return (
    <directionalLight
      ref={lightRef}
      position={GAME_SUN_POSITION}
      intensity={intensity}
      color={color}
      castShadow={castShadow}
    />
  )
}

/**
 * Viewport lighting. Key sun direction matches Game mode in every view so
 * front/right/top/perspective all preview the same in-engine contact shadows.
 */
export function ViewportLighting() {
  const mode = useAppStore((s) => s.viewportDisplayMode)
  const shadowsEnabled = useAppStore((s) => s.viewportShadowsEnabled)
  const cfg = VIEWPORT_DISPLAY_CONFIG[mode]
  const { text, css } = useTheme()
  const sky = text
  const ground = css['--viewport-bg-deep']
  const fill = css['--grid-section']
  const castShadow = shadowsEnabled && mode !== 'unlit' && mode !== 'wireframe'

  if (!cfg.gameLighting && mode === 'unlit') {
    return null
  }

  const ambientBoost = castShadow ? 0.92 : 1

  if (mode === 'model') {
    return (
      <>
        <ambientLight intensity={0.3 * ambientBoost} />
        <hemisphereLight color={sky} groundColor={ground} intensity={0.15 * ambientBoost} />
        <KeyDirectionalLight intensity={1.12} castShadow={castShadow} />
        <directionalLight position={[-80, 60, -100]} intensity={0.26} />
      </>
    )
  }

  if (cfg.gameLighting) {
    return (
      <>
        <ambientLight intensity={0.36 * ambientBoost} />
        <hemisphereLight color={sky} groundColor={ground} intensity={0.2 * ambientBoost} />
        <KeyDirectionalLight intensity={0.88} color={text} castShadow={castShadow} />
        <directionalLight position={[-40, 40, -80]} intensity={0.15} color={fill} />
      </>
    )
  }

  return (
    <>
      <ambientLight intensity={0.28 * ambientBoost} />
      <hemisphereLight color="#c8c8c8" groundColor={ground} intensity={0.16 * ambientBoost} />
      <KeyDirectionalLight intensity={1.05} castShadow={castShadow} />
      <directionalLight position={[-80, -50, -100]} intensity={0.24} />
    </>
  )
}

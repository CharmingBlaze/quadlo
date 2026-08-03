import { useRef } from 'react'
import type { DirectionalLight } from 'three'
import { useAppStore } from '../store/appStore'
import { VIEWPORT_DISPLAY_CONFIG } from '../rendering/viewportDisplay'
import { useTheme } from '../theme/useTheme'
import { useKeyLightShadowFit } from './viewport/ViewportShadowSetup'
import { GAME_SUN_OFFSET } from '../viewport/viewportShadowBounds'
import { useViewportRuntime } from './viewport/ViewportRuntimeContext'

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
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-bias={-0.0004}
    />
  )
}

/**
 * Viewport lighting. Key sun direction matches Game mode in every view so
 * front/right/top/perspective all preview the same in-engine contact shadows.
 */
export function ViewportLighting() {
  const { view } = useViewportRuntime()
  const mode = useAppStore((s) => s.viewportDisplayMode)
  const shadowsEnabled = useAppStore((s) => s.viewportShadowsEnabled)
  const cfg = VIEWPORT_DISPLAY_CONFIG[mode]
  const { text, css } = useTheme()
  const fill = css['--grid-section']
  const castShadow = shadowsEnabled && view === 'perspective' && mode !== 'unlit' && mode !== 'wireframe'

  if (!cfg.gameLighting && mode === 'unlit') {
    return null
  }

  const ambientBoost = castShadow ? 0.92 : 1

  if (mode === 'model') {
    return (
      <>
        <ambientLight intensity={0.01 * ambientBoost} />
        <KeyDirectionalLight intensity={1.45} castShadow={castShadow} />
        <directionalLight position={[-80, 40, 50]} intensity={0.2} color={fill} />
        <directionalLight position={[-40, 60, -100]} intensity={0.45} />
      </>
    )
  }

  if (cfg.gameLighting) {
    return (
      <>
        <ambientLight intensity={0.02 * ambientBoost} />
        <KeyDirectionalLight intensity={1.3} color={text} castShadow={castShadow} />
        <directionalLight position={[-40, 40, 80]} intensity={0.25} color={fill} />
        <directionalLight position={[-20, 40, -80]} intensity={0.35} color={fill} />
      </>
    )
  }

  return (
    <>
      <ambientLight intensity={0.01 * ambientBoost} />
      <KeyDirectionalLight intensity={1.4} castShadow={castShadow} />
      <directionalLight position={[-80, 40, 50]} intensity={0.2} />
      <directionalLight position={[-40, 60, -100]} intensity={0.4} />
    </>
  )
}

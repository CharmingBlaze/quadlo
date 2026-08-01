import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { VIEWPORT_DISPLAY_CONFIG } from '../rendering/viewportDisplay'
import { useTheme } from '../theme/useTheme'
import { configureDirectionalShadow } from './viewport/ViewportShadowSetup'

function KeyDirectionalLight({
  position,
  intensity,
  color,
  castShadow,
}: {
  position: [number, number, number]
  intensity: number
  color?: string
  castShadow: boolean
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useEffect(() => {
    const light = lightRef.current
    if (!light) return
    configureDirectionalShadow(light)
  }, [])

  return (
    <directionalLight
      ref={lightRef}
      position={position}
      intensity={intensity}
      color={color}
      castShadow={castShadow}
    />
  )
}

export function ViewportLighting() {
  const mode = useAppStore((s) => s.viewportDisplayMode)
  const shadowsEnabled = useAppStore((s) => s.viewportShadowsEnabled)
  const cfg = VIEWPORT_DISPLAY_CONFIG[mode]
  const { text, css } = useTheme()
  const sky = text
  const ground = css['--viewport-bg-deep']
  const fill = css['--grid-section']
  const castShadow = shadowsEnabled && mode !== 'unlit'

  if (!cfg.gameLighting && mode === 'unlit') {
    return null
  }

  if (mode === 'model') {
    // Soft key + restrained fill — avoids the flat ambient wash of high hemisphere + ambient.
    return (
      <>
        <ambientLight intensity={0.32} />
        <hemisphereLight color={sky} groundColor={ground} intensity={0.16} />
        <KeyDirectionalLight position={[100, 150, 80]} intensity={1.15} castShadow={castShadow} />
        <directionalLight position={[-80, 60, -100]} intensity={0.28} />
      </>
    )
  }

  if (cfg.gameLighting) {
    return (
      <>
        <ambientLight intensity={0.38} />
        <hemisphereLight color={sky} groundColor={ground} intensity={0.22} />
        <KeyDirectionalLight
          position={[80, 120, 60]}
          intensity={0.82}
          color={text}
          castShadow={castShadow}
        />
        <directionalLight position={[-40, 40, -80]} intensity={0.16} color={fill} />
      </>
    )
  }

  // Default modeling light — contrasty key/fill, not a washed studio fill.
  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight color="#c8c8c8" groundColor={ground} intensity={0.18} />
      <KeyDirectionalLight position={[100, 150, 80]} intensity={1.08} castShadow={castShadow} />
      <directionalLight position={[-80, -50, -100]} intensity={0.26} />
    </>
  )
}

import { useMemo } from 'react'
import { Grid, Line } from '@react-three/drei'
import type { ViewType } from '../store/appStore'
import type { OrthoViewType } from '../primitives/viewAxes'
import { orthoViewFromLegacy } from '../primitives/viewAxes'
import { useTheme } from '../theme/useTheme'
import { SCENE_GRID_CELL } from '../scene/units'

interface ViewportGridProps {
  view: ViewType
  depth?: number
}

const BASE_CELL = SCENE_GRID_CELL
const BASE_SECTION = BASE_CELL * 10

/** Muted DCC axis colors — red/green/blue without neon saturation. */
const AXIS_COLORS = {
  x: '#b85a54',
  y: '#6a9a58',
  z: '#5a82b8',
} as const

const GRID_STYLE = {
  cellThickness: 0.55,
  sectionThickness: 1.05,
  /** Matches the tuned perspective floor fade (1400 × 0.85). */
  fadeDistance: 1190,
  fadeStrength: 1.1,
  infiniteGrid: true as const,
}

const AXIS_LEN = BASE_SECTION * 6

const AXIS_LINE_STYLE = {
  lineWidth: 1.2,
  opacity: 0.65,
} as const

function SharedFloorGrid({
  position = [0, -0.02, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const { gridCell, gridSection } = useTheme()
  return (
    <Grid
      cellSize={BASE_CELL}
      sectionSize={BASE_SECTION}
      infiniteGrid={GRID_STYLE.infiniteGrid}
      cellColor={gridCell}
      sectionColor={gridSection}
      cellThickness={GRID_STYLE.cellThickness}
      sectionThickness={GRID_STYLE.sectionThickness}
      fadeDistance={GRID_STYLE.fadeDistance}
      fadeStrength={GRID_STYLE.fadeStrength}
      position={position}
      rotation={rotation}
    />
  )
}

function OriginMarker() {
  return (
    <group raycast={() => null}>
      <mesh position={[0, 0.04, 0]} renderOrder={-1}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshBasicMaterial color="#e8e8e8" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <Line
        points={[
          [-0.9, 0, 0],
          [0.9, 0, 0],
        ]}
        color={AXIS_COLORS.x}
        lineWidth={AXIS_LINE_STYLE.lineWidth}
        transparent
        opacity={AXIS_LINE_STYLE.opacity}
      />
      <Line
        points={[
          [0, -0.9, 0],
          [0, 0.9, 0],
        ]}
        color={AXIS_COLORS.y}
        lineWidth={AXIS_LINE_STYLE.lineWidth}
        transparent
        opacity={AXIS_LINE_STYLE.opacity}
      />
      <Line
        points={[
          [0, 0, -0.9],
          [0, 0, 0.9],
        ]}
        color={AXIS_COLORS.z}
        lineWidth={AXIS_LINE_STYLE.lineWidth}
        transparent
        opacity={AXIS_LINE_STYLE.opacity}
      />
    </group>
  )
}

function AxisLines({
  primary,
  secondary,
  tertiary,
}: {
  primary: [[number, number, number], [number, number, number]]
  secondary: [[number, number, number], [number, number, number]]
  tertiary?: [[number, number, number], [number, number, number]]
}) {
  return (
    <>
      <Line
        points={primary}
        color={AXIS_COLORS.x}
        lineWidth={AXIS_LINE_STYLE.lineWidth}
        transparent
        opacity={AXIS_LINE_STYLE.opacity}
      />
      <Line
        points={secondary}
        color={AXIS_COLORS.y}
        lineWidth={AXIS_LINE_STYLE.lineWidth}
        transparent
        opacity={AXIS_LINE_STYLE.opacity}
      />
      {tertiary && (
        <Line
          points={tertiary}
          color={AXIS_COLORS.z}
          lineWidth={AXIS_LINE_STYLE.lineWidth}
          transparent
          opacity={AXIS_LINE_STYLE.opacity}
        />
      )}
    </>
  )
}

function FlatWorkplaneGrid({
  plane,
  depth = 0,
}: {
  plane: 'front' | 'right'
  depth?: number
}) {
  const layout = useMemo(() => {
    const eps = 0.02
    if (plane === 'front') {
      const z = depth - eps
      return {
        rotation: [Math.PI / 2, 0, 0] as [number, number, number],
        position: [0, 0, z] as [number, number, number],
        primary: [
          [0, 0, z],
          [AXIS_LEN, 0, z],
        ] as [[number, number, number], [number, number, number]],
        secondary: [
          [0, 0, z],
          [0, AXIS_LEN, z],
        ] as [[number, number, number], [number, number, number]],
      }
    }
    const x = depth - eps
    return {
      rotation: [0, 0, -Math.PI / 2] as [number, number, number],
      position: [x, 0, 0] as [number, number, number],
      primary: [
        [x, 0, 0],
        [x, AXIS_LEN, 0],
      ] as [[number, number, number], [number, number, number]],
      secondary: [
        [x, 0, 0],
        [x, 0, AXIS_LEN],
      ] as [[number, number, number], [number, number, number]],
    }
  }, [plane, depth])

  return (
    <group>
      <SharedFloorGrid position={layout.position} rotation={layout.rotation} />
      <AxisLines primary={layout.primary} secondary={layout.secondary} />
      <OriginMarker />
    </group>
  )
}

function WorldGrid3D() {
  return (
    <group>
      <SharedFloorGrid />
      <AxisLines
        primary={[
          [0, 0, 0],
          [AXIS_LEN, 0, 0],
        ]}
        secondary={[
          [0, 0, 0],
          [0, AXIS_LEN, 0],
        ]}
        tertiary={[
          [0, 0, 0],
          [0, 0, AXIS_LEN],
        ]}
      />
      <OriginMarker />
    </group>
  )
}

function gridForOrtho(view: OrthoViewType, depth: number) {
  switch (view) {
    case 'front':
    case 'back':
      return <FlatWorkplaneGrid plane="front" depth={depth} />
    case 'left':
    case 'right':
      return <FlatWorkplaneGrid plane="right" depth={depth} />
    case 'top':
    case 'bottom':
      return (
        <group>
          <SharedFloorGrid />
          <AxisLines
            primary={[
              [0, 0, 0],
              [AXIS_LEN, 0, 0],
            ]}
            secondary={[
              [0, 0, 0],
              [0, 0, AXIS_LEN],
            ]}
            tertiary={[
              [0, 0, 0],
              [0, AXIS_LEN, 0],
            ]}
          />
          <OriginMarker />
        </group>
      )
  }
}

export function ViewportGrid({ view, depth = 0 }: ViewportGridProps) {
  if (view === 'perspective') return <WorldGrid3D />
  const ortho = orthoViewFromLegacy(view)
  if (!ortho) return null
  return gridForOrtho(ortho, depth)
}

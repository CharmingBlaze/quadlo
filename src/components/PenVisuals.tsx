import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ViewportLine } from './ViewportLine'
import * as THREE from 'three'
import type { ViewType, StrokeMode } from '../store/appStore'
import { planeToStroke3D } from '../utils/screenToWorld'
import type { StrokePlaneFrame } from '../stroke/worldProjection'
import { sampleAnchors, handleSegments } from '../vector/bezier'
import type { VectorAnchor } from '../vector/types'
import type { VectorPenDraft } from '../store/appStore'
import { useTheme } from '../theme/useTheme'
import { worldUnitsForScreenPixels } from '../utils/screenScale'

interface PenThemeColors {
  stroke: string
  handleLine: string
  anchorFill: string
  anchorStroke: string
  handleDot: string
  closeRing: string
  fillPreview: string
  closeTargetFill: string
}

function toWorldTuple(
  p: { x: number; y: number },
  view: ViewType,
  depth: number,
  planeFrame?: StrokePlaneFrame | null
): [number, number, number] {
  const w = planeToStroke3D(p.x, p.y, view, depth, planeFrame)
  return [w.x, w.y, w.z]
}

function PenPointMarker({
  position,
  fill,
  stroke,
  sizePx,
  fillOpacity = 0.95,
}: {
  position: [number, number, number]
  fill: string
  stroke: string
  sizePx: number
  fillOpacity?: number
}) {
  const rootRef = useRef<THREE.Group>(null)
  const worldRef = useRef(new THREE.Vector3())
  const { camera, size } = useThree()

  useFrame(() => {
    const root = rootRef.current
    if (!root) return
    root.quaternion.copy(camera.quaternion)
    const world = worldRef.current.set(position[0], position[1], position[2])
    root.scale.setScalar(worldUnitsForScreenPixels(camera, world, sizePx, size.height))
  })

  return (
    <group ref={rootRef} position={position} renderOrder={26}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.05, 1.05]} />
        <meshBasicMaterial color={stroke} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial
          color={fill}
          transparent
          opacity={fillOpacity}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function HandleDot({
  position,
  view,
  depth,
  planeFrame,
  color,
}: {
  position: { x: number; y: number }
  view: ViewType
  depth: number
  planeFrame?: StrokePlaneFrame | null
  color: string
}) {
  const world = useMemo(
    () => toWorldTuple(position, view, depth, planeFrame),
    [position, view, depth, planeFrame]
  )
  return (
    <PenPointMarker position={world} fill={color} stroke="#11151c" sizePx={6} fillOpacity={0.98} />
  )
}

function AnchorSquare({
  position,
  view,
  depth,
  planeFrame,
  highlight,
  closeTarget,
  colors,
}: {
  position: { x: number; y: number }
  view: ViewType
  depth: number
  planeFrame?: StrokePlaneFrame | null
  highlight?: boolean
  closeTarget?: boolean
  colors: PenThemeColors
}) {
  const world = useMemo(
    () => toWorldTuple(position, view, depth, planeFrame),
    [position, view, depth, planeFrame]
  )
  const sizePx = closeTarget ? 13 : highlight ? 11 : 10
  const fill = closeTarget ? colors.closeTargetFill : colors.anchorFill
  const stroke = closeTarget ? colors.closeRing : colors.anchorStroke

  return (
    <PenPointMarker
      position={world}
      fill={fill}
      stroke={stroke}
      sizePx={sizePx}
      fillOpacity={closeTarget ? 0.35 : 0.95}
    />
  )
}

function FillPreview({
  anchors,
  view,
  depth,
  planeFrame,
  closed,
  fillColor,
}: {
  anchors: VectorAnchor[]
  view: ViewType
  depth: number
  planeFrame?: StrokePlaneFrame | null
  closed: boolean
  fillColor: string
}) {
  const geometry = useMemo(() => {
    if (anchors.length < 3) return null
    const pts = sampleAnchors(anchors, closed, 0.5)
    if (pts.length < 3) return null

    const shape = new THREE.Shape()
    shape.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x, pts[i].y)
    }
    if (closed) shape.closePath()

    const geo = new THREE.ShapeGeometry(shape, 12)
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const w = planeToStroke3D(x, y, view, depth, planeFrame)
      pos.setXYZ(i, w.x, w.y, w.z)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [anchors, view, depth, planeFrame, closed])

  useEffect(
    () => () => {
      geometry?.dispose()
    },
    [geometry]
  )

  if (!geometry) return null

  return (
    <mesh geometry={geometry} renderOrder={0}>
      <meshBasicMaterial
        color={fillColor}
        transparent
        opacity={0.12}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

interface PenVisualsProps {
  draft: VectorPenDraft
  view: ViewType
  depth: number
  showFillPreview: boolean
  extrudeMode: boolean
  strokeMode: StrokeMode
}

export function PenVisuals({
  draft,
  view,
  depth,
  showFillPreview,
  extrudeMode,
  strokeMode,
}: PenVisualsProps) {
  const theme = useTheme()
  const invalidate = useThree((s) => s.invalidate)
  const planeFrame = draft.planeFrame ?? null
  const colors: PenThemeColors = {
    stroke: theme.accent,
    handleLine: theme.textMuted,
    anchorFill: theme.text,
    anchorStroke: theme.accent,
    handleDot: theme.accent,
    closeRing: theme.accentGreen,
    fillPreview: theme.accent,
    // Light green fill — black looked like the path broke
    closeTargetFill: theme.accentGreen,
  }

  const curvePoints = useMemo(() => {
    // While hovering the start point, keep an OPEN sample with preview snapped to
    // first so the rubber-band stays visible. Straight closed segments were getting
    // popped in sampleAnchors, which made the connect line vanish.
    const closed = draft.closed
    const preview = closed
      ? null
      : draft.closeTargetActive && draft.anchors[0]
        ? draft.anchors[0].position
        : draft.previewPoint
    const pts = sampleAnchors(draft.anchors, closed, 0.35, preview)
    if (closed && pts.length >= 2) {
      const first = pts[0]!
      const last = pts[pts.length - 1]!
      if (Math.hypot(first.x - last.x, first.y - last.y) > 0.01) {
        pts.push({ ...first })
      }
    }
    return pts.map((p) => {
      const w = planeToStroke3D(p.x, p.y, view, depth, planeFrame)
      return [w.x, w.y, w.z] as [number, number, number]
    })
  }, [draft, view, depth, planeFrame])

  const handleLines = useMemo(() => handleSegments(draft.anchors), [draft.anchors])
  const pendingIndex = draft.pendingAnchorIndex

  useFrame(() => {
    if (draft.view === view) invalidate()
  })

  const overlayLine = {
    depthTest: false as const,
    depthWrite: false as const,
    toneMapped: false as const,
    transparent: true as const,
  }

  // Flat fill stays 2D; volumetric Extrude/Hair/Sweep uses VectorPenVolumePreview.
  const showFillPreviewBlob =
    showFillPreview && strokeMode === 'blob' && !extrudeMode && draft.anchors.length >= 3

  // Perspective drafts without a locked plane have nowhere correct to draw.
  if (view === 'perspective' && !planeFrame) return null

  return (
    <group renderOrder={24}>
      {showFillPreviewBlob && (
        <FillPreview
          anchors={draft.anchors}
          view={view}
          depth={depth}
          planeFrame={planeFrame}
          closed={draft.closed || draft.closeTargetActive}
          fillColor={colors.fillPreview}
        />
      )}

      {curvePoints.length >= 2 && (
        <>
          <ViewportLine
            points={curvePoints}
            color="#10141a"
            lineWidth={3.5}
            opacity={0.62}
            renderOrder={24}
            {...overlayLine}
          />
          <ViewportLine
            points={curvePoints}
            color={colors.stroke}
            lineWidth={2}
            opacity={0.98}
            renderOrder={25}
            {...overlayLine}
          />
        </>
      )}

      {handleLines.map(([a, b], i) => {
        const wa = planeToStroke3D(a.x, a.y, view, depth, planeFrame)
        const wb = planeToStroke3D(b.x, b.y, view, depth, planeFrame)
        return (
          <ViewportLine
            key={`hl-${i}`}
            points={[
              [wa.x, wa.y, wa.z],
              [wb.x, wb.y, wb.z],
            ]}
            color={colors.handleLine}
            lineWidth={1}
            opacity={0.85}
            renderOrder={23}
            {...overlayLine}
          />
        )
      })}

      {draft.anchors.map((anchor, i) => (
        <group key={anchor.id}>
          {anchor.inHandle && (
            <HandleDot
              position={anchor.inHandle}
              view={view}
              depth={depth}
              planeFrame={planeFrame}
              color={colors.handleDot}
            />
          )}
          {anchor.outHandle && (
            <HandleDot
              position={anchor.outHandle}
              view={view}
              depth={depth}
              planeFrame={planeFrame}
              color={colors.handleDot}
            />
          )}
          <AnchorSquare
            position={anchor.position}
            view={view}
            depth={depth}
            planeFrame={planeFrame}
            highlight={pendingIndex === i}
            closeTarget={
              (draft.closed || draft.closeTargetActive) && i === 0 && draft.anchors.length >= 3
            }
            colors={colors}
          />
        </group>
      ))}
    </group>
  )
}

import { useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ViewportLine } from './ViewportLine'
import { useShallow } from 'zustand/react/shallow'
import * as THREE from 'three'
import { useAppStore, type ViewType } from '../store/appStore'
import { planeToStroke3D } from '../utils/screenToWorld'
import type { StrokePlaneFrame } from '../stroke/worldProjection'
import { shapeDraftOutline } from '../vector/shapeDraftGeometry'
import { pathEndpoints } from '../vector/autoConnect'
import { generateShapeMesh } from '../mesh/lowPolyPrimitives'
import { projectMeshToView } from '../stroke/worldProjection'
import { finalizePerspectiveProjectedShapeMesh } from '../mesh/meshWinding'
import { PenVisuals } from './PenVisuals'
import { VectorPenVolumePreview } from './VectorPenVolumePreview'
import { useTheme } from '../theme/useTheme'
import { activeExtrudeMode } from '../stroke/drawExtrudeMode'

interface VectorCanvasProps {
  view: ViewType
}

function toLine(
  pts: { x: number; y: number }[],
  view: ViewType,
  depth: number,
  planeFrame?: StrokePlaneFrame | null
): [number, number, number][] {
  return pts.map((p) => {
    const v = planeToStroke3D(p.x, p.y, view, depth, planeFrame)
    return [v.x, v.y, v.z] as [number, number, number]
  })
}

export function VectorCanvas({ view }: VectorCanvasProps) {
  const { accentGreen } = useTheme()
  const {
    vectorDraft,
    vectorDraftView,
    vectorDraftPlane,
    vectorIsDrawing,
    vectorPenDraft,
    activeTool,
    activeShapeKind,
    activeColor,
    defaultDepth,
    autoConnectPaths,
    vectorDocument,
    strokeMode,
    sketchExtrudeMode,
    penExtrudeMode,
    polyBudget,
    roundedBoxRoundness,
    roundedBoxSubdivisions,
  } = useAppStore(
    useShallow((s) => ({
      vectorDraft: s.vectorDraft,
      vectorDraftView: s.vectorDraftView,
      vectorDraftPlane: s.vectorDraftPlane,
      vectorIsDrawing: s.vectorIsDrawing,
      vectorPenDraft: s.vectorPenDraft,
      activeTool: s.activeTool,
      activeShapeKind: s.activeShapeKind,
      activeColor: s.activeColor,
      defaultDepth: s.defaultDepth,
      autoConnectPaths: s.autoConnectPaths,
      vectorDocument: s.vectorDocument,
      strokeMode: s.strokeMode,
      sketchExtrudeMode: s.sketchExtrudeMode,
      penExtrudeMode: s.penExtrudeMode,
      polyBudget: s.polyBudget,
      roundedBoxRoundness: s.roundedBoxRoundness,
      roundedBoxSubdivisions: s.roundedBoxSubdivisions,
    }))
  )

  const extrudeOn = activeExtrudeMode({
    drawInputMode: 'vector-pen',
    sketchExtrudeMode,
    penExtrudeMode,
  })

  const color = useMemo(
    () => `#${activeColor.toString(16).padStart(6, '0')}`,
    [activeColor]
  )

  const shapeLine = useMemo(() => {
    if (!vectorIsDrawing || vectorDraftView !== view || vectorDraft.length < 2) return null
    if (activeTool !== 'vector-shape') return null
    if (vectorDraftView === 'perspective' && !vectorDraftPlane) return null
    if (activeShapeKind === 'roundedBox') return null
    const a = vectorDraft[0]
    const b = vectorDraft[vectorDraft.length - 1]
    return toLine(shapeDraftOutline(activeShapeKind, a, b), view, defaultDepth, vectorDraftPlane)
  }, [
    vectorIsDrawing,
    vectorDraftView,
    vectorDraftPlane,
    view,
    vectorDraft,
    activeTool,
    activeShapeKind,
    defaultDepth,
  ])

  const roundedBoxPreviewGeometry = useMemo(() => {
    if (
      !vectorIsDrawing ||
      vectorDraftView !== view ||
      vectorDraft.length < 2 ||
      activeTool !== 'vector-shape' ||
      activeShapeKind !== 'roundedBox'
    ) {
      return null
    }
    if (vectorDraftView === 'perspective' && !vectorDraftPlane) return null
    const a = vectorDraft[0]
    const b = vectorDraft[vectorDraft.length - 1]
    const mesh = generateShapeMesh(
      'roundedBox',
      a,
      b,
      polyBudget,
      activeColor,
      { roundness: roundedBoxRoundness, subdivisions: roundedBoxSubdivisions }
    )
    if (!mesh) return null
    projectMeshToView(mesh, view, defaultDepth, vectorDraftPlane)
    if (view === 'perspective' && vectorDraftPlane) {
      finalizePerspectiveProjectedShapeMesh(mesh, vectorDraftPlane)
    }
    const data = mesh.toMeshData(true, 0)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1))
    geo.computeVertexNormals()
    return geo
  }, [
    vectorIsDrawing,
    vectorDraftView,
    vectorDraftPlane,
    view,
    vectorDraft,
    activeTool,
    activeShapeKind,
    polyBudget,
    activeColor,
    defaultDepth,
    roundedBoxRoundness,
    roundedBoxSubdivisions,
  ])

  useEffect(() => () => roundedBoxPreviewGeometry?.dispose(), [roundedBoxPreviewGeometry])

  const snapLine = useMemo(() => {
    if (!autoConnectPaths || activeTool !== 'vector-pen') return null
    const pts: { x: number; y: number }[] = []
    for (const path of vectorDocument.paths) {
      if (path.view !== view || path.source !== 'pen' || path.closed) continue
      for (const ep of pathEndpoints(path)) {
        pts.push(ep.position)
      }
    }
    if (pts.length === 0) return null
    return toLine(pts, view, defaultDepth)
  }, [autoConnectPaths, activeTool, vectorDocument.paths, view, defaultDepth])

  const showFillPreview =
    strokeMode === 'outline' || strokeMode === 'blob' || strokeMode === 'capsule' || extrudeOn

  const invalidate = useThree((s) => s.invalidate)
  const penPreviewActive =
    (activeTool === 'vector-pen' || vectorPenDraft != null) &&
    vectorPenDraft?.view === view
  const vectorShapePreviewActive =
    activeTool === 'vector-shape' &&
    vectorIsDrawing &&
    vectorDraftView === view &&
    !(vectorDraftView === 'perspective' && !vectorDraftPlane)

  useFrame(() => {
    if (penPreviewActive || vectorShapePreviewActive) invalidate()
  })

  const overlayLine = {
    depthTest: false as const,
    depthWrite: false as const,
    toneMapped: false as const,
    transparent: true as const,
  }

  const showPen =
    (activeTool === 'vector-pen' || vectorPenDraft != null) &&
    vectorPenDraft != null &&
    vectorPenDraft.view === view &&
    !(vectorPenDraft.view === 'perspective' && !vectorPenDraft.planeFrame)

  if (
    !roundedBoxPreviewGeometry &&
    !(shapeLine && shapeLine.length >= 2) &&
    !showPen &&
    !(activeTool === 'vector-pen' && snapLine)
  ) {
    return null
  }

  return (
    <>
      {roundedBoxPreviewGeometry && (
        <mesh geometry={roundedBoxPreviewGeometry} renderOrder={21}>
          <meshStandardMaterial
            color={activeColor}
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {shapeLine && shapeLine.length >= 2 && (
        <ViewportLine
          points={shapeLine}
          color={color}
          lineWidth={2}
          opacity={0.85}
          renderOrder={24}
          {...overlayLine}
        />
      )}
      {showPen && <VectorPenVolumePreview view={view} />}
      {activeTool === 'vector-pen' && snapLine && (
        <ViewportLine
          points={snapLine}
          color={accentGreen}
          lineWidth={3}
          opacity={0.75}
          renderOrder={22}
          {...overlayLine}
        />
      )}
      {showPen && vectorPenDraft && (
        <PenVisuals
          draft={vectorPenDraft}
          view={view}
          depth={defaultDepth}
          showFillPreview={showFillPreview}
          extrudeMode={extrudeOn}
          strokeMode={strokeMode}
        />
      )}
    </>
  )
}

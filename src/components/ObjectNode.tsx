import { memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import { ThemedTransformControls } from './ThemedTransformControls'
import { useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import { useAppStore, type SelectionMode } from '../store/appStore'
import { ensureTransform, getObjectPivot, cloneTransform, transformFromObject3D, transformsEqual } from '../mesh/objectTransform'
import { registerPickTarget, unregisterPickTarget } from '../select/pickRegistry'
import { useViewportSlotIndex } from './viewport/ViewportRuntimeContext'
import { MeshRenderer, buildObjectSelectionBoundsGeometry } from './MeshRenderer'
import { MeshEditVisuals } from './MeshEditVisuals'
import { NormalVisuals } from './NormalVisuals'
import { SeamVisuals } from './SeamVisuals'
import type { SceneObject } from '../mesh/HalfEdgeMesh'
import type { ViewportDisplayMode } from '../rendering/viewportDisplay'
import { VIEWPORT_DISPLAY_CONFIG } from '../rendering/viewportDisplay'
import { showsObjectTransformGizmo, toolToGizmoMode } from '../viewport/viewportInteractionUtils'
import { useGizmoVisible, useTransformGizmoSettings } from '../hooks/useTransformGizmoSettings'
import { useTheme } from '../theme/useTheme'

function isComponentSelectionMode(mode: SelectionMode): boolean {
  return mode === 'vertex' || mode === 'edge' || mode === 'face'
}

/** World-axis-aligned bounds cage — stays upright and refits when the object rotates. */
function ObjectSelectionOutline({
  object,
  isPrimary,
}: {
  object: SceneObject
  isPrimary: boolean
}) {
  const { objectSelectOutline, objectSelectOutlineSecondary } = useTheme()
  const tr = ensureTransform(object)
  const geometry = useMemo(
    () => buildObjectSelectionBoundsGeometry(object),
    [
      object.positions,
      object.pivot?.x,
      object.pivot?.y,
      object.pivot?.z,
      tr.position.x,
      tr.position.y,
      tr.position.z,
      tr.rotation.x,
      tr.rotation.y,
      tr.rotation.z,
      tr.scale.x,
      tr.scale.y,
      tr.scale.z,
    ]
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} renderOrder={8} raycast={() => null}>
      <lineBasicMaterial
        color={isPrimary ? objectSelectOutline : objectSelectOutlineSecondary}
        transparent
        opacity={isPrimary ? 1 : 0.86}
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  )
}

interface ObjectNodeProps {
  object: SceneObject
  isSelected: boolean
  isPrimary: boolean
  isGizmoTarget: boolean
  facetExaggeration: number
  showDensityHeatmap: boolean
  selectionMode: SelectionMode
  viewportDisplayMode: ViewportDisplayMode
  viewportXRay: boolean
}

/**
 * Seams stay visible independent of selection mode so they can be reviewed
 * while unwrapping, but only while the UV editor is the active workflow.
 */
function ObjectSeamOverlay({
  object,
  cullBackfaces,
}: {
  object: SceneObject
  cullBackfaces: boolean
}) {
  const showSeams = useAppStore((s) => s.uvEditorOpen && s.uvEditorShowSeams)
  if (!showSeams || !object.seamEdges?.length) return null
  return <SeamVisuals object={object} cullBackfaces={cullBackfaces} />
}

function ObjectMeshEditOverlay({
  object,
  selectionMode,
  isSelected,
  showNormals,
}: {
  object: SceneObject
  selectionMode: SelectionMode
  isSelected: boolean
  showNormals: boolean
}) {
  const activeTool = useAppStore((s) => s.activeTool)
  const isDrawing = useAppStore((s) => s.isDrawing)
  const meshSelection = useAppStore((s) =>
    s.meshSelection?.objectId === object.id ? s.meshSelection : null
  )
  const meshHover = useAppStore((s) =>
    s.meshHover?.objectId === object.id ? s.meshHover : null
  )

  // Knife / loop-cut use their own overlays — hide edit handles so the view stays clean.
  if (isDrawing || activeTool === 'knife' || activeTool === 'loop-cut') {
    if (!showNormals) return null
    return (
      <NormalVisuals
        object={object}
        meshSelection={meshSelection}
        meshHover={meshHover}
      />
    )
  }

  const inComponentMode = isComponentSelectionMode(selectionMode)
  const showMeshEdit =
    inComponentMode &&
    (isSelected || meshSelection !== null || meshHover !== null)

  if (!showMeshEdit && !showNormals) return null

  return (
    <>
      {showMeshEdit && (
        <MeshEditVisuals
          object={object}
          selectionMode={selectionMode}
          meshSelection={meshSelection}
          meshHover={meshHover}
          showPickableOverlay={isSelected && inComponentMode}
        />
      )}
      {showNormals && (
        <NormalVisuals
          object={object}
          meshSelection={meshSelection}
          meshHover={meshHover}
        />
      )}
    </>
  )
}

/** Subscribes to activeTool only for the gizmo target — keeps other ObjectNodes memo-stable. */
function ObjectTransformGizmo({
  object,
  rootRef,
  draggingRef,
}: {
  object: SceneObject
  rootRef: RefObject<THREE.Group | null>
  draggingRef: React.MutableRefObject<boolean>
}) {
  const activeTool = useAppStore((s) => s.activeTool)
  const updateObjectTransform = useAppStore((s) => s.updateObjectTransform)
  const commitHistory = useAppStore((s) => s.commitHistory)
  const gizmoVisible = useGizmoVisible()
  const gizmoSettings = useTransformGizmoSettings()
  const glDomElement = useThree((s) => s.gl.domElement)
  const dragBaseTransformRef = useRef<ReturnType<typeof cloneTransform> | null>(null)

  if (!gizmoVisible || !showsObjectTransformGizmo(activeTool)) return null

  const syncFromGroup = () => {
    const g = rootRef.current
    if (!g) return
    const next = transformFromObject3D(g)
    const live = useAppStore.getState().objects.find((o) => o.id === object.id)
    const current = live ? ensureTransform(live) : null
    if (current && transformsEqual(next, current)) return
    updateObjectTransform(object.id, next)
  }

  return (
    <ThemedTransformControls
      object={rootRef as RefObject<THREE.Object3D>}
      domElement={glDomElement}
      mode={toolToGizmoMode(activeTool)}
      {...gizmoSettings}
      onMouseDown={() => {
        draggingRef.current = true
        dragBaseTransformRef.current = cloneTransform(ensureTransform(object))
      }}
      onMouseUp={() => {
        draggingRef.current = false
        const base = dragBaseTransformRef.current
        const g = rootRef.current
        if (base && g) {
          const final = transformFromObject3D(g)
          if (!transformsEqual(base, final)) {
            syncFromGroup()
            commitHistory('Transform')
          }
        }
        dragBaseTransformRef.current = null
      }}
      onObjectChange={() => {
        syncFromGroup()
      }}
    />
  )
}

function ObjectNodeInner({
  object,
  isSelected,
  isPrimary,
  isGizmoTarget,
  facetExaggeration,
  showDensityHeatmap,
  selectionMode,
  viewportDisplayMode,
  viewportXRay,
}: ObjectNodeProps) {
  const rootRef = useRef<THREE.Group>(null)
  const draggingRef = useRef(false)
  const slotIndex = useViewportSlotIndex()
  const isDrawing = useAppStore((s) => s.isDrawing)
  const pixelPaintFocus = useAppStore(
    (s) => isSelected && s.pixelEditorOpen
  )

  const tr = ensureTransform(object)
  const pivot = getObjectPivot(object)
  const showObjectGizmo =
    isGizmoTarget && isSelected && selectionMode === 'object' && !pixelPaintFocus
  const showSelectionOutline =
    !pixelPaintFocus && isSelected && selectionMode === 'object' && !isDrawing

  useEffect(() => {
    const g = rootRef.current
    if (!g || draggingRef.current) return
    g.position.set(tr.position.x, tr.position.y, tr.position.z)
    g.rotation.set(tr.rotation.x, tr.rotation.y, tr.rotation.z)
    g.scale.set(tr.scale.x, tr.scale.y, tr.scale.z)
  }, [tr, object.id])

  useEffect(() => {
    const g = rootRef.current
    if (!g) return
    registerPickTarget(slotIndex, object.id, g)
    return () => unregisterPickTarget(slotIndex, object.id)
  }, [object.id, slotIndex])

  return (
    <>
      <group ref={rootRef}>
        <group position={[-pivot.x, -pivot.y, -pivot.z]}>
          <MeshRenderer
            object={object}
            isSelected={isSelected}
            paintFocus={pixelPaintFocus}
            facetExaggeration={facetExaggeration}
            showDensityHeatmap={showDensityHeatmap}
            displayMode={viewportDisplayMode}
            viewportXRay={viewportXRay}
          />
          {!pixelPaintFocus && (
            <ObjectMeshEditOverlay
              object={object}
              selectionMode={selectionMode}
              isSelected={isSelected}
              showNormals={VIEWPORT_DISPLAY_CONFIG[viewportDisplayMode].showNormals}
            />
          )}
          <ObjectSeamOverlay object={object} cullBackfaces={!viewportXRay} />
        </group>
      </group>

      {showSelectionOutline && (
        <ObjectSelectionOutline object={object} isPrimary={isPrimary} />
      )}

      {showObjectGizmo && (
        <ObjectTransformGizmo object={object} rootRef={rootRef} draggingRef={draggingRef} />
      )}
    </>
  )
}

export const ObjectNode = memo(ObjectNodeInner, (prev, next) =>
  prev.object === next.object &&
  prev.isSelected === next.isSelected &&
  prev.isPrimary === next.isPrimary &&
  prev.isGizmoTarget === next.isGizmoTarget &&
  prev.facetExaggeration === next.facetExaggeration &&
  prev.showDensityHeatmap === next.showDensityHeatmap &&
  prev.selectionMode === next.selectionMode &&
  prev.viewportDisplayMode === next.viewportDisplayMode &&
  prev.viewportXRay === next.viewportXRay
)

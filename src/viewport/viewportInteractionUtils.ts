import { Vector3 } from 'three'
import type * as THREE from 'three'
import type { Camera } from 'three'
import type { SceneObject } from '../mesh/HalfEdgeMesh'
import type { ObjectTransform } from '../mesh/HalfEdgeMesh'
import type { MeshComponentSelection } from '../mesh/meshSelection'
import { expandFaceToPlanarRegion } from '../mesh/faceGroups'
import { edgeKey } from '../mesh/meshSelection'
import type { MeshPickHit } from '../select/meshPick'
import { resolveEffectiveMaterial } from '../material/materials'
import { pickMeshSurfaceUv, uvToPixelCoords } from '../pixel/uvPaint'
import {
  buildCameraDragPlane,
  buildVerticalHeightDragPlane,
  clientToCameraPlane,
  clientToPlane,
  planeToWorld3D,
} from '../utils/screenToWorld'
import { snapWorldToSceneGrid } from '../polyDraw/polyDrawSnap'
import { axisComponent, boundsCenter, type Axis } from '../primitives/viewAxes'
import type { WorldBox } from '../primitives/primitiveBoxMath'
import type { Vec3 } from '../utils/math'
import type { ViewType, ViewportSlotIndex } from '../scene/viewTypes'
import type { ActiveTool, SelectionMode } from '../store/appStore'
import type { ViewportStickyNav } from '../store/viewportSlice'
import { pickObjectAt } from '../select/objectPick'
import { pickMeshComponent } from '../select/meshPick'
import { selectionHasComponents } from '../mesh/meshSelection'

const MIN_PRIMITIVE_HEIGHT = 0.5

export const DRAW_TOOLS: ActiveTool[] = ['draw', 'boolean-hole']
export const VECTOR_TOOLS: ActiveTool[] = ['vector-pen', 'vector-shape', 'primitive-box', 'poly-draw']

/** Tools that draw via plain LMB in the viewport (OrbitControls must leave LEFT idle). */
export const VIEWPORT_CAD_DRAW_TOOLS: ActiveTool[] = [...VECTOR_TOOLS, ...DRAW_TOOLS]

export function isViewportCadDrawTool(tool: ActiveTool): boolean {
  return VIEWPORT_CAD_DRAW_TOOLS.includes(tool)
}

/** Tools that own plain LMB — OrbitControls must never map LEFT while active. */
export function isViewportLmbToolOwner(tool: ActiveTool): boolean {
  return (
    isViewportCadDrawTool(tool) ||
    SCULPT_TOOLS.includes(tool) ||
    MESH_EDIT_TOOLS.includes(tool) ||
    DEFORM_TOOLS.includes(tool) ||
    tool === 'round' ||
    tool === 'extrude'
  )
}

/** Screen-space movement below this is a click; above starts orbit/pan or object drag. */
export const VIEWPORT_CLICK_DRAG_THRESHOLD_PX = 8

/** Plain LMB on select/transform tools uses click-vs-drag threshold for picks; camera stays default orbit/pan. */
export function shouldDeferViewportClickToOrbit(
  _view: ViewType,
  activeTool: ActiveTool,
  selectionMode: SelectionMode,
  button: number,
  ctrlOrMeta = false
): boolean {
  if (ctrlOrMeta) return false
  if (button !== 0) return false
  if (isViewportLmbToolOwner(activeTool)) return false
  return (
    selectionMode === 'object' ||
    isComponentSelectionMode(selectionMode) ||
    activeTool === 'smart'
  )
}

function isLightWaveNavGadget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false
  return !!(target as Element).closest('[data-lw-nav]')
}

/**
 * Capture-phase gate: when LMB hits a draggable object/component under select/move tools,
 * OrbitControls must not arm on the same pointerdown (runs before bubble handlers).
 */
export function shouldCaptureBlockCameraForViewportDrag(
  event: Pick<PointerEvent, 'button' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'clientX' | 'clientY'>,
  target: EventTarget | null,
  view: ViewType,
  activeTool: ActiveTool,
  selectionMode: SelectionMode,
  stickyNav: ViewportStickyNav | null,
  rect: DOMRect,
  camera: Camera,
  slotIndex: ViewportSlotIndex,
  objects: SceneObject[],
  selectedObjectId: string | null,
  meshSelection: MeshComponentSelection | null,
  viewportXRay: boolean
): boolean {
  if (event.button !== 0) return false
  if (event.ctrlKey || event.metaKey) return false
  if (event.shiftKey) return false
  if (stickyNav) return false
  if (isLightWaveNavGadget(target)) return false
  if (!shouldDeferViewportClickToOrbit(view, activeTool, selectionMode, event.button, false)) {
    return false
  }

  const isObjectSelectTool =
    selectionMode === 'object' &&
    (activeTool === 'select-object' || activeTool === 'smart')
  const isObjectMoveTool = selectionMode === 'object' && activeTool === 'move'

  if (isObjectSelectTool || isObjectMoveTool) {
    const pickedObjectId = pickObjectAt(
      event.clientX,
      event.clientY,
      rect,
      camera,
      slotIndex
    )
    if (pickedObjectId) return true
  }

  if (isComponentSelectionMode(selectionMode) && canDragComponentSelection(activeTool)) {
    updateCameraMatrices(camera)
    const hit = pickMeshComponent(
      selectionMode,
      event.clientX,
      event.clientY,
      rect,
      camera,
      objects,
      meshSelection?.objectId ?? selectedObjectId,
      { cullBackVertices: !viewportXRay }
    )
    const hasComponent =
      hit && (hit.vertex !== undefined || hit.edge !== undefined || hit.face !== undefined)
    if (!hasComponent || !hit) return false

    const obj = objects.find((o) => o.id === hit.objectId)
    const sel = meshSelection
    const hitSelected =
      obj &&
      sel &&
      selectionHasComponents(sel) &&
      isHitInMeshSelection(hit, sel, selectionMode, obj)

    return !!(hitSelected && obj && sel)
  }

  return false
}
export const SCULPT_TOOLS: ActiveTool[] = ['push', 'pull', 'inflate', 'deflate', 'relax', 'pinch']
export const TRANSFORM_GIZMO_TOOLS: ActiveTool[] = ['move', 'rotate', 'scale']

/** Object-level gizmo tools: select/smart show translate; move/rotate/scale match tool mode. */
export const OBJECT_TRANSFORM_GIZMO_TOOLS: ActiveTool[] = [
  'select-object',
  'smart',
  ...TRANSFORM_GIZMO_TOOLS,
]

export function showsObjectTransformGizmo(tool: ActiveTool): boolean {
  return OBJECT_TRANSFORM_GIZMO_TOOLS.includes(tool)
}

export function toolToGizmoMode(tool: ActiveTool): 'translate' | 'rotate' | 'scale' {
  if (tool === 'rotate') return 'rotate'
  if (tool === 'scale') return 'scale'
  return 'translate'
}

export const DEFORM_TOOLS: ActiveTool[] = ['bend', 'round']
export const MESH_SELECT_TOOLS: ActiveTool[] = ['select-vertex', 'select-edge', 'select-face']
export const MESH_EDIT_TOOLS: ActiveTool[] = ['knife', 'mirror-knife', 'loop-cut']

export function isComponentSelectionMode(mode: SelectionMode): boolean {
  return mode === 'vertex' || mode === 'edge' || mode === 'face'
}

export function isBoxSelectInteraction(mode: SelectionMode, tool: ActiveTool): boolean {
  if (mode === 'object') {
    return tool === 'select-object' || tool === 'smart' || TRANSFORM_GIZMO_TOOLS.includes(tool)
  }
  return (
    isComponentSelectionMode(mode) &&
    (MESH_SELECT_TOOLS.includes(tool) || tool === 'smart' || tool === 'extrude' || TRANSFORM_GIZMO_TOOLS.includes(tool))
  )
}

/** Ctrl/Cmd+LMB drag owns marquee when box-select is available and sticky nav is not armed. */
export function shouldCtrlLmbBoxSelect(
  mode: SelectionMode,
  tool: ActiveTool,
  stickyNav: ViewportStickyNav | null
): boolean {
  if (!isBoxSelectInteraction(mode, tool)) return false
  if (stickyNav) return false
  return true
}

/** Primary button held during marquee pointer move/up. */
export const MARQUEE_BUTTONS_MASK = 1

/** Click-pick / multiselect while a component select or transform gizmo tool is active. */
export function canPickComponentSelection(tool: ActiveTool): boolean {
  return MESH_SELECT_TOOLS.includes(tool) || tool === 'smart' || tool === 'extrude' || TRANSFORM_GIZMO_TOOLS.includes(tool)
}

/** Free-drag the current component selection without using the gizmo (select tools + move). */
export function canDragComponentSelection(tool: ActiveTool): boolean {
  return MESH_SELECT_TOOLS.includes(tool) || tool === 'smart' || tool === 'move'
}

export function isHitInMeshSelection(
  hit: MeshPickHit,
  selection: MeshComponentSelection,
  mode: SelectionMode,
  object: SceneObject
): boolean {
  if (hit.objectId !== selection.objectId) return false
  if (mode === 'vertex' && hit.vertex !== undefined) {
    return selection.vertices.includes(hit.vertex)
  }
  if (mode === 'edge' && hit.edge) {
    return selection.edges.includes(edgeKey(hit.edge[0], hit.edge[1]))
  }
  if (mode === 'face' && hit.face !== undefined) {
    if (selection.faces.includes(hit.face)) return true
    const regionFaces = expandFaceToPlanarRegion(object, hit.face)
    return regionFaces.some((fi) => selection.faces.includes(fi))
  }
  return false
}

export type DragPlaneState = {
  view: ViewType
  startPlane?: { x: number; y: number }
  startWorld?: Vec3
  dragPlane?: THREE.Plane
}

export type ObjectDragState = DragPlaneState & {
  baseTransforms: Record<string, ObjectTransform>
  moved: boolean
}

export type ComponentDragState = DragPlaneState & {
  basePositions: Record<number, Vec3>
  moved: boolean
}

export function dragDeltaFromPointer(
  e: React.PointerEvent,
  drag: DragPlaneState,
  defaultDepth: number,
  getPlanePoint: (e: React.PointerEvent) => { x: number; y: number } | null,
  containerRef: React.RefObject<HTMLDivElement | null>,
  cameraRef: React.RefObject<THREE.Camera | null>
): Vec3 | null {
  const rect = containerRef.current?.getBoundingClientRect()
  const camera = cameraRef.current
  if (!rect || !camera) return null

  if (drag.startWorld && drag.dragPlane) {
    const w1 = clientToCameraPlane(e.clientX, e.clientY, rect, camera, drag.dragPlane)
    if (!w1) return null
    return {
      x: w1.x - drag.startWorld.x,
      y: w1.y - drag.startWorld.y,
      z: w1.z - drag.startWorld.z,
    }
  }

  if (!drag.startPlane) return null
  const pt = getPlanePoint(e)
  if (!pt) return null
  const w0 = planeToWorld3D(drag.startPlane.x, drag.startPlane.y, drag.view, defaultDepth)
  const w1 = planeToWorld3D(pt.x, pt.y, drag.view, defaultDepth)
  return { x: w1.x - w0.x, y: w1.y - w0.y, z: w1.z - w0.z }
}

export function beginCameraPlaneDrag(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  camera: THREE.Camera,
  throughPoint: Vec3
): { startWorld: Vec3; dragPlane: THREE.Plane } | null {
  const anchor = new Vector3(throughPoint.x, throughPoint.y, throughPoint.z)
  let plane = buildCameraDragPlane(camera, anchor)
  const hit = clientToCameraPlane(clientX, clientY, rect, camera, plane)
  if (!hit) return null
  plane = buildCameraDragPlane(camera, hit)
  return {
    startWorld: { x: hit.x, y: hit.y, z: hit.z },
    dragPlane: plane,
  }
}

export function pickPixelOnTexturedMesh(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  camera: THREE.Camera,
  objects: SceneObject[],
  objectId: string,
  docId: string,
  docW: number,
  docH: number
): { x: number; y: number } | null {
  const hit = pickMeshSurfaceUv(clientX, clientY, rect, camera, objects, objectId)
  if (!hit) return null
  const hitObj = objects.find((o) => o.id === hit.objectId)
  const mat = hitObj ? resolveEffectiveMaterial(hitObj) : null
  const effectiveDocId = mat?.textureId ?? hitObj?.id
  if (effectiveDocId !== docId) return null
  return uvToPixelCoords(hit.uv, docW, docH)
}

export function updateCameraMatrices(camera: THREE.Camera): void {
  camera.updateMatrixWorld()
  if ('updateProjectionMatrix' in camera && typeof camera.updateProjectionMatrix === 'function') {
    camera.updateProjectionMatrix()
  }
}

export function getViewPlanePoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  camera: THREE.Camera,
  view: ViewType,
  defaultDepth: number
): { x: number; y: number } | null {
  updateCameraMatrices(camera)
  return clientToPlane(clientX, clientY, rect, camera, view, defaultDepth)
}

/** Raycast pointer onto a camera-facing vertical plane; return extrude height from base Y. */
export function clientToHeightOnVerticalPlane(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  camera: THREE.Camera,
  baseBoxLocked: WorldBox,
  heightAxis: Axis,
  snapGrid: boolean
): number | null {
  updateCameraMatrices(camera)
  const center = boundsCenter(baseBoxLocked.min, baseBoxLocked.max)
  const plane = buildVerticalHeightDragPlane(camera, center)
  const hit = clientToCameraPlane(clientX, clientY, rect, camera, plane)
  if (!hit) return null

  const baseY = axisComponent(baseBoxLocked.min, heightAxis)
  let height = hit.y - baseY

  if (snapGrid) {
    const snappedTop = snapWorldToSceneGrid({
      x: center.x,
      y: baseY + height,
      z: center.z,
    })
    height = axisComponent(snappedTop, heightAxis) - baseY
  }

  return Math.max(MIN_PRIMITIVE_HEIGHT, height)
}

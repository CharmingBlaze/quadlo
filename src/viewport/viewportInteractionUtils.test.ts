import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  canDragComponentSelection,
  canPickComponentSelection,
  clientToHeightOnVerticalPlane,
  isBoxSelectInteraction,
  isComponentSelectionMode,
  MESH_EDIT_TOOLS,
  VIEWPORT_CAD_DRAW_TOOLS,
  VIEWPORT_CLICK_DRAG_THRESHOLD_PX,
  showsObjectTransformGizmo,
  shouldDeferViewportClickToOrbit,
  shouldCtrlLmbBoxSelect,
  shouldCaptureBlockCameraForViewportDrag,
  shouldCaptureGateSelectFreeDrag,
  shouldCaptureGateComponentDrag,
  meshHitHasComponent,
  isViewportLmbToolOwner,
  ownsViewportLeftButton,
} from './viewportInteractionUtils'
import { SCENE_GRID_CELL } from '../scene/units'
import type { WorldBox } from '../primitives/primitiveBoxMath'

describe('viewportInteractionUtils component tools', () => {
  it('recognizes vertex/edge/face modes', () => {
    expect(isComponentSelectionMode('vertex')).toBe(true)
    expect(isComponentSelectionMode('edge')).toBe(true)
    expect(isComponentSelectionMode('face')).toBe(true)
    expect(isComponentSelectionMode('object')).toBe(false)
  })

  it('allows picking with select and transform gizmo tools', () => {
    expect(canPickComponentSelection('select-vertex')).toBe(true)
    expect(canPickComponentSelection('select-edge')).toBe(true)
    expect(canPickComponentSelection('select-face')).toBe(true)
    expect(canPickComponentSelection('move')).toBe(true)
    expect(canPickComponentSelection('rotate')).toBe(true)
    expect(canPickComponentSelection('scale')).toBe(true)
    expect(canPickComponentSelection('smart')).toBe(true)
    expect(canPickComponentSelection('extrude')).toBe(true)
    expect(canPickComponentSelection('draw')).toBe(false)
  })

  it('allows free-drag only for select tools and move', () => {
    expect(canDragComponentSelection('select-vertex')).toBe(true)
    expect(canDragComponentSelection('move')).toBe(true)
    expect(canDragComponentSelection('smart')).toBe(true)
    expect(canDragComponentSelection('extrude')).toBe(false)
    expect(canDragComponentSelection('rotate')).toBe(false)
    expect(canDragComponentSelection('scale')).toBe(false)
  })

  it('enables box-select for component modes with all transform gizmos', () => {
    for (const mode of ['vertex', 'edge', 'face'] as const) {
      expect(isBoxSelectInteraction(mode, 'move')).toBe(true)
      expect(isBoxSelectInteraction(mode, 'rotate')).toBe(true)
      expect(isBoxSelectInteraction(mode, 'scale')).toBe(true)
      expect(isBoxSelectInteraction(mode, 'select-vertex')).toBe(true)
      expect(isBoxSelectInteraction(mode, 'smart')).toBe(true)
      expect(isBoxSelectInteraction(mode, 'extrude')).toBe(true)
    }
    expect(isBoxSelectInteraction('object', 'smart')).toBe(true)
  })

  it('arms Ctrl/Cmd+LMB marquee only when box-select is available without sticky nav', () => {
    expect(shouldCtrlLmbBoxSelect('object', 'select-object', null)).toBe(true)
    expect(shouldCtrlLmbBoxSelect('face', 'select-face', null)).toBe(true)
    expect(shouldCtrlLmbBoxSelect('object', 'select-object', 'pan')).toBe(false)
    expect(shouldCtrlLmbBoxSelect('object', 'draw', null)).toBe(false)
  })

  it('routes hover updates for every interactive topology cutting tool', () => {
    expect(MESH_EDIT_TOOLS).toEqual(expect.arrayContaining(['knife', 'mirror-knife', 'loop-cut']))
  })

  it('lists CAD draw tools that must keep plain LMB', () => {
    expect(VIEWPORT_CAD_DRAW_TOOLS).toEqual(
      expect.arrayContaining(['primitive-box', 'poly-draw', 'vector-pen', 'draw'])
    )
  })

  it('defers perspective LMB clicks for select and transform tools', () => {
    expect(shouldDeferViewportClickToOrbit('perspective', 'select-object', 'object', 0)).toBe(true)
    expect(shouldDeferViewportClickToOrbit('perspective', 'move', 'object', 0)).toBe(true)
    expect(shouldDeferViewportClickToOrbit('perspective', 'select-face', 'face', 0)).toBe(true)
    expect(shouldDeferViewportClickToOrbit('perspective', 'select-object', 'object', 0, true)).toBe(
      false
    )
    expect(shouldDeferViewportClickToOrbit('perspective', 'primitive-box', 'object', 0)).toBe(false)
    expect(shouldDeferViewportClickToOrbit('perspective', 'draw', 'object', 0)).toBe(false)
    expect(shouldDeferViewportClickToOrbit('perspective', 'poly-draw', 'object', 0)).toBe(false)
    expect(shouldDeferViewportClickToOrbit('perspective', 'vector-pen', 'object', 0)).toBe(false)
    expect(shouldDeferViewportClickToOrbit('perspective', 'vector-shape', 'object', 0)).toBe(false)
    expect(shouldDeferViewportClickToOrbit('perspective', 'push', 'object', 0)).toBe(false)
    expect(shouldDeferViewportClickToOrbit('front', 'select-object', 'object', 0)).toBe(true)
    expect(VIEWPORT_CLICK_DRAG_THRESHOLD_PX).toBeGreaterThanOrEqual(6)
  })

  it('gates select free-drag capture for select/move tools only', () => {
    const base = { button: 0, shiftKey: false, ctrlKey: false, metaKey: false }
    expect(shouldCaptureGateSelectFreeDrag(base, null, 'select-object', 'object', null)).toBe(true)
    expect(shouldCaptureGateSelectFreeDrag(base, null, 'move', 'object', null)).toBe(true)
    expect(shouldCaptureGateSelectFreeDrag(base, null, 'draw', 'object', null)).toBe(false)
    expect(
      shouldCaptureGateSelectFreeDrag({ ...base, shiftKey: true }, null, 'select-object', 'object', null)
    ).toBe(false)
    expect(shouldCaptureGateSelectFreeDrag(base, null, 'select-object', 'object', 'orbit')).toBe(false)
  })

  it('gates component-edit capture in vertex/edge/face modes', () => {
    const base = { button: 0, shiftKey: false, ctrlKey: false, metaKey: false }
    for (const mode of ['vertex', 'edge', 'face'] as const) {
      expect(shouldCaptureGateComponentDrag(base, null, 'select-vertex', mode, null)).toBe(true)
      expect(shouldCaptureGateComponentDrag(base, null, 'move', mode, null)).toBe(true)
      // Rotate/scale drive gizmos, so the camera gate stays out of their way.
      expect(shouldCaptureGateComponentDrag(base, null, 'rotate', mode, null)).toBe(false)
      expect(shouldCaptureGateComponentDrag(base, null, 'scale', mode, null)).toBe(false)
    }
    expect(shouldCaptureGateComponentDrag(base, null, 'select-vertex', 'object', null)).toBe(false)
    expect(shouldCaptureGateComponentDrag(base, null, 'select-vertex', 'vertex', 'orbit')).toBe(
      false
    )
    expect(
      shouldCaptureGateComponentDrag({ ...base, ctrlKey: true }, null, 'select-vertex', 'vertex', null)
    ).toBe(false)
    expect(
      shouldCaptureGateComponentDrag({ ...base, shiftKey: true }, null, 'select-vertex', 'vertex', null)
    ).toBe(false)
    expect(
      shouldCaptureGateComponentDrag({ ...base, button: 1 }, null, 'select-vertex', 'vertex', null)
    ).toBe(false)
  })

  it('treats a pick as editable only when it lands on a component', () => {
    expect(meshHitHasComponent(null)).toBe(false)
    expect(meshHitHasComponent({ objectId: 'a' } as never)).toBe(false)
    expect(meshHitHasComponent({ objectId: 'a', vertex: 2 } as never)).toBe(true)
    expect(meshHitHasComponent({ objectId: 'a', edge: [0, 1] } as never)).toBe(true)
    expect(meshHitHasComponent({ objectId: 'a', face: 3 } as never)).toBe(true)
  })

  it('does not capture-block camera for empty LMB or sticky nav', () => {
    const event = {
      button: 0,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      clientX: 0,
      clientY: 0,
    }
    const rect = { left: 0, top: 0, width: 100, height: 100 } as DOMRect
    const camera = new PerspectiveCamera()

    expect(
      shouldCaptureBlockCameraForViewportDrag(
        event,
        null,
        'perspective',
        'select-object',
        'object',
        null,
        rect,
        camera,
        0,
        [],
        null,
        null,
        false
      )
    ).toBe(false)

    expect(
      shouldCaptureBlockCameraForViewportDrag(
        event,
        null,
        'perspective',
        'select-object',
        'object',
        'orbit',
        rect,
        camera,
        0,
        [],
        null,
        null,
        false
      )
    ).toBe(false)

    expect(
      shouldCaptureBlockCameraForViewportDrag(
        { ...event, ctrlKey: true },
        null,
        'perspective',
        'select-object',
        'object',
        null,
        rect,
        camera,
        0,
        [],
        null,
        null,
        false
      )
    ).toBe(false)

    expect(
      shouldCaptureBlockCameraForViewportDrag(
        event,
        null,
        'perspective',
        'draw',
        'object',
        null,
        rect,
        camera,
        0,
        [],
        null,
        null,
        false
      )
    ).toBe(false)
  })

  it('shows object transform gizmo for select, smart, and transform tools', () => {
    expect(showsObjectTransformGizmo('select-object')).toBe(true)
    expect(showsObjectTransformGizmo('smart')).toBe(true)
    expect(showsObjectTransformGizmo('move')).toBe(true)
    expect(showsObjectTransformGizmo('rotate')).toBe(true)
    expect(showsObjectTransformGizmo('scale')).toBe(true)
    expect(showsObjectTransformGizmo('draw')).toBe(false)
    expect(showsObjectTransformGizmo('select-vertex')).toBe(false)
  })

  it('treats draw, sculpt, and mesh-edit tools as LMB owners', () => {
    expect(isViewportLmbToolOwner('draw')).toBe(true)
    expect(isViewportLmbToolOwner('poly-draw')).toBe(true)
    expect(isViewportLmbToolOwner('push')).toBe(true)
    expect(isViewportLmbToolOwner('knife')).toBe(true)
    expect(isViewportLmbToolOwner('select-object')).toBe(false)
  })

  it('hands LMB to paint-on-model regardless of the active tool', () => {
    expect(ownsViewportLeftButton('select-object', false)).toBe(false)
    expect(ownsViewportLeftButton('select-object', true)).toBe(true)
    expect(ownsViewportLeftButton('move', true)).toBe(true)
    // Tool ownership is unaffected when paint mode is off.
    expect(ownsViewportLeftButton('draw', false)).toBe(true)
  })

  it('stops select tools from deferring the click to orbit while painting', () => {
    expect(
      !ownsViewportLeftButton('select-object', true) &&
        shouldDeferViewportClickToOrbit('perspective', 'select-object', 'object', 0)
    ).toBe(false)
    expect(
      !ownsViewportLeftButton('select-object', false) &&
        shouldDeferViewportClickToOrbit('perspective', 'select-object', 'object', 0)
    ).toBe(true)
  })
})

describe('clientToHeightOnVerticalPlane', () => {
  const rect = { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 } as DOMRect

  function makeCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000)
    camera.position.set(12, 10, 12)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
    return camera
  }

  const flatBase: WorldBox = {
    min: { x: -4, y: 0, z: -4 },
    max: { x: 4, y: 0, z: 4 },
  }

  it('maps pointer Y on the vertical plane to extrude height from base', () => {
    const camera = makeCamera()
    const center = new Vector3(0, 0, 0).project(camera)
    const screenX = rect.left + (center.x * 0.5 + 0.5) * rect.width

    const worldOnPlane = new Vector3(0, 6, 0)
    worldOnPlane.project(camera)
    const highY = rect.top + (-worldOnPlane.y * 0.5 + 0.5) * rect.height

    const height = clientToHeightOnVerticalPlane(
      screenX,
      highY,
      rect,
      camera,
      flatBase,
      1,
      false
    )

    expect(height).not.toBeNull()
    expect(height!).toBeGreaterThan(5.5)
    expect(height!).toBeLessThan(6.5)
  })

  it('snaps top height to the scene grid when snap is enabled', () => {
    const camera = makeCamera()
    const center = new Vector3(0, 0, 0).project(camera)
    const screenX = rect.left + (center.x * 0.5 + 0.5) * rect.width

    const targetTop = SCENE_GRID_CELL * 2
    const worldOnPlane = new Vector3(0, targetTop + 3, 0)
    worldOnPlane.project(camera)
    const screenY = rect.top + (-worldOnPlane.y * 0.5 + 0.5) * rect.height

    const height = clientToHeightOnVerticalPlane(
      screenX,
      screenY,
      rect,
      camera,
      flatBase,
      1,
      true
    )

    expect(height).toBe(targetTop)
  })
})

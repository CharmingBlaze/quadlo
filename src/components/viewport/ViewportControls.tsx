import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MOUSE } from 'three'
import {
  popViewportLocalInteraction,
  pushViewportLocalInteraction,
} from '../../rendering/viewportFrameLoop'
import { invalidateViewport } from '../../rendering/viewportInvalidation'
import { useAppStore } from '../../store/appStore'
import type { ViewType } from '../../store/appStore'
import type { ViewportSlotIndex } from '../../scene/viewTypes'
import type { ViewportStickyNav } from '../../store/viewportSlice'
import {
  ownsViewportLeftButton,
  shouldCaptureBlockCameraForViewportDrag,
} from '../../viewport/viewportInteractionUtils'
import {
  clearViewportLeftButtonBlocked,
  isViewportLeftButtonBlocked,
  registerCameraNavigationReset,
  registerLeftButtonPolicyListener,
  runWithSyntheticOrbitEvents,
  setViewportLeftButtonBlocked,
  type DeferredOrbitArmEvent,
} from '../../viewport/viewportOrbitDeferral'
import type { SelectionMode } from '../../store/appStore'
import { useViewportRender } from '../ViewportRenderContext'

export type LightWaveNavMode = 'pan' | 'orbit' | 'dolly' | 'maximize'

/** Not ROTATE/DOLLY/PAN — OrbitControls leaves state NONE so CAD/tools keep LMB. */
const NO_LEFT_BUTTON = -1 as unknown as (typeof MOUSE)[keyof typeof MOUSE]

/** Blockbench-style defaults when no sticky nav or modifier override is active. */
const DEFAULT_PERSPECTIVE_NAV = 'orbit' as const
const DEFAULT_ORTHO_NAV = 'pan' as const

/** Perspective orbit — responsive flick with smooth inertial coast on release. */
export const ORBIT_ROTATE_SPEED = 1.18
export const ORBIT_DAMPING_FACTOR = 0.08

function resolvePrimaryNavigation(
  modifiers: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean },
  isPerspective: boolean
): 'orbit' | 'pan' | null {
  // Ctrl/Cmd+LMB is reserved for selection marquee — never map to camera drag.
  if (modifiers.ctrlKey || modifiers.metaKey) return null
  // Shift stays free for additive selection / CAD constraints unless Alt is also held.
  if (modifiers.shiftKey && modifiers.altKey) return 'pan'
  if (isPerspective && modifiers.altKey) return 'orbit'
  return null
}

export function leftMouseAction(
  navigation: 'orbit' | 'pan' | 'dolly' | null,
  isPerspective: boolean
): (typeof MOUSE)[keyof typeof MOUSE] {
  if (navigation === null) return NO_LEFT_BUTTON
  if (navigation === 'pan') return MOUSE.PAN
  if (navigation === 'dolly') return MOUSE.DOLLY
  if (navigation === 'orbit' && isPerspective) return MOUSE.ROTATE
  if (navigation === 'orbit') return MOUSE.PAN
  return NO_LEFT_BUTTON
}

export function defaultViewportNavigation(isPerspective: boolean): 'orbit' | 'pan' {
  return isPerspective ? DEFAULT_PERSPECTIVE_NAV : DEFAULT_ORTHO_NAV
}

export function resolveIdleLeftNavigation(
  activeTool: import('../../store/appStore').ActiveTool,
  isPerspective: boolean,
  stickyNav: ViewportStickyNav | null,
  _selectionMode: SelectionMode = 'object',
  pixelPaintOnModel = false
): 'orbit' | 'pan' | 'dolly' | null {
  const sticky = resolveStickyNavigation(stickyNav, isPerspective)
  if (sticky) return sticky
  if (ownsViewportLeftButton(activeTool, pixelPaintOnModel)) return null
  return defaultViewportNavigation(isPerspective)
}

/** Immediate camera bypass (MMB/RMB pan, sticky nav, gadgets) — not default LMB orbit or Ctrl+LMB. */
export function isExplicitViewportNavigation(
  event: Pick<PointerEvent, 'button' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>,
  target: EventTarget | null,
  isPerspective: boolean,
  stickyNav: ViewportStickyNav | null,
  _selectionMode?: SelectionMode,
  _activeTool?: import('../../store/appStore').ActiveTool,
  disableMiddlePan = false
): boolean {
  // Standard OrbitControls mapping: middle-drag pans in all views.
  if (event.button === 1) return !disableMiddlePan
  if (event.button === 2 && isPerspective) return true
  if (event.button !== 0) return false

  // Hard rule: Ctrl/Cmd+LMB never starts a camera gesture.
  if (event.ctrlKey || event.metaKey) return false

  const lw = resolveLightWaveNavTarget(target, isPerspective)
  if (lw === 'pan' || lw === 'orbit' || lw === 'dolly' || lw === 'maximize') return true

  const sticky = resolveStickyNavigation(stickyNav, isPerspective)
  if (sticky) return true

  if (event.shiftKey && event.altKey) return true
  return false
}

/** LightWave viewport gadget under the pointer, if any. */
export function resolveLightWaveNavTarget(
  target: EventTarget | null,
  isPerspective: boolean
): LightWaveNavMode | null {
  if (!target || typeof (target as Element).closest !== 'function') return null
  const gadget = (target as Element).closest('[data-lw-nav]')
  if (!gadget) return null
  const mode = gadget.getAttribute('data-lw-nav')
  if (mode === 'pan' || mode === 'dolly' || mode === 'maximize') return mode
  if (mode === 'orbit') return isPerspective ? 'orbit' : null
  return null
}

/** Resolve sticky nav for this viewport (orbit is perspective-only). */
export function resolveStickyNavigation(
  stickyNav: ViewportStickyNav | null,
  isPerspective: boolean
): ViewportStickyNav | null {
  if (!stickyNav) return null
  if (stickyNav === 'orbit' && !isPerspective) return null
  return stickyNav
}

/** Resolve OrbitControls LEFT mapping for a pointer event (used before controls handle it). */
export function resolveOrbitLeftNavigation(
  event: Pick<PointerEvent, 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>,
  target: EventTarget | null,
  isPerspective: boolean,
  activeTool: import('../../store/appStore').ActiveTool,
  stickyNav: ViewportStickyNav | null = null,
  _selectionMode: SelectionMode = 'object',
  pixelPaintOnModel = false
): 'orbit' | 'pan' | 'dolly' | null {
  // Hard rule: Ctrl/Cmd+LMB never maps to orbit/pan/dolly.
  if (event.ctrlKey || event.metaKey) return null

  const lw = resolveLightWaveNavTarget(target, isPerspective)

  // Draw/stroke/CAD/sculpt tools and model painting own LMB — only gadgets or
  // sticky nav may borrow it.
  if (ownsViewportLeftButton(activeTool, pixelPaintOnModel)) {
    if (lw === 'pan' || lw === 'orbit' || lw === 'dolly') return lw
    const sticky = resolveStickyNavigation(stickyNav, isPerspective)
    if (sticky) return sticky
    return null
  }

  let explicitNav: 'orbit' | 'pan' | 'dolly' | null =
    lw === 'pan' || lw === 'orbit' || lw === 'dolly'
      ? lw
      : lw === 'maximize'
        ? null
        : resolvePrimaryNavigation(event, isPerspective)
  if (!explicitNav) {
    explicitNav = resolveStickyNavigation(stickyNav, isPerspective)
  }
  if (explicitNav) return explicitNav
  return defaultViewportNavigation(isPerspective)
}

type OrbitMouseButtons = {
  LEFT: (typeof MOUSE)[keyof typeof MOUSE]
  MIDDLE?: (typeof MOUSE)[keyof typeof MOUSE]
  RIGHT?: (typeof MOUSE)[keyof typeof MOUSE]
}

type OrbitControlsRef = {
  mouseButtons: OrbitMouseButtons
  zoomSpeed: number
  enabled: boolean
}

const BASE_ZOOM_SPEED = 0.9
/** LightWave dolly: drag up zooms in (invert OrbitControls default Y sign). */
const DOLLY_ZOOM_SPEED = -BASE_ZOOM_SPEED

export function ViewportControls({
  rootRef,
  view,
  slotIndex,
  enableZoom = true,
  disableMiddlePan = false,
  trackViewportFrameLoop = true,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>
  view: ViewType
  slotIndex: ViewportSlotIndex
  enableZoom?: boolean
  disableMiddlePan?: boolean
  /** False for secondary canvases that are not part of the quad viewport registry. */
  trackViewportFrameLoop?: boolean
}) {
  const { layoutVisible } = useViewportRender()
  const invalidate = useThree((s) => s.invalidate)
  const camera = useThree((s) => s.camera)
  const activeTool = useAppStore((s) => s.activeTool)
  const selectionMode = useAppStore((s) => s.selectionMode)
  const stickyNav = useAppStore((s) => s.viewportStickyNav)
  const setViewportStickyNav = useAppStore((s) => s.setViewportStickyNav)
  const pixelPaintOnModel = useAppStore(
    (s) => s.pixelEditorOpen && s.pixelEditorPaintOnModel
  )
  const [domElement, setDomElement] = useState<HTMLElement | null>(null)
  const [primaryNavigation, setPrimaryNavigation] = useState<'orbit' | 'pan' | 'dolly' | null>(
    null
  )
  const controlsRef = useRef<OrbitControlsRef | null>(null)
  const interactionHeldRef = useRef(false)
  const objectDragHeldRef = useRef(false)
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPerspective = view === 'perspective'

  const applyMouseButtons = useCallback(
    (navigation: 'orbit' | 'pan' | 'dolly' | null) => {
      const controls = controlsRef.current
      if (!controls) return
      controls.mouseButtons.LEFT = leftMouseAction(navigation, isPerspective)
      controls.mouseButtons.MIDDLE = disableMiddlePan ? NO_LEFT_BUTTON : MOUSE.PAN
      // Blockbench-style: RMB pans in perspective; ortho keeps RMB idle.
      controls.mouseButtons.RIGHT = isPerspective ? MOUSE.PAN : NO_LEFT_BUTTON
      controls.zoomSpeed = BASE_ZOOM_SPEED
    },
    [disableMiddlePan, isPerspective]
  )

  const hardBlockCameraForObjectDrag = useCallback(() => {
    setViewportLeftButtonBlocked(true)
    setPrimaryNavigation(null)
    applyMouseButtons(null)
    const controls = controlsRef.current
    if (controls) {
      controls.enabled = false
      objectDragHeldRef.current = true
    }
  }, [applyMouseButtons])

  const releaseObjectDragCameraBlock = useCallback(() => {
    if (!objectDragHeldRef.current) return
    const controls = controlsRef.current
    if (controls) controls.enabled = true
    objectDragHeldRef.current = false
  }, [])

  const resolveIdleNavigation = useCallback((): 'orbit' | 'pan' | 'dolly' | null => {
    const state = useAppStore.getState()
    return resolveIdleLeftNavigation(
      state.activeTool,
      isPerspective,
      state.viewportStickyNav,
      state.selectionMode,
      state.pixelEditorOpen && state.pixelEditorPaintOnModel
    )
  }, [isPerspective])

  const restoreIdleNavigation = useCallback(() => {
    if (isViewportLeftButtonBlocked()) {
      setPrimaryNavigation(null)
      applyMouseButtons(null)
      return
    }
    const idle = resolveIdleNavigation()
    setPrimaryNavigation(idle)
    applyMouseButtons(idle)
  }, [applyMouseButtons, resolveIdleNavigation])

  useLayoutEffect(() => {
    if (rootRef.current) setDomElement(rootRef.current)
  }, [rootRef])

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current !== null) clearTimeout(releaseTimerRef.current)
      if (interactionHeldRef.current && trackViewportFrameLoop) {
        popViewportLocalInteraction(slotIndex)
      }
      setDomElement(null)
    }
  }, [slotIndex, trackViewportFrameLoop])

  useEffect(() => {
    const syncFromModifiers = (modifiers: {
      shiftKey: boolean
      altKey: boolean
      ctrlKey: boolean
      metaKey: boolean
    }) => {
      if (interactionHeldRef.current) return
      if (modifiers.ctrlKey || modifiers.metaKey) {
        setPrimaryNavigation(null)
        applyMouseButtons(null)
        return
      }
      const modifierState = useAppStore.getState()
      if (
        ownsViewportLeftButton(
          modifierState.activeTool,
          modifierState.pixelEditorOpen && modifierState.pixelEditorPaintOnModel
        )
      ) {
        restoreIdleNavigation()
        return
      }
      const next = resolvePrimaryNavigation(modifiers, isPerspective)
      if (next) {
        setPrimaryNavigation(next)
        applyMouseButtons(next)
      } else {
        restoreIdleNavigation()
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearViewportLeftButtonBlocked()
        if (useAppStore.getState().viewportStickyNav) {
          setViewportStickyNav(null)
          if (!interactionHeldRef.current) restoreIdleNavigation()
        } else if (!interactionHeldRef.current) {
          restoreIdleNavigation()
        }
        return
      }
      syncFromModifiers(event)
    }
    const clearNavigation = () => {
      clearViewportLeftButtonBlocked()
      if (interactionHeldRef.current) return
      restoreIdleNavigation()
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', clearNavigation)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', clearNavigation)
    }
  }, [activeTool, applyMouseButtons, isPerspective, restoreIdleNavigation, setViewportStickyNav])

  // Re-apply LMB mapping when sticky nav is toggled.
  useLayoutEffect(() => {
    if (interactionHeldRef.current) return
    restoreIdleNavigation()
  }, [stickyNav, restoreIdleNavigation])

  // Keep LMB/RMB mapping in sync when switching tools or selection mode, and
  // when paint-on-model claims or releases the left button.
  useLayoutEffect(() => {
    clearViewportLeftButtonBlocked()
    if (interactionHeldRef.current) return
    restoreIdleNavigation()
  }, [activeTool, selectionMode, pixelPaintOnModel, restoreIdleNavigation])

  // Capture runs before OrbitControls' bubble handler: pick first, then either
  // block LMB for object/component drag or map LEFT for camera. Never re-dispatch
  // synthetic pointerdown from here — that re-enters capture and freezes the UI.
  useLayoutEffect(() => {
    if (!domElement) return

    const onPointerDownCapture = (event: PointerEvent) => {
      if (event.button !== 0) return

      const state = useAppStore.getState()
      const rect = domElement.getBoundingClientRect()

      if (
        shouldCaptureBlockCameraForViewportDrag(
          event,
          event.target,
          view,
          state.activeTool,
          state.selectionMode,
          state.viewportStickyNav,
          rect,
          camera,
          slotIndex,
          state.objects,
          state.selectedObjectId,
          state.meshSelection,
          state.viewportXRay
        )
      ) {
        hardBlockCameraForObjectDrag()
        return
      }

      if (isViewportLeftButtonBlocked()) {
        setPrimaryNavigation(null)
        applyMouseButtons(null)
        return
      }
      if (event.ctrlKey || event.metaKey) {
        setPrimaryNavigation(null)
        applyMouseButtons(null)
        return
      }
      const next = resolveOrbitLeftNavigation(
        event,
        event.target,
        isPerspective,
        state.activeTool,
        state.viewportStickyNav,
        state.selectionMode,
        state.pixelEditorOpen && state.pixelEditorPaintOnModel
      )
      setPrimaryNavigation(next)
      applyMouseButtons(next)
    }

    const onPointerUpClear = () => {
      clearViewportLeftButtonBlocked()
      releaseObjectDragCameraBlock()
      if (!interactionHeldRef.current) restoreIdleNavigation()
    }

    domElement.addEventListener('pointerdown', onPointerDownCapture, true)
    window.addEventListener('pointerup', onPointerUpClear)
    window.addEventListener('pointercancel', onPointerUpClear)
    return () => {
      domElement.removeEventListener('pointerdown', onPointerDownCapture, true)
      window.removeEventListener('pointerup', onPointerUpClear)
      window.removeEventListener('pointercancel', onPointerUpClear)
    }
  }, [
    applyMouseButtons,
    camera,
    domElement,
    hardBlockCameraForObjectDrag,
    isPerspective,
    releaseObjectDragCameraBlock,
    restoreIdleNavigation,
    slotIndex,
    view,
  ])

  const resetCameraNavigation = useCallback(
    (event?: DeferredOrbitArmEvent) => {
      const element = domElement
      if (!element) return
      setPrimaryNavigation(null)
      applyMouseButtons(null)
      runWithSyntheticOrbitEvents(() => {
        const common: PointerEventInit = {
          bubbles: false,
          cancelable: true,
          clientX: event?.clientX ?? 0,
          clientY: event?.clientY ?? 0,
          pointerId: event?.pointerId ?? 1,
          pointerType: event?.pointerType ?? 'mouse',
          view: window,
        }
        element.dispatchEvent(
          new PointerEvent('pointerup', {
            ...common,
            button: event?.button ?? 0,
            buttons: 0,
          })
        )
      })
    },
    [applyMouseButtons, domElement]
  )

  useEffect(() => {
    registerCameraNavigationReset(slotIndex, resetCameraNavigation)
    return () => {
      registerCameraNavigationReset(slotIndex, null)
    }
  }, [resetCameraNavigation, slotIndex])

  useEffect(() => {
    return registerLeftButtonPolicyListener(() => {
      const controls = controlsRef.current
      if (isViewportLeftButtonBlocked()) {
        setPrimaryNavigation(null)
        applyMouseButtons(null)
        if (controls) {
          controls.enabled = false
          objectDragHeldRef.current = true
        }
      } else {
        releaseObjectDragCameraBlock()
        if (!interactionHeldRef.current) restoreIdleNavigation()
      }
    })
  }, [applyMouseButtons, releaseObjectDragCameraBlock, restoreIdleNavigation])

  // Initial LMB mapping: perspective orbit / ortho pan unless a tool owns LMB.
  useLayoutEffect(() => {
    restoreIdleNavigation()
  }, [restoreIdleNavigation])

  // Block browser middle-click autoscroll so OrbitControls keeps the drag.
  useEffect(() => {
    if (!domElement || disableMiddlePan) return

    const preventMiddleClickDefault = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault()
    }

    domElement.addEventListener('auxclick', preventMiddleClickDefault)
    domElement.addEventListener('mousedown', preventMiddleClickDefault)
    return () => {
      domElement.removeEventListener('auxclick', preventMiddleClickDefault)
      domElement.removeEventListener('mousedown', preventMiddleClickDefault)
    }
  }, [disableMiddlePan, domElement])

  const handleControlsChange = useCallback(() => {
    if (layoutVisible) invalidateViewport(slotIndex, 'camera')
    else invalidate()
  }, [invalidate, layoutVisible, slotIndex])

  const handleControlsStart = useCallback(() => {
    // Belt-and-suspenders: never let orbit run while object free-drag owns LMB.
    if (isViewportLeftButtonBlocked() || objectDragHeldRef.current) {
      const controls = controlsRef.current
      if (controls) {
        controls.enabled = false
        controls.mouseButtons.LEFT = NO_LEFT_BUTTON
      }
      return
    }
    if (releaseTimerRef.current !== null) {
      clearTimeout(releaseTimerRef.current)
      releaseTimerRef.current = null
    }
    const controls = controlsRef.current
    if (controls?.mouseButtons.LEFT === MOUSE.DOLLY) {
      controls.zoomSpeed = DOLLY_ZOOM_SPEED
    }
    if (!interactionHeldRef.current) {
      interactionHeldRef.current = true
      if (trackViewportFrameLoop) pushViewportLocalInteraction(slotIndex)
    }
  }, [slotIndex, trackViewportFrameLoop])

  const handleControlsEnd = useCallback(() => {
    if (releaseTimerRef.current !== null) clearTimeout(releaseTimerRef.current)
    releaseTimerRef.current = setTimeout(() => {
      releaseTimerRef.current = null
      if (!interactionHeldRef.current) return
      interactionHeldRef.current = false
      if (trackViewportFrameLoop) popViewportLocalInteraction(slotIndex)
      if (!isViewportLeftButtonBlocked()) restoreIdleNavigation()
    }, 260)
  }, [restoreIdleNavigation, slotIndex, trackViewportFrameLoop])

  if (!domElement) return null

  return (
    <OrbitControls
      ref={controlsRef as never}
      domElement={domElement}
      makeDefault
      enableDamping
      dampingFactor={ORBIT_DAMPING_FACTOR}
      enableRotate={isPerspective}
      enablePan
      enableZoom={enableZoom}
      zoomSpeed={0.9}
      panSpeed={isPerspective ? 0.9 : 1.05}
      rotateSpeed={ORBIT_ROTATE_SPEED}
      screenSpacePanning={!isPerspective}
      onChange={handleControlsChange}
      onStart={handleControlsStart}
      onEnd={handleControlsEnd}
      mouseButtons={{
        LEFT: leftMouseAction(primaryNavigation, isPerspective),
        MIDDLE: disableMiddlePan ? NO_LEFT_BUTTON : MOUSE.PAN,
        RIGHT: isPerspective ? MOUSE.PAN : NO_LEFT_BUTTON,
      }}
    />
  )
}

export { resolvePrimaryNavigation }

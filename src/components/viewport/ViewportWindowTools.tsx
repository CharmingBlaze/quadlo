import type { ReactNode } from 'react'
import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../store/appStore'
import { resolveTargetObjectIds } from '../../material/materialEditorSlice'
import { computeSelectionFitFrame } from '../../viewport/fitViewports'
import type { ViewType, ViewportSlotIndex } from '../../scene/viewTypes'
import { normalizeViewType } from '../../scene/viewTypes'

function ToolSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      className="viewport-lw-icon"
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

function PanIcon() {
  return (
    <ToolSvg>
      <path d="M8 1.5v13M1.5 8h13" />
      <path d="m8 1.5-2 2.2M8 1.5l2 2.2M8 14.5l-2-2.2M8 14.5l2-2.2" />
      <path d="m1.5 8 2.2-2M1.5 8l2.2 2M14.5 8l-2.2-2M14.5 8l-2.2 2" />
    </ToolSvg>
  )
}

function RotateIcon() {
  return (
    <ToolSvg>
      <path d="M12.6 6.2A4.8 4.8 0 1 0 11.8 12" />
      <path d="M12.6 3.4v3.2H9.4" />
    </ToolSvg>
  )
}

function ZoomIcon() {
  return (
    <ToolSvg>
      <circle cx="7" cy="7" r="4.2" />
      <path d="m10.2 10.2 3.3 3.3" />
    </ToolSvg>
  )
}

function FrameIcon() {
  return (
    <ToolSvg>
      <rect x="2.5" y="2.5" width="11" height="11" rx="0.8" />
      <path d="M6 2.5v2.5M10 2.5v2.5M6 11v2.5M10 11v2.5M2.5 6h2.5M2.5 10h2.5M11 6h2.5M11 10h2.5" />
    </ToolSvg>
  )
}

function LayoutToggleIcon({ vertical }: { vertical: boolean }) {
  return (
    <ToolSvg>
      {vertical ? (
        <>
          <path d="M5.5 3.5v9M8 3.5v9M10.5 3.5v9" />
        </>
      ) : (
        <>
          <path d="M3.5 5.5h9M3.5 8h9M3.5 10.5h9" />
        </>
      )}
    </ToolSvg>
  )
}

function MaximizeIcon({ maximized }: { maximized: boolean }) {
  return (
    <ToolSvg>
      {maximized ? (
        <>
          <rect x="3.2" y="3.2" width="6.2" height="6.2" />
          <path d="M8.2 7.8h4.6v4.6H8.2z" />
        </>
      ) : (
        <>
          <rect x="2.8" y="2.8" width="10.4" height="10.4" />
          <path d="M8.5 8.5h4.2v4.2" />
        </>
      )}
    </ToolSvg>
  )
}

function stopViewportEvent(e: React.SyntheticEvent) {
  e.stopPropagation()
}

export function ViewportWindowTools({
  view,
  slotIndex,
  onActivate,
}: {
  view: ViewType
  slotIndex: ViewportSlotIndex
  onActivate: () => void
}) {
  const isPerspective = normalizeViewType(view) === 'perspective'
  const {
    maximizedSlot,
    toggleMaximizedView,
    objects,
    selectedObjectId,
    selectionObjectIds,
    requestViewportFit,
    viewportStickyNav,
    setViewportStickyNav,
    viewportLwToolsLayout,
    setViewportLwToolsLayout,
  } = useAppStore(
    useShallow((s) => ({
      maximizedSlot: s.maximizedSlot,
      toggleMaximizedView: s.toggleMaximizedView,
      objects: s.objects,
      selectedObjectId: s.selectedObjectId,
      selectionObjectIds: s.selectionObjectIds,
      requestViewportFit: s.requestViewportFit,
      viewportStickyNav: s.viewportStickyNav,
      setViewportStickyNav: s.setViewportStickyNav,
      viewportLwToolsLayout: s.viewportLwToolsLayout,
      setViewportLwToolsLayout: s.setViewportLwToolsLayout,
    }))
  )
  const maximized = maximizedSlot === slotIndex

  const suppressToggleClickRef = useRef(false)
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null)

  const targetIds = resolveTargetObjectIds(selectedObjectId, selectionObjectIds)
  const canFrame = targetIds.some((id) => {
    const obj = objects.find((o) => o.id === id)
    return !!obj && obj.positions.length > 0
  })

  const beginDragTool = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    suppressToggleClickRef.current = false
    pointerOriginRef.current = { x: e.clientX, y: e.clientY }
    // Let the panel capture listener map LEFT → pan/orbit/dolly, then OrbitControls
    // owns the drag. Do not stopPropagation — LightWave gadgets drive the same surface.
    onActivate()
  }

  const trackNavDrag = (e: React.PointerEvent) => {
    const origin = pointerOriginRef.current
    if (!origin) return
    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    if (dx * dx + dy * dy > 36) suppressToggleClickRef.current = true
  }

  const endNavDrag = () => {
    pointerOriginRef.current = null
  }

  const toggleStickyNav = (mode: 'pan' | 'orbit' | 'dolly') => (e: React.MouseEvent) => {
    stopViewportEvent(e)
    if (suppressToggleClickRef.current) {
      suppressToggleClickRef.current = false
      return
    }
    onActivate()
    setViewportStickyNav(viewportStickyNav === mode ? null : mode)
  }

  const handleFrame = (e: React.MouseEvent) => {
    stopViewportEvent(e)
    onActivate()
    const frame = computeSelectionFitFrame(objects, targetIds)
    if (frame) requestViewportFit(frame)
  }

  const beginMaximize = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    stopViewportEvent(e)
    e.preventDefault()
    onActivate()
  }

  const onMaximizeClick = (e: React.MouseEvent) => {
    stopViewportEvent(e)
    toggleMaximizedView(slotIndex)
  }

  const isVerticalLayout = viewportLwToolsLayout === 'right-middle'

  const toggleLayout = (e: React.MouseEvent) => {
    stopViewportEvent(e)
    onActivate()
    setViewportLwToolsLayout(isVerticalLayout ? 'top-right' : 'right-middle')
  }

  return (
    <div
      className={`viewport-lw-tools${isPerspective ? ' is-perspective' : ' is-ortho'}${isVerticalLayout ? ' is-vertical' : ''}`}
      role="toolbar"
      aria-label={isPerspective ? 'Perspective view tools' : 'Orthographic view tools'}
      onClick={stopViewportEvent}
      onContextMenu={stopViewportEvent}
    >
      <button
        type="button"
        className="viewport-lw-btn"
        data-lw-nav="pan"
        title={isPerspective ? 'Pan (click to arm, drag)' : 'Pan view plane (click to arm, drag)'}
        aria-label="Pan"
        aria-pressed={viewportStickyNav === 'pan'}
        onClick={toggleStickyNav('pan')}
        onPointerDown={beginDragTool}
        onPointerMove={trackNavDrag}
        onPointerUp={endNavDrag}
        onPointerCancel={endNavDrag}
      >
        <PanIcon />
      </button>
      <button
        type="button"
        className={`viewport-lw-btn${isPerspective ? '' : ' is-disabled'}`}
        data-lw-nav={isPerspective ? 'orbit' : undefined}
        title={isPerspective ? 'Rotate (click to arm, drag)' : 'Rotate unavailable in ortho views'}
        aria-label="Rotate"
        aria-disabled={!isPerspective}
        aria-pressed={isPerspective && viewportStickyNav === 'orbit'}
        tabIndex={isPerspective ? 0 : -1}
        onClick={isPerspective ? toggleStickyNav('orbit') : stopViewportEvent}
        onPointerDown={
          isPerspective
            ? beginDragTool
            : (e) => {
                stopViewportEvent(e)
                e.preventDefault()
              }
        }
        onPointerMove={isPerspective ? trackNavDrag : undefined}
        onPointerUp={isPerspective ? endNavDrag : undefined}
        onPointerCancel={isPerspective ? endNavDrag : undefined}
      >
        <RotateIcon />
      </button>
      <button
        type="button"
        className="viewport-lw-btn"
        data-lw-nav="dolly"
        title={isPerspective ? 'Zoom (click to arm, drag)' : 'Zoom ortho (click to arm, drag)'}
        aria-label="Zoom"
        aria-pressed={viewportStickyNav === 'dolly'}
        onClick={toggleStickyNav('dolly')}
        onPointerDown={beginDragTool}
        onPointerMove={trackNavDrag}
        onPointerUp={endNavDrag}
        onPointerCancel={endNavDrag}
      >
        <ZoomIcon />
      </button>
      <span className="viewport-lw-divider" aria-hidden />
      <button
        type="button"
        className="viewport-lw-btn viewport-lw-btn-frame"
        title="Frame selected"
        aria-label="Frame selected"
        disabled={!canFrame}
        onClick={handleFrame}
      >
        <FrameIcon />
      </button>
      <button
        type="button"
        className="viewport-lw-btn"
        data-lw-nav="maximize"
        title={maximized ? 'Restore quad view (Space)' : 'Maximize view (Space)'}
        aria-label={maximized ? 'Restore quad view' : 'Maximize view'}
        aria-pressed={maximized}
        onPointerDown={beginMaximize}
        onClick={onMaximizeClick}
      >
        <MaximizeIcon maximized={maximized} />
      </button>
      <span className="viewport-lw-divider" aria-hidden />
      <button
        type="button"
        className="viewport-lw-btn viewport-lw-btn-layout"
        title={isVerticalLayout ? 'Move view tools to top-right bar' : 'Move view tools to right-side rail'}
        aria-label={isVerticalLayout ? 'Use top-right view tools bar' : 'Use right-side view tools rail'}
        aria-pressed={isVerticalLayout}
        onClick={toggleLayout}
      >
        <LayoutToggleIcon vertical={isVerticalLayout} />
      </button>
    </div>
  )
}

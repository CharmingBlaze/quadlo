import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store/appStore'
import type { ViewType } from '../store/appStore'
import {
  getViewLabel,
  normalizeViewType,
  VIEWPORT_VIEW_OPTIONS,
  type SelectableViewType,
  type ViewportSlotIndex,
} from '../scene/viewTypes'
import {
  computeObjectsFitFrame,
  computeSelectionFitFrame,
} from '../viewport/fitViewports'
import { resolveTargetObjectIds } from '../material/materialEditorSlice'

interface ViewportViewPickerProps {
  view: ViewType
  slotIndex: ViewportSlotIndex
  isActive: boolean
  onSelect: (view: SelectableViewType) => void
}

function stopViewportEvent(e: SyntheticEvent) {
  e.stopPropagation()
}

function FrameIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="0.8" />
      <path d="M6 2.5v2.5M10 2.5v2.5M6 11v2.5M10 11v2.5M2.5 6h2.5M2.5 10h2.5M11 6h2.5M11 10h2.5" />
    </svg>
  )
}

export function ViewportViewPicker({ view, slotIndex, isActive, onSelect }: ViewportViewPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const currentLabel = getViewLabel(view).toUpperCase()
  const currentView = normalizeViewType(view)

  const {
    objects,
    selectedObjectId,
    selectionObjectIds,
    requestViewportFit,
    requestViewportReset,
    toggleMaximizedView,
    maximizedSlot,
  } = useAppStore(
    useShallow((s) => ({
      objects: s.objects,
      selectedObjectId: s.selectedObjectId,
      selectionObjectIds: s.selectionObjectIds,
      requestViewportFit: s.requestViewportFit,
      requestViewportReset: s.requestViewportReset,
      toggleMaximizedView: s.toggleMaximizedView,
      maximizedSlot: s.maximizedSlot,
    }))
  )

  const targetIds = resolveTargetObjectIds(selectedObjectId, selectionObjectIds)
  const canFrameSelected = targetIds.some((id) => {
    const obj = objects.find((o) => o.id === id)
    return !!obj && obj.positions.length > 0
  })
  const canFrameAll = objects.some((o) => o.positions.length > 0)
  const maximized = maximizedSlot === slotIndex

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleFrameSelected = () => {
    const frame = computeSelectionFitFrame(objects, targetIds)
    if (frame) requestViewportFit(frame)
    setOpen(false)
  }

  const handleFrameAll = () => {
    const frame = computeObjectsFitFrame(objects)
    if (frame) requestViewportFit(frame)
    setOpen(false)
  }

  const handleReset = () => {
    requestViewportReset()
    setOpen(false)
  }

  const handleMaximize = () => {
    toggleMaximizedView(slotIndex)
    setOpen(false)
  }

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    stopViewportEvent(e)
    toggleMaximizedView(slotIndex)
  }

  return (
    <div className="viewport-view-picker" ref={rootRef}>
      <button
        type="button"
        className={`viewport-label viewport-view-picker-trigger${isActive ? ' is-active-pane' : ''}`}
        aria-label="Change viewport view"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          stopViewportEvent(e)
          setOpen((wasOpen) => !wasOpen)
        }}
        onDoubleClick={handleTitleDoubleClick}
        onPointerDown={stopViewportEvent}
        title="Double-click to maximize · click for view menu"
      >
        {currentLabel}
      </button>
      {open && (
        <div className="viewport-view-picker-menu" role="menu">
          <div className="viewport-view-picker-section">View type</div>
          {VIEWPORT_VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              className={`viewport-view-picker-item ${currentView === option.id ? 'active' : ''}`}
              onClick={(e) => {
                stopViewportEvent(e)
                onSelect(option.id)
                setOpen(false)
              }}
              onPointerDown={stopViewportEvent}
            >
              {option.label}
            </button>
          ))}
          <div className="viewport-view-picker-divider" role="separator" />
          <div className="viewport-view-picker-section">Navigation</div>
          <button
            type="button"
            role="menuitem"
            className="viewport-view-picker-item viewport-view-picker-action"
            disabled={!canFrameSelected}
            onClick={(e) => {
              stopViewportEvent(e)
              handleFrameSelected()
            }}
            onPointerDown={stopViewportEvent}
          >
            <FrameIcon />
            Frame selected
          </button>
          <button
            type="button"
            role="menuitem"
            className="viewport-view-picker-item viewport-view-picker-action"
            disabled={!canFrameAll}
            onClick={(e) => {
              stopViewportEvent(e)
              handleFrameAll()
            }}
            onPointerDown={stopViewportEvent}
          >
            <FrameIcon />
            Frame all
          </button>
          <button
            type="button"
            role="menuitem"
            className="viewport-view-picker-item viewport-view-picker-action"
            onClick={(e) => {
              stopViewportEvent(e)
              handleReset()
            }}
            onPointerDown={stopViewportEvent}
          >
            Reset view
          </button>
          <button
            type="button"
            role="menuitem"
            className="viewport-view-picker-item viewport-view-picker-action"
            onClick={(e) => {
              stopViewportEvent(e)
              handleMaximize()
            }}
            onPointerDown={stopViewportEvent}
          >
            {maximized ? 'Restore quad' : 'Maximize'}
          </button>
        </div>
      )}
    </div>
  )
}

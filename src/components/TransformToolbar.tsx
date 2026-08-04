import { useEffect, useRef, useState } from 'react'
import { useAppStore, type SelectionMode } from '../store/appStore'

const SELECTION_MODES: { id: SelectionMode; label: string; title: string }[] = [
  { id: 'object', label: 'Object', title: 'Select objects (1)' },
  { id: 'vertex', label: 'Vertex', title: 'Select vertices (2)' },
  { id: 'edge', label: 'Edge', title: 'Select edges (3)' },
  { id: 'face', label: 'Face', title: 'Select faces (4)' },
]

/** Vertical draggable selection & transform panel anchored on the left side of the screen, using active theme CSS variables. */
export function TransformToolbar() {
  const show = useAppStore((s) => s.showTransformBar)
  const setShow = useAppStore((s) => s.setShowTransformBar)
  const setActiveTool = useAppStore((s) => s.setActiveTool)
  const activateSelectTool = useAppStore((s) => s.activateSelectTool)
  const setSelectionMode = useAppStore((s) => s.setSelectionMode)
  const activeTool = useAppStore((s) => s.activeTool)
  const selectionMode = useAppStore((s) => s.selectionMode)

  const [customPos, setCustomPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const isSelectTool =
    activeTool === 'select-object' ||
    activeTool === 'select-vertex' ||
    activeTool === 'select-edge' ||
    activeTool === 'select-face'

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      setCustomPos({
        x: drag.origX + event.clientX - drag.startX,
        y: drag.origY + event.clientY - drag.startY,
      })
    }
    const onEnd = () => {
      dragRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className="transform-toolbar vertical-toolbar"
      style={{
        position: 'fixed',
        left: customPos ? `${customPos.x}px` : '16px',
        top: customPos ? `${customPos.y}px` : '50%',
        transform: customPos ? 'none' : 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '76px',
        padding: '6px 4px',
        backgroundColor: 'var(--bg-panel, #14171d)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border, #3a3f4d)',
        borderRadius: 'var(--radius, 6px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 1000,
        userSelect: 'none',
      }}
      role="toolbar"
      aria-label="Selection and Transform tools"
    >
      <div
        className="transform-toolbar-handle"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          const rect = event.currentTarget.parentElement?.getBoundingClientRect()
          const currentX = rect ? rect.left : 16
          const currentY = rect ? rect.top : (window.innerHeight / 2 - 150)
          dragRef.current = { startX: event.clientX, startY: event.clientY, origX: currentX, origY: currentY }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        style={{ width: '100%', height: '10px', cursor: 'grab', marginBottom: '4px', backgroundColor: 'var(--border, #2a2d34)', borderRadius: '3px' }}
        title="Drag to move panel"
        aria-label="Move panel"
      />

      <span className="transform-toolbar-label" style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted, #8a8f9e)', textAlign: 'center', marginBottom: '2px', fontWeight: 600 }}>
        Selection
      </span>

      {SELECTION_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={`side-btn ${isSelectTool && selectionMode === mode.id ? 'active' : ''}`}
          onClick={() => setSelectionMode(mode.id)}
          title={mode.title}
          style={{ width: '100%', marginBottom: '2px', padding: '4px', fontSize: '10px', height: 'auto' }}
        >
          {mode.label}
        </button>
      ))}

      <div style={{ height: '1px', backgroundColor: 'var(--border, #3a3f4d)', margin: '4px 0' }} />

      <span className="transform-toolbar-label" style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted, #8a8f9e)', textAlign: 'center', marginBottom: '2px', fontWeight: 600 }}>
        Transform
      </span>

      <button
        type="button"
        className={`side-btn ${isSelectTool ? 'active' : ''}`}
        onClick={activateSelectTool}
        title="Select (G)"
        style={{ width: '100%', marginBottom: '2px', padding: '4px', fontSize: '10px', height: 'auto' }}
      >
        Select
      </button>

      <button
        type="button"
        className={`side-btn ${activeTool === 'move' ? 'active' : ''}`}
        onClick={() => setActiveTool('move')}
        title="Move (M)"
        style={{ width: '100%', marginBottom: '2px', padding: '4px', fontSize: '10px', height: 'auto' }}
      >
        Move
      </button>

      <button
        type="button"
        className={`side-btn ${activeTool === 'rotate' ? 'active' : ''}`}
        onClick={() => setActiveTool('rotate')}
        title="Rotate (R)"
        style={{ width: '100%', marginBottom: '2px', padding: '4px', fontSize: '10px', height: 'auto' }}
      >
        Rotate
      </button>

      <button
        type="button"
        className={`side-btn ${activeTool === 'scale' ? 'active' : ''}`}
        onClick={() => setActiveTool('scale')}
        title="Scale (S)"
        style={{ width: '100%', marginBottom: '4px', padding: '4px', fontSize: '10px', height: 'auto' }}
      >
        Scale
      </button>

      <button
        type="button"
        className="side-btn"
        onClick={() => setShow(false)}
        title="Hide panel"
        aria-label="Hide panel"
        style={{ width: '100%', marginTop: '2px', fontSize: '10px', height: 'auto' }}
      >
        Close
      </button>
    </div>
  )
}

export function TransformToolbarToggle() {
  const show = useAppStore((s) => s.showTransformBar)
  const setShow = useAppStore((s) => s.setShowTransformBar)
  return (
    <button
      type="button"
      className={`side-btn side-btn-wide ${show ? 'active' : ''}`}
      onClick={() => setShow(!show)}
      title={show ? 'Hide floating selection & transform panel' : 'Show floating selection & transform panel'}
    >
      {show ? 'Hide selection panel' : 'Show selection panel'}
    </button>
  )
}

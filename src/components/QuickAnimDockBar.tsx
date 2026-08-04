import React from 'react'

interface QuickAnimDockBarProps {
  open: boolean
  onClose: () => void
  isPlaying: boolean
  onTogglePlay: () => void
  currentFrame: number
  totalFrames: number
  autoKey: boolean
  onToggleAutoKey: () => void
  timelineOpen: boolean
  onToggleTimeline: () => void
}

export const QuickAnimDockBar: React.FC<QuickAnimDockBarProps> = ({
  open,
  onClose,
  isPlaying,
  onTogglePlay,
  currentFrame,
  totalFrames,
  autoKey,
  onToggleAutoKey,
  timelineOpen,
  onToggleTimeline,
}) => {
  if (!open) return null

  return (
    <div
      className="quick-anim-dock-bar"
      style={{
        position: 'fixed',
        bottom: timelineOpen ? '230px' : '14px',
        left: 'calc(50% - 150px)',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--bg-panel, #14171d)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border, #3a3f4d)',
        borderRadius: 'var(--radius, 6px)',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 1200,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        transition: 'bottom 0.2s ease, left 0.2s ease',
        fontSize: '11px',
        color: 'var(--text, #ffffff)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Play / Pause Toggle */}
      <button
        onClick={onTogglePlay}
        className={`side-btn ${isPlaying ? '' : 'side-btn-primary'}`}
        style={{
          padding: '3px 10px',
          fontWeight: 600,
          fontSize: '10px',
          height: 'auto',
          minWidth: 'auto',
          width: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      {/* Frame Counter Readout */}
      <span
        style={{
          fontWeight: 600,
          color: 'var(--text-muted, #8a8f9e)',
          fontSize: '10px',
          padding: '0 4px',
          whiteSpace: 'nowrap',
        }}
      >
        {currentFrame} / {totalFrames} f
      </span>

      <span style={{ color: 'var(--border, #3a3f4d)', fontSize: '10px' }}>|</span>

      {/* Auto-Key Toggle Button */}
      <button
        onClick={onToggleAutoKey}
        className={`side-btn ${autoKey ? 'active' : ''}`}
        style={{
          padding: '3px 10px',
          fontSize: '10px',
          height: 'auto',
          minWidth: 'auto',
          width: 'auto',
          whiteSpace: 'nowrap',
        }}
        title={autoKey ? 'Auto-Key is ON' : 'Auto-Key is OFF'}
      >
        {autoKey ? 'Auto-Key ON' : 'Auto-Key'}
      </button>

      {/* Timeline Expand/Collapse Toggle */}
      <button
        onClick={onToggleTimeline}
        className={`side-btn ${timelineOpen ? 'active' : ''}`}
        style={{
          padding: '3px 10px',
          fontSize: '10px',
          height: 'auto',
          minWidth: 'auto',
          width: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        Timeline
      </button>

      <span style={{ color: 'var(--border, #3a3f4d)', fontSize: '10px' }}>|</span>

      {/* Close Dock Bar Button */}
      <button
        onClick={onClose}
        className="side-btn"
        style={{
          fontSize: '10px',
          padding: '3px 8px',
          height: 'auto',
          minWidth: 'auto',
          width: 'auto',
          whiteSpace: 'nowrap',
        }}
        title="Close animation bar"
      >
        Close
      </button>
    </div>
  )
}

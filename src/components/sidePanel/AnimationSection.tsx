import React from 'react'

interface AnimationSectionProps {
  animBarOpen: boolean
  onToggleAnimBar: () => void
  timelineOpen: boolean
  onToggleTimeline: () => void
}

export const AnimationSection: React.FC<AnimationSectionProps> = ({
  animBarOpen,
  onToggleAnimBar,
  timelineOpen,
  onToggleTimeline,
}) => {
  return (
    <div style={{ fontSize: '11px', color: '#e0e0e0' }}>
      <p style={{ color: '#8a8f9e', fontSize: '10px', margin: '0 0 8px 0' }}>
        Create and edit multi-track game animation clips (Idle, Walk, Run, Attack) with FK joint keyframing.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={onToggleAnimBar}
          className={`side-btn side-btn-wide ${animBarOpen ? 'active' : ''}`}
          style={{ padding: '6px', fontSize: '11px', fontWeight: 600 }}
        >
          {animBarOpen ? 'Hide Animation Bar' : 'Show Animation Bar'}
        </button>

        <button
          onClick={onToggleTimeline}
          className={`side-btn side-btn-wide ${timelineOpen ? 'active' : ''}`}
          style={{ padding: '6px', fontSize: '11px' }}
        >
          {timelineOpen ? 'Hide Keyframe Timeline Panel' : 'Open Keyframe Timeline Panel'}
        </button>
      </div>
    </div>
  )
}

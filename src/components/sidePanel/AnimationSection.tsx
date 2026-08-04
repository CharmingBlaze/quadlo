import React from 'react'

interface AnimationSectionProps {
  animBarOpen: boolean
  onToggleAnimBar: () => void
  timelineOpen: boolean
  onToggleTimeline: () => void
  onionSkinning: boolean
  onToggleOnionSkinning: () => void
  onOpenSpriteSheetExporter: () => void
  onExportGLTF: () => void
}

export const AnimationSection: React.FC<AnimationSectionProps> = ({
  animBarOpen,
  onToggleAnimBar,
  timelineOpen,
  onToggleTimeline,
  onionSkinning,
  onToggleOnionSkinning,
  onOpenSpriteSheetExporter,
  onExportGLTF,
}) => {
  return (
    <div style={{ fontSize: '11px', color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ color: '#8a8f9e', fontSize: '10px', margin: 0 }}>
        Create multi-track character clips (Idle, Walk, Run, Attack) with FK joint posing, 2-bone IK, easing curves, and game export.
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

        <button
          onClick={onToggleOnionSkinning}
          className={`side-btn side-btn-wide ${onionSkinning ? 'active' : ''}`}
          style={{ padding: '6px', fontSize: '11px' }}
          title="Toggle semi-transparent 3D ghost frames of past and future keyframes"
        >
          {onionSkinning ? 'Onion Skinning ON' : 'Onion Skinning OFF'}
        </button>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--border, #3a3f4d)', margin: '4px 0' }} />

      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted, #8a8f9e)', fontWeight: 600 }}>
        Game Engine Exporters
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={onExportGLTF}
          className="side-btn side-btn-primary side-btn-wide"
          style={{ padding: '6px', fontSize: '11px' }}
          title="Export 3D rigged mesh, bone skeleton, and animation clips to standard GLTF 2.0 format"
        >
          Export Rigged Animation to GLTF / GLB
        </button>

        <button
          onClick={onOpenSpriteSheetExporter}
          className="side-btn side-btn-wide"
          style={{ padding: '6px', fontSize: '11px' }}
          title="Bake 3D animation clips into 2D pixel art PNG sprite sheets"
        >
          Export 2D Pixel Art Sprite Sheet
        </button>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { type AnimationClip, type AnimationTrackLayer } from '../mesh/animationEngine'
import { generateId } from '../utils/math'

interface AnimationTimelinePanelProps {
  open: boolean
  onClose: () => void
}

export const SAMPLE_CLIPS: AnimationClip[] = [
  {
    id: 'clip-idle',
    name: 'Idle',
    totalFrames: 30,
    fps: 24,
    layers: [
      {
        id: 'layer-root',
        name: 'Root Joint Layer',
        targetJointId: 'joint-root',
        keyframes: [
          { frame: 0, rotationEuler: { x: 0, y: 0, z: 0 } },
          { frame: 15, rotationEuler: { x: 0.1, y: 0, z: 0 } },
          { frame: 30, rotationEuler: { x: 0, y: 0, z: 0 } },
        ],
      },
      {
        id: 'layer-spine',
        name: 'Spine Joint Layer',
        targetJointId: 'joint-spine',
        keyframes: [
          { frame: 0, rotationEuler: { x: 0, y: 0, z: 0 } },
          { frame: 15, rotationEuler: { x: -0.15, y: 0, z: 0 } },
          { frame: 30, rotationEuler: { x: 0, y: 0, z: 0 } },
        ],
      },
    ],
  },
  {
    id: 'clip-walk',
    name: 'Walk Cycle',
    totalFrames: 24,
    fps: 24,
    layers: [
      {
        id: 'layer-root',
        name: 'Root Joint Layer',
        targetJointId: 'joint-root',
        keyframes: [
          { frame: 0, rotationEuler: { x: 0, y: 0, z: 0 } },
          { frame: 12, rotationEuler: { x: 0, y: 0.3, z: 0 } },
          { frame: 24, rotationEuler: { x: 0, y: 0, z: 0 } },
        ],
      },
    ],
  },
]

export const AnimationTimelinePanel: React.FC<AnimationTimelinePanelProps> = ({
  open,
  onClose,
}) => {
  const [clips, setClips] = useState<AnimationClip[]>(SAMPLE_CLIPS)
  const [activeClipId, setActiveClipId] = useState<string>('clip-idle')
  const [currentFrame, setCurrentFrame] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isLooping, setIsLooping] = useState<boolean>(true)
  const [panelHeight, setPanelHeight] = useState<number>(220)
  const [selectedLayerId, setSelectedLayerId] = useState<string>('layer-root')

  const activeClip = clips.find((c) => c.id === activeClipId) ?? clips[0]!
  const isDraggingHeight = useRef<boolean>(false)

  // Animation Playback Loop
  useEffect(() => {
    if (!isPlaying || !activeClip) return

    const intervalMs = 1000 / activeClip.fps
    const timer = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= activeClip.totalFrames) {
          if (isLooping) return 0
          setIsPlaying(false)
          return activeClip.totalFrames
        }
        return prev + 1
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isPlaying, activeClip, isLooping])

  // Panel Height Resizing Mouse Listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingHeight.current) return
      const newH = window.innerHeight - e.clientY
      setPanelHeight(Math.max(140, Math.min(450, newH)))
    }
    const handlePointerUp = () => {
      isDraggingHeight.current = false
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  if (!open) return null

  const handleAddClip = () => {
    const name = prompt('Enter new animation clip name:', 'New Clip')
    if (!name) return
    const newClip: AnimationClip = {
      id: `clip-${generateId()}`,
      name,
      totalFrames: 30,
      fps: 24,
      layers: [
        {
          id: `layer-${generateId()}`,
          name: 'Root Joint Layer',
          targetJointId: 'joint-root',
          keyframes: [{ frame: 0, rotationEuler: { x: 0, y: 0, z: 0 } }],
        },
      ],
    }
    setClips([...clips, newClip])
    setActiveClipId(newClip.id)
  }

  const handleAddLayer = () => {
    if (!activeClip) return
    const name = prompt('Enter layer name (e.g. Arm.L Joint):', `Layer ${activeClip.layers.length + 1}`)
    if (!name) return
    const newLayer: AnimationTrackLayer = {
      id: `layer-${generateId()}`,
      name,
      keyframes: [{ frame: currentFrame, rotationEuler: { x: 0, y: 0, z: 0 } }],
    }
    const updatedClips = clips.map((c) =>
      c.id === activeClip.id ? { ...c, layers: [...c.layers, newLayer] } : c
    )
    setClips(updatedClips)
  }

  const handleAddKeyframe = () => {
    if (!activeClip || !selectedLayerId) return
    const updatedClips = clips.map((c) => {
      if (c.id !== activeClip.id) return c
      const newLayers = c.layers.map((l) => {
        if (l.id !== selectedLayerId) return l
        const existingKfIdx = l.keyframes.findIndex((k) => k.frame === currentFrame)
        const newKf = { frame: currentFrame, rotationEuler: { x: 0.2, y: 0, z: 0 } }
        let newKfs = [...l.keyframes]
        if (existingKfIdx >= 0) {
          newKfs[existingKfIdx] = newKf
        } else {
          newKfs.push(newKf)
        }
        return { ...l, keyframes: newKfs.sort((a, b) => a.frame - b.frame) }
      })
      return { ...c, layers: newLayers }
    })
    setClips(updatedClips)
  }

  const frameNumbers = Array.from({ length: activeClip.totalFrames + 1 }, (_, i) => i)

  return (
    <div
      className="animation-timeline-dock"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${panelHeight}px`,
        backgroundColor: 'var(--bg-panel, #14171d)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border, #3a3f4d)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
        userSelect: 'none',
        color: 'var(--text, #ffffff)',
      }}
    >
      {/* Top Height Resize Handle */}
      <div
        onPointerDown={() => {
          isDraggingHeight.current = true
        }}
        style={{
          height: '6px',
          cursor: 'row-resize',
          backgroundColor: 'var(--border, #2a2d34)',
          borderBottom: '1px solid var(--border, #3a3f4d)',
          transition: 'background-color 0.15s',
        }}
        title="Drag up/down to resize animation timeline panel"
      />

      {/* Header Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderBottom: '1px solid var(--border, #3a3f4d)',
          backgroundColor: 'var(--bg-panel, #14171d)',
          fontSize: '11px',
        }}
      >
        {/* Playback Controls */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`side-btn ${isPlaying ? '' : 'side-btn-primary'}`}
          style={{ padding: '3px 10px', fontWeight: 600, height: '24px' }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => setCurrentFrame(0)}
          className="side-btn"
          style={{ padding: '3px 8px', height: '24px' }}
          title="Jump to Start (Frame 0)"
        >
          Start
        </button>
        <button
          onClick={() => setCurrentFrame((f) => Math.max(0, f - 1))}
          className="side-btn"
          style={{ padding: '3px 8px', height: '24px' }}
        >
          Prev
        </button>
        <button
          onClick={() => setCurrentFrame((f) => Math.min(activeClip.totalFrames, f + 1))}
          className="side-btn"
          style={{ padding: '3px 8px', height: '24px' }}
        >
          Next
        </button>
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`side-btn ${isLooping ? 'active' : ''}`}
          style={{ padding: '3px 8px', height: '24px' }}
        >
          Loop
        </button>

        <span style={{ color: 'var(--text-muted, #8a8f9e)', margin: '0 4px' }}>|</span>

        {/* Clip Selector Dropdown */}
        <span style={{ color: 'var(--text-muted, #8a8f9e)' }}>Clip:</span>
        <select
          value={activeClipId}
          onChange={(e) => {
            setActiveClipId(e.target.value)
            setCurrentFrame(0)
          }}
          style={{
            padding: '3px 6px',
            backgroundColor: 'var(--bg-input, #2a2d34)',
            border: '1px solid var(--border, #3a3f4d)',
            borderRadius: 'var(--radius, 4px)',
            color: 'var(--text, #fff)',
            fontSize: '11px',
            height: '24px',
          }}
        >
          {clips.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.totalFrames}f @ {c.fps}fps)
            </option>
          ))}
        </select>
        <button onClick={handleAddClip} className="side-btn" style={{ padding: '3px 6px', height: '24px' }}>
          + Clip
        </button>

        <span style={{ color: 'var(--text-muted, #8a8f9e)', margin: '0 4px' }}>|</span>

        {/* Keyframe Actions & Easing Selector */}
        <button onClick={handleAddKeyframe} className="side-btn side-btn-primary" style={{ padding: '3px 8px', height: '24px' }}>
          + Keyframe
        </button>

        <span style={{ color: 'var(--text-muted, #8a8f9e)', margin: '0 2px' }}>Curve:</span>
        <select
          defaultValue="linear"
          onChange={(e) => {
            const easingVal = e.target.value as any
            if (!activeClip || !selectedLayerId) return
            const updatedClips = clips.map((c) => {
              if (c.id !== activeClip.id) return c
              const newLayers = c.layers.map((l) => {
                if (l.id !== selectedLayerId) return l
                const kfs = l.keyframes.map((k) =>
                  k.frame === currentFrame ? { ...k, easing: easingVal } : k
                )
                return { ...l, keyframes: kfs }
              })
              return { ...c, layers: newLayers }
            })
            setClips(updatedClips)
          }}
          style={{
            padding: '3px 6px',
            backgroundColor: 'var(--bg-input, #2a2d34)',
            border: '1px solid var(--border, #3a3f4d)',
            borderRadius: 'var(--radius, 4px)',
            color: 'var(--text, #fff)',
            fontSize: '11px',
            height: '24px',
          }}
          title="Set easing interpolation curve for selected keyframe"
        >
          <option value="linear">Linear</option>
          <option value="ease-in">Ease-In</option>
          <option value="ease-out">Ease-Out</option>
          <option value="ease-in-out">Ease-In-Out</option>
          <option value="bounce">Bounce</option>
          <option value="elastic">Elastic</option>
        </select>

        {/* Current Frame Counter */}
        <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--accent, #00e5ff)' }}>
          Frame {currentFrame} / {activeClip.totalFrames}
        </span>

        {/* Close Panel Button */}
        <button
          onClick={onClose}
          className="side-btn"
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            height: '24px',
          }}
          title="Hide animation timeline panel"
        >
          Close
        </button>
      </div>

      {/* Main Timeline Grid (Left Layers Column + Right Keyframe Grid) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Track Layers Column */}
        <div
          style={{
            width: '200px',
            borderRight: '1px solid var(--border, #3a3f4d)',
            backgroundColor: 'var(--bg-panel, #181b22)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted, #8a8f9e)',
              borderBottom: '1px solid var(--border, #3a3f4d)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>ANIMATION LAYERS</span>
            <button onClick={handleAddLayer} style={{ background: 'none', border: 'none', color: 'var(--accent, #00e5ff)', cursor: 'pointer', fontSize: '12px' }}>
              +
            </button>
          </div>

          <div className="themed-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {activeClip.layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{
                    padding: '8px',
                    fontSize: '11px',
                    backgroundColor: isSelected ? 'var(--bg-input, #2a2d34)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent, #00e5ff)' : '3px solid transparent',
                    cursor: 'pointer',
                    color: isSelected ? 'var(--text, #ffffff)' : 'var(--text-muted, #b0b5c0)',
                    borderBottom: '1px solid var(--border, #242832)',
                  }}
                >
                  {layer.name}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Keyframe Timeline Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
          {/* Frame Ruler Header */}
          <div
            style={{
              display: 'flex',
              height: '24px',
              borderBottom: '1px solid var(--border, #3a3f4d)',
              backgroundColor: 'var(--bg-panel, #14171d)',
              position: 'relative',
            }}
          >
            {frameNumbers.map((f) => (
              <div
                key={f}
                onClick={() => setCurrentFrame(f)}
                style={{
                  minWidth: '24px',
                  textAlign: 'center',
                  fontSize: '9px',
                  color: f === currentFrame ? 'var(--accent, #00e5ff)' : 'var(--text-muted, #8a8f9e)',
                  fontWeight: f === currentFrame ? 700 : 400,
                  cursor: 'pointer',
                  borderRight: '1px solid var(--border, #242832)',
                  lineHeight: '24px',
                }}
              >
                {f % 5 === 0 ? f : '·'}
              </div>
            ))}
          </div>

          {/* Layer Keyframe Tracks */}
          <div className="themed-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {activeClip.layers.map((layer) => (
              <div
                key={layer.id}
                style={{
                  display: 'flex',
                  height: '33px',
                  borderBottom: '1px solid var(--border, #242832)',
                  position: 'relative',
                  backgroundColor: layer.id === selectedLayerId ? 'rgba(0, 229, 255, 0.04)' : 'transparent',
                }}
              >
                {frameNumbers.map((f) => {
                  const hasKf = layer.keyframes.some((k) => k.frame === f)
                  return (
                    <div
                      key={f}
                      onClick={() => {
                        setCurrentFrame(f)
                        setSelectedLayerId(layer.id)
                      }}
                      style={{
                        minWidth: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '1px solid var(--border, #1c202a)',
                        cursor: 'pointer',
                      }}
                    >
                      {hasKf && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'var(--accent, #00e5ff)',
                            borderRadius: '2px',
                            boxShadow: '0 0 4px var(--accent, rgba(0, 229, 255, 0.5))',
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

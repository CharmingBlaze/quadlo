import React, { useState } from 'react'
import { generateSpriteSheetFromCanvasFrames, type SpriteSheetOptions } from '../mesh/spriteSheetGenerator'

interface SpriteSheetExporterDialogProps {
  open: boolean
  onClose: () => void
}

export const SpriteSheetExporterDialog: React.FC<SpriteSheetExporterDialogProps> = ({ open, onClose }) => {
  const [frameResolution, setFrameResolution] = useState<number>(64)
  const [columns, setColumns] = useState<number>(6)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!open) return null

  const handleGeneratePreview = () => {
    // Generate dummy test canvas frames for preview demonstration
    const dummyCanvases: HTMLCanvasElement[] = Array.from({ length: 24 }, (_, i) => {
      const c = document.createElement('canvas')
      c.width = frameResolution
      c.height = frameResolution
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#14171d'
      ctx.fillRect(0, 0, frameResolution, frameResolution)
      ctx.fillStyle = '#00e5ff'
      ctx.fillRect(i * 2, i * 2, 12, 12)
      return c
    })

    const options: SpriteSheetOptions = {
      frameResolution,
      columns,
      directionsCount: 1,
      fps: 24,
    }

    const res = generateSpriteSheetFromCanvasFrames(dummyCanvases, options)
    if (res) {
      setPreviewUrl(res.dataUrl)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `quadlo_spritesheet_${frameResolution}x${frameResolution}.png`
    a.click()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '380px',
          backgroundColor: 'var(--bg-panel, #14171d)',
          border: '1px solid var(--border, #3a3f4d)',
          borderRadius: 'var(--radius, 6px)',
          padding: '16px',
          color: 'var(--text, #ffffff)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>2D Sprite Sheet Exporter</h3>
          <button onClick={onClose} className="side-btn" style={{ padding: '2px 6px', fontSize: '10px' }}>
            Close
          </button>
        </div>

        <p style={{ color: 'var(--text-muted, #8a8f9e)', fontSize: '11px', margin: 0 }}>
          Bake 3D animation clips into 2D pixel-art sprite sheets for 2D game engines.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Frame Resolution:</span>
            <select
              value={frameResolution}
              onChange={(e) => setFrameResolution(Number(e.target.value))}
              style={{
                backgroundColor: 'var(--bg-input, #2a2d34)',
                border: '1px solid var(--border, #3a3f4d)',
                color: 'var(--text, #fff)',
                borderRadius: '4px',
                padding: '2px 6px',
              }}
            >
              <option value={32}>32 x 32 px</option>
              <option value={64}>64 x 64 px</option>
              <option value={128}>128 x 128 px</option>
            </select>
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Grid Columns:</span>
            <select
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              style={{
                backgroundColor: 'var(--bg-input, #2a2d34)',
                border: '1px solid var(--border, #3a3f4d)',
                color: 'var(--text, #fff)',
                borderRadius: '4px',
                padding: '2px 6px',
              }}
            >
              <option value={4}>4 Columns</option>
              <option value={6}>6 Columns</option>
              <option value={8}>8 Columns</option>
            </select>
          </label>
        </div>

        <button onClick={handleGeneratePreview} className="side-btn side-btn-wide" style={{ padding: '6px' }}>
          Bake & Preview Sprite Sheet
        </button>

        {previewUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img
              src={previewUrl}
              alt="Sprite Sheet Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '160px',
                border: '1px solid var(--border, #3a3f4d)',
                borderRadius: '4px',
                backgroundColor: '#0a0c0f',
              }}
            />
            <button onClick={handleDownload} className="side-btn side-btn-primary side-btn-wide" style={{ padding: '6px' }}>
              Download PNG Sprite Sheet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

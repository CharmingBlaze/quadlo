import React, { useState } from 'react'
import type { RetroPaletteMode } from '../PixelArtShaderPass'

export const RetroShaderSection: React.FC = () => {
  const [pixelSize, setPixelSize] = useState<number>(4)
  const [paletteMode, setPaletteMode] = useState<RetroPaletteMode>('none')
  const [enableOutline, setEnableOutline] = useState<boolean>(true)
  const [enableDithering, setEnableDithering] = useState<boolean>(true)

  return (
    <div style={{ fontSize: '11px', color: '#e0e0e0' }}>
      {/* Palette Select */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', color: '#8a8f9e', fontSize: '10px', marginBottom: '4px' }}>
          Palette Quantization
        </label>
        <select
          value={paletteMode}
          onChange={(e) => setPaletteMode(e.target.value as RetroPaletteMode)}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#14171d',
            border: '1px solid #3a3f4d',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '11px',
          }}
        >
          <option value="none">Full 24-bit Color</option>
          <option value="retro16">Retro 16-Color Poster</option>
          <option value="gameboy">Game Boy 4-Green LCD</option>
          <option value="mono">1-Bit Black & White</option>
        </select>
      </div>

      {/* Pixel Scale Slider */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a8f9e', fontSize: '10px', marginBottom: '4px' }}>
          <span>Pixelation Scale</span>
          <span>{pixelSize}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          step="1"
          value={pixelSize}
          onChange={(e) => setPixelSize(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#00e5ff' }}
        />
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableOutline}
            onChange={(e) => setEnableOutline(e.target.checked)}
          />
          <span>Toon Outlines</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableDithering}
            onChange={(e) => setEnableDithering(e.target.checked)}
          />
          <span>Bayer Dither</span>
        </label>
      </div>
    </div>
  )
}

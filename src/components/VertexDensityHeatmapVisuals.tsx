import React, { useState } from 'react'
import type { MeshHeatmapResult } from '../mesh/vertexDensityHeatmap'

interface VertexDensityHeatmapVisualsProps {
  heatmap: MeshHeatmapResult | null
  onClose?: () => void
}

export const VertexDensityHeatmapVisuals: React.FC<VertexDensityHeatmapVisualsProps> = ({
  heatmap,
  onClose,
}) => {
  const [warningThresholdFactor, setWarningThresholdFactor] = useState<number>(2.0)

  if (!heatmap) return null

  const threshold = heatmap.averageDensity * warningThresholdFactor
  const warningCount = heatmap.values.filter((v) => v.density > threshold).length

  return (
    <div
      className="heatmap-inspector-overlay"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '280px',
        backgroundColor: 'rgba(20, 22, 28, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3a3f4d',
        borderRadius: '8px',
        padding: '14px',
        color: '#ffffff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        zIndex: 1000,
        fontSize: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#00e5ff' }}>
          Vertex Density Audit
        </span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8a8f9e',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Density Gradient Legend Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            height: '10px',
            borderRadius: '5px',
            background: 'linear-gradient(to right, #2b5cff, #00e5ff, #ffea00, #ff2b2b)',
            marginBottom: '4px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8a8f9e' }}>
          <span>Sparse ({heatmap.minDensity.toFixed(1)})</span>
          <span>Avg ({heatmap.averageDensity.toFixed(1)})</span>
          <span>Dense ({heatmap.maxDensity.toFixed(1)})</span>
        </div>
      </div>

      {/* Metrics Readout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px', background: '#14171d', padding: '8px', borderRadius: '4px' }}>
        <div>
          <div style={{ color: '#8a8f9e', fontSize: '10px' }}>Avg Density</div>
          <div style={{ fontWeight: 600 }}>{heatmap.averageDensity.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ color: '#8a8f9e', fontSize: '10px' }}>Dense Warnings</div>
          <div style={{ fontWeight: 600, color: warningCount > 0 ? '#ff2b2b' : '#7ecba1' }}>
            {warningCount} verts
          </div>
        </div>
      </div>

      {/* Threshold Slider */}
      <div>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8a8f9e', marginBottom: '4px' }}>
          <span>Warning Sensitivity Threshold</span>
          <span>{warningThresholdFactor.toFixed(1)}x Avg</span>
        </label>
        <input
          type="range"
          min="1.2"
          max="4.0"
          step="0.1"
          value={warningThresholdFactor}
          onChange={(e) => setWarningThresholdFactor(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#00e5ff' }}
        />
      </div>
    </div>
  )
}

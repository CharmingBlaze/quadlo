import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { HalfEdgeMesh } from '../../mesh/HalfEdgeMesh'
import { computeMeshVertexDensityHeatmap, type MeshHeatmapResult } from '../../mesh/vertexDensityHeatmap'

export const VertexAuditSection: React.FC = () => {
  const selectedObject = useAppStore((state: any) => {
    const id = state.selectedObjectId
    return state.objects.find((o: any) => o.id === id)
  })

  const [heatmap, setHeatmap] = useState<MeshHeatmapResult | null>(null)

  const handleAuditMesh = () => {
    if (!selectedObject) return
    const mesh = HalfEdgeMesh.fromObject(selectedObject)
    const result = computeMeshVertexDensityHeatmap(mesh)
    setHeatmap(result)
  }

  if (!selectedObject) {
    return (
      <p style={{ fontSize: '11px', color: '#8a8f9e', margin: 0 }}>
        Select a 3D mesh object to audit vertex density and poly budget metrics.
      </p>
    )
  }

  const vertCount = selectedObject.positions.length
  const faceCount = selectedObject.faces.length
  const budget = selectedObject.polyBudget ?? 128

  return (
    <div style={{ fontSize: '11px', color: '#e0e0e0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
        <div style={{ backgroundColor: '#14171d', padding: '6px', borderRadius: '4px' }}>
          <div style={{ color: '#8a8f9e', fontSize: '10px' }}>Vertices / Budget</div>
          <div style={{ fontWeight: 600, color: vertCount > budget ? '#ff2b2b' : '#7ecba1' }}>
            {vertCount} / {budget}
          </div>
        </div>
        <div style={{ backgroundColor: '#14171d', padding: '6px', borderRadius: '4px' }}>
          <div style={{ color: '#8a8f9e', fontSize: '10px' }}>Tri-Faces</div>
          <div style={{ fontWeight: 600 }}>{faceCount}</div>
        </div>
      </div>

      <button
        onClick={handleAuditMesh}
        style={{
          width: '100%',
          padding: '6px',
          backgroundColor: '#00e5ff',
          color: '#000000',
          fontWeight: 600,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '8px',
        }}
      >
        Audit Mesh Density
      </button>

      {heatmap && (
        <div style={{ backgroundColor: '#14171d', padding: '8px', borderRadius: '4px', border: '1px solid #3a3f4d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Avg Edge Density:</span>
            <span style={{ fontWeight: 600 }}>{heatmap.averageDensity.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Dense Warnings (&gt;2x avg):</span>
            <span style={{ fontWeight: 600, color: heatmap.denseCount > 0 ? '#ff2b2b' : '#7ecba1' }}>
              {heatmap.denseCount} verts
            </span>
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, #2b5cff, #00e5ff, #ffea00, #ff2b2b)',
              marginTop: '6px',
            }}
          />
        </div>
      )}
    </div>
  )
}

import { describe, expect, it } from 'vitest'
import { generateLowPolyBox } from './lowPolyPrimitives'
import { computeMeshVertexDensityHeatmap, densityToHexColor } from './vertexDensityHeatmap'

describe('vertexDensityHeatmap', () => {
  it('maps 0 to 1 range correctly to cool-to-warm colors', () => {
    expect(densityToHexColor(0)).toBe('#2b5cff') // Blue
    expect(densityToHexColor(1)).toBe('#ff2b2b') // Red
  })

  it('computes heatmap metrics for a box primitive', () => {
    const mesh = generateLowPolyBox({ x: -5, y: -5 }, { x: 5, y: 5 }, 0x7ecba1)
    const heatmap = computeMeshVertexDensityHeatmap(mesh)

    expect(heatmap.values.length).toBe(mesh.positions.length)
    expect(heatmap.averageDensity).toBeGreaterThan(0)
    expect(heatmap.maxDensity).toBeGreaterThanOrEqual(heatmap.minDensity)
  })
})

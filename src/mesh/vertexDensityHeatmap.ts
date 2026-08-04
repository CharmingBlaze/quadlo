import { HalfEdgeMesh } from './HalfEdgeMesh'
import { dist3 } from '../utils/math'

export interface HeatmapValue {
  vertexIndex: number
  density: number
  normalizedDensity: number // 0 to 1 relative to scene/mesh range
  colorHex: string // e.g. '#0000ff' for cool, '#ff0000' for hot
  isDenseWarning: boolean // true when local density > 2x mesh average
}

export interface MeshHeatmapResult {
  values: HeatmapValue[]
  averageDensity: number
  maxDensity: number
  minDensity: number
  denseCount: number
}

/**
 * Maps a normalized scalar (0 to 1) to a cool-to-warm hex color string.
 * 0.0 -> Blue (#2b5cff)
 * 0.33 -> Cyan (#00e5ff)
 * 0.66 -> Yellow (#ffea00)
 * 1.0 -> Red (#ff2b2b)
 */
export function densityToHexColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  let r = 0
  let g = 0
  let b = 0

  if (clamped < 0.33) {
    const factor = clamped / 0.33
    r = Math.round(0x2b * (1 - factor) + 0x00 * factor)
    g = Math.round(0x5c * (1 - factor) + 0xe5 * factor)
    b = Math.round(0xff * (1 - factor) + 0xff * factor)
  } else if (clamped < 0.66) {
    const factor = (clamped - 0.33) / 0.33
    r = Math.round(0x00 * (1 - factor) + 0xff * factor)
    g = Math.round(0xe5 * (1 - factor) + 0xea * factor)
    b = Math.round(0xff * (1 - factor) + 0x00 * factor)
  } else {
    const factor = (clamped - 0.66) / 0.34
    r = Math.round(0xff * (1 - factor) + 0xff * factor)
    g = Math.round(0xea * (1 - factor) + 0x2b * factor)
    b = Math.round(0x00 * (1 - factor) + 0x2b * factor)
  }

  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Computes vertex density heatmap for a half-edge mesh according to Section 4.6 of Technical Design:
 *   density(v) = |neighbors(v)| / mean_edge_length(v)
 */
export function computeMeshVertexDensityHeatmap(mesh: HalfEdgeMesh): MeshHeatmapResult {
  const positions = mesh.positions
  const vertexCount = positions.length
  if (vertexCount === 0) {
    return {
      values: [],
      averageDensity: 0,
      maxDensity: 0,
      minDensity: 0,
      denseCount: 0,
    }
  }

  // Gather neighbors for each vertex
  const neighborsPerVertex: Set<number>[] = Array.from({ length: vertexCount }, () => new Set<number>())
  for (const face of mesh.faces) {
    for (let i = 0; i < face.length; i++) {
      const vCurr = face[i]!
      const vNext = face[(i + 1) % face.length]!
      neighborsPerVertex[vCurr]?.add(vNext)
      neighborsPerVertex[vNext]?.add(vCurr)
    }
  }

  const rawDensities = new Float64Array(vertexCount)
  let totalDensity = 0

  for (let vi = 0; vi < vertexCount; vi++) {
    const neighbors = [...(neighborsPerVertex[vi] ?? [])]
    const k = neighbors.length
    if (k === 0) {
      rawDensities[vi] = 0
      continue
    }

    const posVi = positions[vi]!
    let totalEdgeLen = 0
    for (const ni of neighbors) {
      totalEdgeLen += dist3(posVi, positions[ni]!)
    }
    const meanEdgeLength = totalEdgeLen / k
    const density = meanEdgeLength > 1e-8 ? k / meanEdgeLength : k / 1e-8

    rawDensities[vi] = density
    totalDensity += density
  }

  const averageDensity = totalDensity / vertexCount
  let minDensity = Infinity
  let maxDensity = -Infinity

  for (let vi = 0; vi < vertexCount; vi++) {
    const d = rawDensities[vi]!
    if (d < minDensity) minDensity = d
    if (d > maxDensity) maxDensity = d
  }

  if (minDensity === Infinity) {
    minDensity = 0
    maxDensity = 0
  }

  const range = maxDensity - minDensity || 1
  const values: HeatmapValue[] = []
  let denseCount = 0

  for (let vi = 0; vi < vertexCount; vi++) {
    const density = rawDensities[vi]!
    const normalizedDensity = Math.max(0, Math.min(1, (density - minDensity) / range))
    const isDenseWarning = density > 2 * averageDensity && averageDensity > 0
    if (isDenseWarning) denseCount++

    values.push({
      vertexIndex: vi,
      density,
      normalizedDensity,
      colorHex: densityToHexColor(normalizedDensity),
      isDenseWarning,
    })
  }

  return {
    values,
    averageDensity,
    maxDensity,
    minDensity,
    denseCount,
  }
}

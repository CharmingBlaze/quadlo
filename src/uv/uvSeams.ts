import type { SceneObject } from '../mesh/HalfEdgeMesh'
import { edgeKey, parseEdgeKey } from '../mesh/meshSelection'
import type { Vec3 } from '../utils/math'

/**
 * Position quantization for matching edges across coincident-but-unwelded
 * vertices. Marking a seam on one duplicate must apply to the shared edge.
 */
const SPATIAL_QUANT = 1e-5

export function spatialVertexKey(obj: SceneObject, vi: number): string {
  const p = obj.positions[vi]
  if (!p) return `${vi}`
  const q = (v: number) => Math.round(v / SPATIAL_QUANT)
  return `${q(p.x)},${q(p.y)},${q(p.z)}`
}

export function spatialEdgeKey(obj: SceneObject, a: number, b: number): string {
  const ka = spatialVertexKey(obj, a)
  const kb = spatialVertexKey(obj, b)
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
}

export interface SeamLookup {
  /** Raw `edgeKey(a, b)` entries exactly as stored on the object. */
  index: Set<string>
  /** Position-quantized keys so unwelded duplicates resolve to the same seam. */
  spatial: Set<string>
  isSeam: (a: number, b: number) => boolean
  readonly size: number
}

const EMPTY_LOOKUP: SeamLookup = {
  index: new Set(),
  spatial: new Set(),
  isSeam: () => false,
  size: 0,
}

export function buildSeamLookup(obj: SceneObject): SeamLookup {
  const stored = obj.seamEdges
  if (!stored || stored.length === 0) return EMPTY_LOOKUP

  const index = new Set(stored)
  const spatial = new Set<string>()
  for (const key of stored) {
    const [a, b] = parseEdgeKey(key)
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue
    spatial.add(spatialEdgeKey(obj, a, b))
  }

  return {
    index,
    spatial,
    isSeam: (a, b) => index.has(edgeKey(a, b)) || spatial.has(spatialEdgeKey(obj, a, b)),
    size: index.size,
  }
}

function withSeamEdges(obj: SceneObject, next: Set<string>): SceneObject | null {
  const current = obj.seamEdges ?? []
  if (current.length === next.size && current.every((key) => next.has(key))) return null
  const seamEdges = next.size > 0 ? [...next].sort() : undefined
  return { ...obj, seamEdges }
}

/** Returns null when nothing changed, so callers can skip a history entry. */
export function markSeamEdges(obj: SceneObject, keys: string[]): SceneObject | null {
  if (keys.length === 0) return null
  const next = new Set(obj.seamEdges ?? [])
  for (const key of keys) next.add(key)
  return withSeamEdges(obj, next)
}

export function clearSeamEdges(obj: SceneObject, keys: string[]): SceneObject | null {
  if (keys.length === 0 || !obj.seamEdges?.length) return null
  const next = new Set(obj.seamEdges)
  for (const key of keys) next.delete(key)
  return withSeamEdges(obj, next)
}

/** Marks the whole batch unless every edge is already a seam, then clears it. */
export function toggleSeamEdges(obj: SceneObject, keys: string[]): SceneObject | null {
  if (keys.length === 0) return null
  const current = new Set(obj.seamEdges ?? [])
  const allMarked = keys.every((key) => current.has(key))
  return allMarked ? clearSeamEdges(obj, keys) : markSeamEdges(obj, keys)
}

export function clearAllSeamEdges(obj: SceneObject): SceneObject | null {
  if (!obj.seamEdges?.length) return null
  return { ...obj, seamEdges: undefined }
}

/**
 * Drop seam keys that no longer name a real edge. Topology edits (knife, loop
 * cut, simplify) renumber vertices, and stale keys would otherwise cut unwrap
 * along arbitrary edges.
 */
export function validateSeamEdges(obj: SceneObject): SceneObject | null {
  const stored = obj.seamEdges
  if (!stored || stored.length === 0) return null

  const realEdges = new Set<string>()
  for (const face of obj.faces) {
    for (let i = 0; i < face.length; i++) {
      realEdges.add(edgeKey(face[i]!, face[(i + 1) % face.length]!))
    }
  }

  const kept = stored.filter((key) => realEdges.has(key))
  if (kept.length === stored.length) return null
  return { ...obj, seamEdges: kept.length > 0 ? kept : undefined }
}

/** Object-local line segments for drawing seams in the 3D viewport. */
export function seamEdgeSegments(obj: SceneObject): [Vec3, Vec3][] {
  const stored = obj.seamEdges
  if (!stored || stored.length === 0) return []

  const segments: [Vec3, Vec3][] = []
  for (const key of stored) {
    const [a, b] = parseEdgeKey(key)
    const pa = obj.positions[a]
    const pb = obj.positions[b]
    if (!pa || !pb) continue
    segments.push([pa, pb])
  }
  return segments
}

/** Seam edges of a face as `[cornerIndex, cornerIndex]` pairs, for UV overlays. */
export function seamCornerPairsForFace(
  obj: SceneObject,
  faceIndex: number,
  lookup: SeamLookup
): [number, number][] {
  if (lookup.size === 0) return []
  const face = obj.faces[faceIndex]
  if (!face) return []

  const pairs: [number, number][] = []
  for (let i = 0; i < face.length; i++) {
    const j = (i + 1) % face.length
    if (lookup.isSeam(face[i]!, face[j]!)) pairs.push([i, j])
  }
  return pairs
}

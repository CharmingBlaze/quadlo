/**
 * Interleaved buffer maths for fat lines (Line2 / LineGeometry).
 *
 * three's `LineGeometry.setPositions` allocates a brand new InstancedInterleavedBuffer
 * on every call, which forces a fresh GPU upload each frame while a stroke is being
 * dragged. These helpers keep the stable LineGeometry instance and only reallocate
 * when the point count changes.
 */


import type { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export type LineTuple = readonly [number, number, number]
export interface LineVectorLike {
  x: number
  y: number
  z: number
}
export type LinePoint = LineTuple | LineVectorLike

export function pointX(p: LinePoint): number {
  return Array.isArray(p) ? p[0] : (p as LineVectorLike).x
}

export function pointY(p: LinePoint): number {
  return Array.isArray(p) ? p[1] : (p as LineVectorLike).y
}

export function pointZ(p: LinePoint): number {
  return Array.isArray(p) ? p[2] : (p as LineVectorLike).z
}

/** Interleaved segment buffer length (start xyz + end xyz per segment) for a polyline. */
export function segmentBufferLength(pointCount: number): number {
  if (pointCount < 2) return 0
  return (pointCount - 1) * 6
}

/**
 * Flatten polyline points into the interleaved `[startXYZ, endXYZ]` layout that
 * `LineSegmentsGeometry` expects. `out` must be `segmentBufferLength(points.length)` long.
 */
export function writePolylineSegments(points: readonly LinePoint[], out: Float32Array): void {
  const segments = points.length - 1
  if (segments < 1) return

  for (let s = 0; s < segments; s++) {
    const a = points[s]!
    const b = points[s + 1]!
    const o = s * 6
    out[o] = pointX(a)
    out[o + 1] = pointY(a)
    out[o + 2] = pointZ(a)
    out[o + 3] = pointX(b)
    out[o + 4] = pointY(b)
    out[o + 5] = pointZ(b)
  }
}

/** Flat `[x, y, z, ...]` list used when the geometry has to be rebuilt from scratch. */
export function flattenPolyline(points: readonly LinePoint[]): Float32Array {
  const flat = new Float32Array(points.length * 3)
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    flat[i * 3] = pointX(p)
    flat[i * 3 + 1] = pointY(p)
    flat[i * 3 + 2] = pointZ(p)
  }
  return flat
}

type LineGeometryLike = {
  setPositions: (array: Float32Array) => unknown
  instanceCount: number
  computeBoundingBox: () => void
  computeBoundingSphere: () => void
}

export type PolylineLineGeometry = LineGeometry | LineGeometryLike

/** Update a LineGeometry/Line2 buffer; keeps instanceCount in sync. */
export function applyPolylineToLineGeometry(
  geometry: PolylineLineGeometry,
  points: readonly LinePoint[]
): void {
  const segmentCount = Math.max(0, points.length - 1)

  if (segmentCount === 0) {
    geometry.setPositions(new Float32Array(6))
    geometry.instanceCount = 0
    return
  }

  if ('isLineGeometry' in geometry && geometry.isLineGeometry) {
    geometry.setPositions(flattenPolyline(points))
    return
  }

  geometry.setPositions(flattenPolyline(points))
  geometry.instanceCount = segmentCount
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}

/** Snapshot points as plain tuples so later renders can be compared cheaply. */
export function copyPolyline(points: readonly LinePoint[]): LineTuple[] {
  const out: LineTuple[] = new Array(points.length)
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    out[i] = [pointX(p), pointY(p), pointZ(p)]
  }
  return out
}

/** True when two point lists are numerically identical (lets us skip redundant uploads). */
export function polylinesEqual(
  a: readonly LinePoint[] | null,
  b: readonly LinePoint[] | null
): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const p = a[i]!
    const q = b[i]!
    if (pointX(p) !== pointX(q) || pointY(p) !== pointY(q) || pointZ(p) !== pointZ(q)) {
      return false
    }
  }
  return true
}

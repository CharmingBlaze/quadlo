import { type Vec3 } from '../utils/math'
import { HalfEdgeMesh } from './HalfEdgeMesh'

interface PendingCollapse {
  v0: number
  v1: number
  cost: number
  position: Vec3
  stamp0: number
  stamp1: number
}

/** Binary min-heap keyed on collapse cost. */
class CollapseHeap {
  private items: PendingCollapse[] = []

  get size(): number {
    return this.items.length
  }

  push(entry: PendingCollapse): void {
    const items = this.items
    items.push(entry)
    let i = items.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (items[parent]!.cost <= items[i]!.cost) break
      const tmp = items[parent]!
      items[parent] = items[i]!
      items[i] = tmp
      i = parent
    }
  }

  pop(): PendingCollapse | undefined {
    const items = this.items
    if (items.length === 0) return undefined
    const top = items[0]!
    const last = items.pop()!
    if (items.length === 0) return top
    items[0] = last
    let i = 0
    for (;;) {
      const left = i * 2 + 1
      const right = left + 1
      let smallest = i
      if (left < items.length && items[left]!.cost < items[smallest]!.cost) smallest = left
      if (right < items.length && items[right]!.cost < items[smallest]!.cost) smallest = right
      if (smallest === i) break
      const tmp = items[smallest]!
      items[smallest] = items[i]!
      items[i] = tmp
      i = smallest
    }
    return top
  }
}

/**
 * Incremental edge-collapse simplifier.
 *
 * Costs are evaluated only over faces incident to the collapsing edge, and a
 * lazy heap re-scores entries when an endpoint has moved. The previous
 * implementation rebuilt the whole edge list and rescanned every face for every
 * single collapse, so reducing a few thousand vertices could lock the UI for
 * many seconds.
 *
 * `curvatureWeighted` reproduces the organic remesher's bias against collapsing
 * detail-heavy regions.
 */
export function collapseToVertexBudget(
  mesh: HalfEdgeMesh,
  targetVertexCount: number,
  options: { curvatureWeighted?: boolean } = {}
): HalfEdgeMesh {
  if (mesh.vertexCount() <= targetVertexCount) return mesh

  const result = HalfEdgeMesh.fromObject(mesh.toObject('temp', 'temp'))
  const positions = result.positions
  const vertexCount = positions.length
  const faces: (number[] | null)[] = result.faces.map((f) => [...f])
  const faceColors = [...result.faceColors]

  const vertexFaces: Set<number>[] = Array.from({ length: vertexCount }, () => new Set<number>())
  for (let fi = 0; fi < faces.length; fi++) {
    for (const vi of faces[fi]!) vertexFaces[vi]?.add(fi)
  }

  const alive = new Uint8Array(vertexCount)
  let liveVertices = 0
  for (let vi = 0; vi < vertexCount; vi++) {
    if (vertexFaces[vi]!.size > 0) {
      alive[vi] = 1
      liveVertices++
    }
  }

  const stamp = new Uint32Array(vertexCount)

  const curvature = options.curvatureWeighted ? new Float64Array(vertexCount) : null
  const neighborsOf = (vi: number): number[] => {
    const out = new Set<number>()
    for (const fi of vertexFaces[vi]!) {
      const face = faces[fi]
      if (!face) continue
      const idx = face.indexOf(vi)
      if (idx < 0) continue
      out.add(face[(idx + 1) % face.length]!)
      out.add(face[(idx + face.length - 1) % face.length]!)
    }
    out.delete(vi)
    return [...out]
  }

  const computeCurvature = (vi: number): number => {
    const neighbors = neighborsOf(vi)
    if (neighbors.length < 2) return 0
    const p = positions[vi]!
    let total = 0
    for (let i = 0; i < neighbors.length; i++) {
      const a = positions[neighbors[i]!]!
      const b = positions[neighbors[(i + 1) % neighbors.length]!]!
      const v1x = a.x - p.x
      const v1y = a.y - p.y
      const v1z = a.z - p.z
      const v2x = b.x - p.x
      const v2y = b.y - p.y
      const v2z = b.z - p.z
      const l1 = Math.hypot(v1x, v1y, v1z)
      const l2 = Math.hypot(v2x, v2y, v2z)
      if (l1 < 1e-8 || l2 < 1e-8) continue
      const dot = (v1x * v2x + v1y * v2y + v1z * v2z) / (l1 * l2)
      total += Math.acos(Math.max(-1, Math.min(1, dot)))
    }
    return total / neighbors.length
  }

  if (curvature) {
    for (let vi = 0; vi < vertexCount; vi++) {
      if (alive[vi]) curvature[vi] = computeCurvature(vi)
    }
  }

  const scoreEdge = (v0: number, v1: number): { cost: number; position: Vec3 } => {
    const p0 = positions[v0]!
    const p1 = positions[v1]!
    const position = {
      x: (p0.x + p1.x) / 2,
      y: (p0.y + p1.y) / 2,
      z: (p0.z + p1.z) / 2,
    }

    let cost = 0
    const seen = new Set<number>()
    for (const source of [vertexFaces[v0]!, vertexFaces[v1]!]) {
      for (const fi of source) {
        if (seen.has(fi)) continue
        seen.add(fi)
        const face = faces[fi]
        if (!face || face.length < 3) continue
        const a = positions[face[0]!]!
        const b = positions[face[1]!]!
        const c = positions[face[2]!]!
        const abx = b.x - a.x
        const aby = b.y - a.y
        const abz = b.z - a.z
        const acx = c.x - a.x
        const acy = c.y - a.y
        const acz = c.z - a.z
        const nx = aby * acz - abz * acy
        const ny = abz * acx - abx * acz
        const nz = abx * acy - aby * acx
        const len = Math.hypot(nx, ny, nz)
        if (len < 1e-10) continue
        const d = -(nx * a.x + ny * a.y + nz * a.z) / len
        const dist = Math.abs((nx * position.x + ny * position.y + nz * position.z) / len + d)
        cost += dist * dist
      }
    }

    if (curvature) {
      cost /= 0.15 + (curvature[v0]! + curvature[v1]!) * 0.5
    }

    return { cost, position }
  }

  const heap = new CollapseHeap()
  const pushEdge = (a: number, b: number): void => {
    if (a === b || !alive[a] || !alive[b]) return
    const v0 = Math.min(a, b)
    const v1 = Math.max(a, b)
    const { cost, position } = scoreEdge(v0, v1)
    heap.push({ v0, v1, cost, position, stamp0: stamp[v0]!, stamp1: stamp[v1]! })
  }

  const seededEdges = new Set<number>()
  for (const face of faces) {
    if (!face) continue
    for (let i = 0; i < face.length; i++) {
      const a = face[i]!
      const b = face[(i + 1) % face.length]!
      if (a === b) continue
      const key = Math.min(a, b) * vertexCount + Math.max(a, b)
      if (seededEdges.has(key)) continue
      seededEdges.add(key)
      pushEdge(a, b)
    }
  }

  const areAdjacent = (a: number, b: number): boolean => {
    const smaller = vertexFaces[a]!.size <= vertexFaces[b]!.size ? a : b
    const other = smaller === a ? b : a
    for (const fi of vertexFaces[smaller]!) {
      const face = faces[fi]
      if (face && face.includes(other)) return true
    }
    return false
  }

  const dropFace = (fi: number): void => {
    const face = faces[fi]
    if (!face) return
    faces[fi] = null
    for (const vi of face) vertexFaces[vi]?.delete(fi)
  }

  while (liveVertices > targetVertexCount) {
    const entry = heap.pop()
    if (!entry) break

    const { v0, v1 } = entry
    if (!alive[v0] || !alive[v1]) continue
    if (!areAdjacent(v0, v1)) continue

    // Endpoint moved since this entry was scored — re-score instead of dropping it,
    // so no candidate edge is ever silently lost.
    if (entry.stamp0 !== stamp[v0] || entry.stamp1 !== stamp[v1]) {
      pushEdge(v0, v1)
      continue
    }

    positions[v0] = entry.position

    const touched = new Set<number>([...vertexFaces[v0]!, ...vertexFaces[v1]!])
    for (const fi of touched) {
      const face = faces[fi]
      if (!face) continue
      if (!face.includes(v1)) continue

      const rewritten: number[] = []
      for (const vi of face) {
        const mapped = vi === v1 ? v0 : vi
        if (!rewritten.includes(mapped)) rewritten.push(mapped)
      }

      if (rewritten.length < 3) {
        dropFace(fi)
        continue
      }

      for (const vi of face) vertexFaces[vi]?.delete(fi)
      faces[fi] = rewritten
      for (const vi of rewritten) vertexFaces[vi]?.add(fi)
    }

    vertexFaces[v1]!.clear()
    alive[v1] = 0
    liveVertices--

    // Faces removed above can strand other vertices; retire them too.
    const affected = new Set<number>([v0])
    for (const fi of touched) {
      const face = faces[fi]
      if (!face) continue
      for (const vi of face) affected.add(vi)
    }
    for (const vi of [...affected, v1]) {
      if (vi !== v1 && alive[vi] && vertexFaces[vi]!.size === 0) {
        alive[vi] = 0
        liveVertices--
        affected.delete(vi)
      }
    }

    if (!alive[v0]) continue

    for (const vi of affected) {
      stamp[vi] = (stamp[vi]! + 1) >>> 0
    }
    if (curvature) {
      for (const vi of affected) {
        if (alive[vi]) curvature[vi] = computeCurvature(vi)
      }
    }

    for (const ni of neighborsOf(v0)) pushEdge(v0, ni)
  }

  const survivingFaces: number[][] = []
  const survivingColors: number[] = []
  for (let fi = 0; fi < faces.length; fi++) {
    const face = faces[fi]
    if (!face || face.length < 3) continue
    survivingFaces.push(face)
    survivingColors.push(faceColors[fi] ?? 0x7ecba1)
  }

  const referenced = new Set<number>()
  for (const face of survivingFaces) {
    for (const vi of face) referenced.add(vi)
  }

  const oldToNew = new Map<number, number>()
  const newPositions: Vec3[] = []
  for (let vi = 0; vi < vertexCount; vi++) {
    if (!referenced.has(vi)) continue
    oldToNew.set(vi, newPositions.length)
    newPositions.push({ ...positions[vi]! })
  }

  result.positions = newPositions
  result.faces = survivingFaces.map((face) => face.map((vi) => oldToNew.get(vi)!))
  result.faceColors = survivingColors
  result.buildHalfEdges()
  return result
}

/** Garland-Heckbert quadric error simplification */
export function simplifyMesh(
  mesh: HalfEdgeMesh,
  targetVertexCount: number
): HalfEdgeMesh {
  if (mesh.topologyLocked) return mesh
  if (mesh.vertexCount() <= targetVertexCount) return mesh
  return collapseToVertexBudget(mesh, targetVertexCount)
}

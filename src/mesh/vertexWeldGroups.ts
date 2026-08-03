import type { Vec3 } from '../utils/math'

/**
 * Union-find grouping of vertices that lie within `epsilon` of each other.
 *
 * Uses a uniform grid sized to `epsilon` so each vertex only tests candidates in
 * its own cell plus the 26 surrounding ones. Pairwise distance comparison over
 * every vertex pair is quadratic, which made knife cuts and the dual-contouring
 * safety pass stall on dense meshes.
 */
export function unionCoincidentVertices(positions: Vec3[], epsilon: number): Int32Array {
  const n = positions.length
  const roots = new Int32Array(n)
  for (let i = 0; i < n; i++) roots[i] = i
  if (n < 2) return roots

  const find = (i: number): number => {
    let root = i
    while (roots[root] !== root) root = roots[root]!
    let curr = i
    while (roots[curr] !== curr) {
      const next = roots[curr]!
      roots[curr] = root
      curr = next
    }
    return root
  }

  const unite = (a: number, b: number): void => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) roots[Math.max(ra, rb)] = Math.min(ra, rb)
  }

  // Cell size must be >= epsilon so any pair within epsilon shares or neighbors a cell.
  const cell = Math.max(epsilon, 1e-12)
  const eps2 = epsilon * epsilon
  const grid = new Map<string, number[]>()
  const cellOf = (v: number) => Math.floor(v / cell)

  for (let i = 0; i < n; i++) {
    const p = positions[i]
    if (!p) continue
    const key = `${cellOf(p.x)},${cellOf(p.y)},${cellOf(p.z)}`
    const bucket = grid.get(key)
    if (bucket) bucket.push(i)
    else grid.set(key, [i])
  }

  for (let i = 0; i < n; i++) {
    const pi = positions[i]
    if (!pi) continue
    const cx = cellOf(pi.x)
    const cy = cellOf(pi.y)
    const cz = cellOf(pi.z)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`)
          if (!bucket) continue
          for (const j of bucket) {
            if (j <= i) continue
            const pj = positions[j]!
            const ddx = pi.x - pj.x
            const ddy = pi.y - pj.y
            const ddz = pi.z - pj.z
            if (ddx * ddx + ddy * ddy + ddz * ddz <= eps2) unite(i, j)
          }
        }
      }
    }
  }

  for (let i = 0; i < n; i++) roots[i] = find(i)
  return roots
}

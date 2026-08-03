import { HalfEdgeMesh } from './HalfEdgeMesh'
import { collapseToVertexBudget } from './simplification'
import { add3 } from '../utils/math'

/** Simplify while penalizing collapse in high-curvature regions */
function simplifyCurvatureAware(mesh: HalfEdgeMesh, targetVertexCount: number): HalfEdgeMesh {
  if (mesh.vertexCount() <= targetVertexCount) return mesh
  return collapseToVertexBudget(mesh, targetVertexCount, { curvatureWeighted: true })
}

/** In-place Laplacian relax — no subdivision */
export function relaxOrganicMesh(mesh: HalfEdgeMesh, strength = 0.18, iterations = 1): void {
  for (let iter = 0; iter < iterations; iter++) {
    const originals = mesh.positions.map((p) => ({ ...p }))
    for (let vi = 0; vi < mesh.positions.length; vi++) {
      const neighbors = mesh.getVertexNeighbors(vi)
      if (neighbors.length === 0) continue
      const avg = neighbors.reduce(
        (acc, ni) => add3(acc, originals[ni]),
        { x: 0, y: 0, z: 0 }
      )
      avg.x /= neighbors.length
      avg.y /= neighbors.length
      avg.z /= neighbors.length
      mesh.positions[vi] = {
        x: originals[vi].x + (avg.x - originals[vi].x) * strength,
        y: originals[vi].y + (avg.y - originals[vi].y) * strength,
        z: originals[vi].z + (avg.z - originals[vi].z) * strength * 0.35,
      }
    }
  }
}

/** Remesh to poly budget — curvature-aware, no subdivision */
export function remeshOrganic(
  mesh: HalfEdgeMesh,
  targetVerts: number,
  relaxStrength = 0.12
): HalfEdgeMesh {
  let result = mesh
  if (result.vertexCount() > targetVerts) {
    result = simplifyCurvatureAware(result, targetVerts)
  }
  relaxOrganicMesh(result, relaxStrength, 1)
  result.buildHalfEdges()
  return result
}

export { simplifyCurvatureAware }

import { useEffect, useMemo } from 'react'
import type { SceneObject } from '../mesh/HalfEdgeMesh'
import { parseEdgeKey } from '../mesh/meshSelection'
import { buildEdgeSegmentsGeometry } from '../mesh/meshTopology'

/** Above the mesh but below selection highlights, so seams never hide a pick. */
const SEAM_RENDER_ORDER = 995

const SEAM_COLOR = '#ff4d2e'

/**
 * User-marked UV seams drawn on the model.
 *
 * All seams share one `lineSegments` draw call; a per-edge component would cost
 * a draw call each and seams routinely number in the hundreds.
 */
export function SeamVisuals({
  object,
  visible = true,
  cullBackfaces = true,
}: {
  object: SceneObject
  visible?: boolean
  cullBackfaces?: boolean
}) {
  const seamEdges = object.seamEdges

  const geometry = useMemo(() => {
    if (!seamEdges || seamEdges.length === 0) return null
    const edges: [number, number][] = []
    for (const key of seamEdges) {
      const [a, b] = parseEdgeKey(key)
      if (!object.positions[a] || !object.positions[b]) continue
      edges.push([a, b])
    }
    if (edges.length === 0) return null
    return buildEdgeSegmentsGeometry(object, edges)
  }, [object, seamEdges])

  useEffect(() => () => geometry?.dispose(), [geometry])

  if (!geometry || !visible) return null

  return (
    <lineSegments geometry={geometry} renderOrder={SEAM_RENDER_ORDER}>
      <lineBasicMaterial
        color={SEAM_COLOR}
        transparent
        opacity={0.95}
        depthTest={cullBackfaces}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  )
}

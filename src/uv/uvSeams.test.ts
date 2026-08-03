import { describe, expect, it } from 'vitest'
import type { SceneObject } from '../mesh/HalfEdgeMesh'
import { edgeKey } from '../mesh/meshSelection'
import {
  buildSeamLookup,
  clearAllSeamEdges,
  clearSeamEdges,
  markSeamEdges,
  seamCornerPairsForFace,
  seamEdgeSegments,
  toggleSeamEdges,
  validateSeamEdges,
} from './uvSeams'
import { clusterFacesSmartUv, clusterFacesConnected } from './uvUnwrap'

/** Two coplanar quads sharing the edge 1-2. */
function makeStrip(): SceneObject {
  return {
    id: 'strip',
    name: 'strip',
    visible: true,
    color: '#ffffff',
    positions: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 0, z: 1 },
    ],
    faces: [
      [0, 1, 2, 3],
      [1, 4, 5, 2],
    ],
    faceColors: ['#ffffff', '#ffffff'],
  } as unknown as SceneObject
}

describe('uvSeams data model', () => {
  it('marks, clears and toggles seam edges', () => {
    const obj = makeStrip()
    const key = edgeKey(1, 2)

    const marked = markSeamEdges(obj, [key])
    expect(marked?.seamEdges).toEqual([key])

    // Marking the same edge again is a no-op, so no history entry is produced.
    expect(markSeamEdges(marked!, [key])).toBeNull()

    const toggledOff = toggleSeamEdges(marked!, [key])
    expect(toggledOff?.seamEdges).toBeUndefined()

    const cleared = clearSeamEdges(marked!, [key])
    expect(cleared?.seamEdges).toBeUndefined()
    expect(clearSeamEdges(obj, [key])).toBeNull()
  })

  it('clears every seam at once', () => {
    const obj = markSeamEdges(makeStrip(), [edgeKey(1, 2), edgeKey(0, 1)])!
    expect(obj.seamEdges).toHaveLength(2)
    expect(clearAllSeamEdges(obj)?.seamEdges).toBeUndefined()
    expect(clearAllSeamEdges(makeStrip())).toBeNull()
  })

  it('drops seam keys that no longer name a real edge', () => {
    const obj = markSeamEdges(makeStrip(), [edgeKey(1, 2), edgeKey(0, 5)])!
    const validated = validateSeamEdges(obj)
    expect(validated?.seamEdges).toEqual([edgeKey(1, 2)])
    // A fully valid list is left alone.
    expect(validateSeamEdges(validated!)).toBeNull()
  })

  it('matches seams across coincident but unwelded vertices', () => {
    const obj = makeStrip()
    // Vertex 6 duplicates vertex 1's position; a seam on 1-2 must cover 6-2.
    obj.positions.push({ x: 1, y: 0, z: 0 })
    const marked = markSeamEdges(obj, [edgeKey(1, 2)])!

    const lookup = buildSeamLookup(marked)
    expect(lookup.isSeam(1, 2)).toBe(true)
    expect(lookup.isSeam(6, 2)).toBe(true)
    expect(lookup.isSeam(0, 3)).toBe(false)
  })

  it('reports corner pairs and world segments for overlays', () => {
    const marked = markSeamEdges(makeStrip(), [edgeKey(1, 2)])!
    const lookup = buildSeamLookup(marked)

    // Face 0 is [0,1,2,3]; the seam runs between corners 1 and 2.
    expect(seamCornerPairsForFace(marked, 0, lookup)).toEqual([[1, 2]])
    expect(seamEdgeSegments(marked)).toHaveLength(1)
  })
})

describe('unwrap clustering respects seams', () => {
  it('keeps coplanar faces together when no seam is marked', () => {
    const obj = makeStrip()
    expect(clusterFacesSmartUv(obj, [0, 1], 66)).toHaveLength(1)
    expect(clusterFacesConnected(obj, [0, 1], true)).toHaveLength(1)
  })

  it('splits the island at a user seam even though the faces are coplanar', () => {
    const obj = markSeamEdges(makeStrip(), [edgeKey(1, 2)])!
    expect(clusterFacesSmartUv(obj, [0, 1], 66)).toHaveLength(2)
    expect(clusterFacesConnected(obj, [0, 1], true)).toHaveLength(2)
    // Plain connectivity ignores seams unless asked.
    expect(clusterFacesConnected(obj, [0, 1])).toHaveLength(1)
  })
})

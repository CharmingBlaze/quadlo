import { describe, expect, it } from 'vitest'
import { resolveUvPreviewFaceSelection, resolveUvFaceSelection } from './uvPreviewSelection'
import type { SceneObject } from '../mesh/HalfEdgeMesh'

describe('resolveUvPreviewFaceSelection', () => {
  it('replaces the selection on a normal click', () => {
    expect(resolveUvPreviewFaceSelection([1, 2], 5, false)).toEqual([5])
  })

  it('adds and removes faces with Shift', () => {
    expect(resolveUvPreviewFaceSelection([1, 2], 5, true)).toEqual([1, 2, 5])
    expect(resolveUvPreviewFaceSelection([1, 2, 5], 2, true)).toEqual([1, 5])
  })
})

describe('resolveUvFaceSelection', () => {
  const obj = {
    id: 'o',
    positions: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
    ],
    faces: [[0, 1, 2, 3]],
    faceGroups: [[0]],
  } as SceneObject

  it('expands sticky picks to the whole coplanar region', () => {
    expect(resolveUvFaceSelection(obj, [], 0, false, true)).toEqual([0])
  })

  it('removes the whole sticky region on shift-toggle', () => {
    expect(resolveUvFaceSelection(obj, [0], 0, true, true)).toEqual([])
  })
})

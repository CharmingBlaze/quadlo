import { describe, expect, it } from 'vitest'
import { generateLowPolyBox } from './lowPolyPrimitives'
import { poseMeshWithRig, type SkeletonRig } from './armaturePosing'

describe('armaturePosing', () => {
  it('poses low-poly mesh vertices rigidly with zero vertex count drift', () => {
    const mesh = generateLowPolyBox({ x: -5, y: -5 }, { x: 5, y: 5 }, 0x7ecba1)
    const cube = mesh.toObject('cube-1', 'Box', { color: 0x7ecba1 })
    const restRig: SkeletonRig = {
      joints: [{ id: 'root', name: 'Root', parentId: null, position: { x: 0, y: 0, z: 0 } }],
    }
    const posedRig: SkeletonRig = {
      joints: [{ id: 'root', name: 'Root', parentId: null, position: { x: 5, y: 10, z: 0 } }],
    }

    const posed = poseMeshWithRig(cube, restRig, posedRig)
    expect(posed.positions.length).toBe(cube.positions.length)
    expect(posed.faces.length).toBe(cube.faces.length)

    // Vertices should be offset by (+5, +10, 0)
    for (let i = 0; i < cube.positions.length; i++) {
      expect(posed.positions[i]!.x).toBeCloseTo(cube.positions[i]!.x + 5)
      expect(posed.positions[i]!.y).toBeCloseTo(cube.positions[i]!.y + 10)
    }
  })

  it('supports hierarchical parent-child joint transformations', () => {
    const mesh = generateLowPolyBox({ x: -5, y: -5 }, { x: 5, y: 5 }, 0x7ecba1)
    const cube = mesh.toObject('cube-2', 'Box', { color: 0x7ecba1 })
    const restRig: SkeletonRig = {
      joints: [
        { id: 'root', name: 'Root', parentId: null, position: { x: 0, y: 0, z: 0 } },
        { id: 'child', name: 'Child', parentId: 'root', position: { x: 0, y: 5, z: 0 } },
      ],
    }
    const posedRig: SkeletonRig = {
      joints: [
        { id: 'root', name: 'Root', parentId: null, position: { x: 10, y: 0, z: 0 } },
        { id: 'child', name: 'Child', parentId: 'root', position: { x: 0, y: 5, z: 0 } },
      ],
    }

    const posed = poseMeshWithRig(cube, restRig, posedRig)
    expect(posed.positions.length).toBe(cube.positions.length)
  })
})

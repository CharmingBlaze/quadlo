import { describe, expect, it } from 'vitest'
import type { SceneObject } from '../mesh/HalfEdgeMesh'
import { buildObjectSelectionBoundsGeometry } from '../components/MeshRenderer'

describe('object selection bounds', () => {
  it('always creates a 12-edge cage independent of topology density', () => {
    const object: SceneObject = {
      id: 'dense', name: 'Dense', faceColors: [], faces: [],
      positions: Array.from({ length: 500 }, (_, i) => ({
        x: (i % 10) - 5,
        y: (Math.floor(i / 10) % 10) - 4,
        z: Math.floor(i / 100) - 2,
      })),
      topologyLocked: false, polyBudget: 128, polyBudgetMode: 'strict',
      smoothShading: false, facetExaggeration: 0, color: 0,
    }
    const geometry = buildObjectSelectionBoundsGeometry(object)
    expect(geometry.getAttribute('position').count).toBe(24)
    geometry.dispose()
  })

  it('adds a small cage margin around planar objects', () => {
    const object: SceneObject = {
      id: 'plane', name: 'Plane', faceColors: [], faces: [[0, 1, 2, 3]],
      positions: [
        { x: -2, y: -1, z: 0 }, { x: 2, y: -1, z: 0 },
        { x: 2, y: 1, z: 0 }, { x: -2, y: 1, z: 0 },
      ],
      topologyLocked: false, polyBudget: 128, polyBudgetMode: 'strict',
      smoothShading: false, facetExaggeration: 0, color: 0,
    }
    const geometry = buildObjectSelectionBoundsGeometry(object)
    geometry.computeBoundingBox()
    expect(geometry.boundingBox!.min.z).toBeLessThan(0)
    expect(geometry.boundingBox!.max.z).toBeGreaterThan(0)
    geometry.dispose()
  })

  it('refits world-axis-aligned bounds when the object rotates', () => {
    const positions = [
      { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
      { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
      { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 },
    ]
    const object: SceneObject = {
      id: 'box',
      name: 'Box',
      faceColors: [],
      faces: [],
      positions,
      pivot: { x: 0, y: 0, z: 0 },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: Math.PI / 4, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      topologyLocked: false,
      polyBudget: 128,
      polyBudgetMode: 'strict',
      smoothShading: false,
      facetExaggeration: 0,
      color: 0,
    }
    const geometry = buildObjectSelectionBoundsGeometry(object)
    geometry.computeBoundingBox()
    const bb = geometry.boundingBox!
    expect(bb.max.x - bb.min.x).toBeGreaterThan(2.5)
    expect(bb.max.z - bb.min.z).toBeGreaterThan(2.5)
    expect(bb.max.y - bb.min.y).toBeLessThan(2.2)
    geometry.dispose()
  })
})

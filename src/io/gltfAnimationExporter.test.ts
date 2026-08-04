import { describe, it, expect } from 'vitest'
import { exportSkeletalAnimationGLTF } from './gltfAnimationExporter'

describe('gltfAnimationExporter', () => {
  it('exports valid GLTF structure with nodes and animation tracks', () => {
    const res = exportSkeletalAnimationGLTF(
      { joints: [{ id: 'j1', name: 'Root', parentId: null, position: { x: 0, y: 0, z: 0 }, rotationEuler: { x: 0, y: 0, z: 0 } }] },
      [{ id: 'c1', name: 'Idle', totalFrames: 30, fps: 24, layers: [] }]
    )

    expect(res.jsonString).toContain('Quadlo 3D Engine')
    expect(res.jsonString).toContain('Idle')
  })
})

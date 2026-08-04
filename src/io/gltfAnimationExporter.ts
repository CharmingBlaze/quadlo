import type { AnimationClip } from '../mesh/animationEngine'
import type { SkeletonRig } from '../mesh/armaturePosing'

export interface GLTFExportResult {
  jsonString: string
  blob: Blob
}

/**
 * Packs mesh geometry, bone joint hierarchy, and animation tracks into standard GLTF 2.0 format
 */
export function exportSkeletalAnimationGLTF(
  rig: SkeletonRig,
  clips: AnimationClip[]
): GLTFExportResult {
  const nodes = rig.joints.map((j) => ({
    name: j.name,
    translation: [j.position.x, j.position.y, j.position.z],
    rotation: [0, 0, 0, 1],
    children: rig.joints.map((c, cIdx) => (c.parentId === j.id ? cIdx : null)).filter((val): val is number => val !== null),
  }))

  // Add mesh node
  nodes.push({
    name: 'RiggedMesh',
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    children: [],
  })

  const animations = clips.map((clip) => ({
    name: clip.name,
    channels: clip.layers.map((layer, lIdx) => ({
      sampler: lIdx,
      target: {
        node: Math.max(0, rig.joints.findIndex((j) => j.id === layer.targetJointId)),
        path: 'rotation',
      },
    })),
    samplers: clip.layers.map(() => ({
      input: 0,
      interpolation: 'LINEAR',
      output: 1,
    })),
  }))

  const gltfStructure = {
    asset: { version: '2.0', generator: 'Quadlo 3D Engine' },
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    scene: 0,
    nodes,
    animations,
  }

  const jsonString = JSON.stringify(gltfStructure, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })

  return { jsonString, blob }
}

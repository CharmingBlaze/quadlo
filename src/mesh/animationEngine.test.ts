import { describe, expect, it } from 'vitest'
import { interpolateTrackLayerPose, evaluateClipRigPose, type AnimationClip, type AnimationTrackLayer } from './animationEngine'
import type { SkeletonRig } from './armaturePosing'

describe('animationEngine', () => {
  it('interpolates track layer pose across keyframes', () => {
    const layer: AnimationTrackLayer = {
      id: 'layer-arm',
      name: 'Arm Track',
      targetJointId: 'joint-arm',
      keyframes: [
        { frame: 0, rotationEuler: { x: 0, y: 0, z: 0 } },
        { frame: 10, rotationEuler: { x: 1, y: 0, z: 0 } },
      ],
    }

    const midPose = interpolateTrackLayerPose(layer, 5)
    expect(midPose.rotationEuler.x).toBeCloseTo(0.5)
    expect(midPose.rotationEuler.y).toBe(0)
    expect(midPose.rotationEuler.z).toBe(0)
  })

  it('evaluates skeleton rig pose for clip at frame', () => {
    const restRig: SkeletonRig = {
      joints: [{ id: 'joint-root', name: 'Root', parentId: null, position: { x: 0, y: 0, z: 0 } }],
    }
    const clip: AnimationClip = {
      id: 'clip-idle',
      name: 'Idle',
      totalFrames: 30,
      fps: 24,
      layers: [
        {
          id: 'joint-root',
          name: 'Root Layer',
          targetJointId: 'joint-root',
          keyframes: [
            { frame: 0, rotationEuler: { x: 0, y: 0, z: 0 } },
            { frame: 30, rotationEuler: { x: 0, y: Math.PI, z: 0 } },
          ],
        },
      ],
    }

    const posed = evaluateClipRigPose(clip, restRig, 15)
    expect(posed.joints[0]!.rotationEuler?.y).toBeCloseTo(Math.PI / 2)
  })
})

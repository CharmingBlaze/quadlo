import { type Vec3, lerp3 } from '../utils/math'
import type { SkeletonRig, BoneJoint } from './armaturePosing'

export interface KeyframeData {
  frame: number // e.g. 0, 10, 20
  rotationEuler: Vec3 // Pitch, Yaw, Roll
  positionOffset?: Vec3
}

export interface AnimationTrackLayer {
  id: string
  name: string
  targetJointId?: string // Link to specific bone joint
  keyframes: KeyframeData[]
}

export interface AnimationClip {
  id: string
  name: string // e.g. "Idle", "Walk", "Run", "Attack"
  totalFrames: number // default 30
  fps: number // default 24
  layers: AnimationTrackLayer[]
}

/**
 * Interpolates keyframe pose for a single track layer at fractional frame index `t`
 */
export function interpolateTrackLayerPose(
  layer: AnimationTrackLayer,
  frame: number
): { rotationEuler: Vec3; positionOffset: Vec3 } {
  const kfs = [...layer.keyframes].sort((a, b) => a.frame - b.frame)

  if (kfs.length === 0) {
    return { rotationEuler: { x: 0, y: 0, z: 0 }, positionOffset: { x: 0, y: 0, z: 0 } }
  }

  if (frame <= kfs[0]!.frame) {
    return {
      rotationEuler: { ...kfs[0]!.rotationEuler },
      positionOffset: kfs[0]!.positionOffset ? { ...kfs[0]!.positionOffset } : { x: 0, y: 0, z: 0 },
    }
  }

  const lastKf = kfs[kfs.length - 1]!
  if (frame >= lastKf.frame) {
    return {
      rotationEuler: { ...lastKf.rotationEuler },
      positionOffset: lastKf.positionOffset ? { ...lastKf.positionOffset } : { x: 0, y: 0, z: 0 },
    }
  }

  // Find adjacent keyframes for interpolation
  let prev = kfs[0]!
  let next = kfs[1]!
  for (let i = 0; i < kfs.length - 1; i++) {
    if (frame >= kfs[i]!.frame && frame <= kfs[i + 1]!.frame) {
      prev = kfs[i]!
      next = kfs[i + 1]!
      break
    }
  }

  const span = next.frame - prev.frame || 1
  const alpha = Math.max(0, Math.min(1, (frame - prev.frame) / span))

  const rotInterp = lerp3(prev.rotationEuler, next.rotationEuler, alpha)
  const posPrev = prev.positionOffset ?? { x: 0, y: 0, z: 0 }
  const posNext = next.positionOffset ?? { x: 0, y: 0, z: 0 }
  const posInterp = lerp3(posPrev, posNext, alpha)

  return { rotationEuler: rotInterp, positionOffset: posInterp }
}

/**
 * Computes posed skeleton rig for an animation clip at a specific frame
 */
export function evaluateClipRigPose(
  clip: AnimationClip,
  restRig: SkeletonRig,
  frame: number
): SkeletonRig {
  const posedJoints: BoneJoint[] = restRig.joints.map((joint) => {
    const layer = clip.layers.find((l) => l.targetJointId === joint.id || l.id === joint.id)
    if (!layer) return { ...joint }

    const pose = interpolateTrackLayerPose(layer, frame)
    return {
      ...joint,
      rotationEuler: pose.rotationEuler,
    }
  })

  return { joints: posedJoints }
}

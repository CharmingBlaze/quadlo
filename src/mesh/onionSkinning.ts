import type { AnimationClip } from './animationEngine'
import type { SkeletonRig } from './armaturePosing'

export interface OnionGhostFrame {
  frame: number
  offset: number // e.g. -2, -1, +1, +2
  type: 'past' | 'future'
  opacity: number
}

/**
 * Computes past and future keyframe ghost mesh frames for 3D onion skinning
 */
export function computeOnionGhostFrames(
  clip: AnimationClip,
  _restRig: SkeletonRig,
  currentFrame: number,
  offsets: number[] = [-2, -1, 1, 2]
): OnionGhostFrame[] {
  const ghosts: OnionGhostFrame[] = []

  for (const offset of offsets) {
    const targetFrame = currentFrame + offset
    if (targetFrame < 0 || targetFrame > clip.totalFrames) continue

    const absOffset = Math.abs(offset)
    const opacity = Math.max(0.1, 0.5 - (absOffset - 1) * 0.15)

    ghosts.push({
      frame: targetFrame,
      offset,
      type: offset < 0 ? 'past' : 'future',
      opacity,
    })
  }

  return ghosts
}

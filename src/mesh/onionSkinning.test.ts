import { describe, it, expect } from 'vitest'
import { computeOnionGhostFrames } from './onionSkinning'
import type { AnimationClip } from './animationEngine'
import type { SkeletonRig } from './armaturePosing'

describe('onionSkinning', () => {
  const sampleClip: AnimationClip = {
    id: 'c1',
    name: 'Idle',
    totalFrames: 30,
    fps: 24,
    layers: [],
  }
  const sampleRig: SkeletonRig = { joints: [] }

  it('computes ghost frames for past and future offsets', () => {
    const ghosts = computeOnionGhostFrames(sampleClip, sampleRig, 15, [-1, 1])
    expect(ghosts.length).toBe(2)
    expect(ghosts[0]!.type).toBe('past')
    expect(ghosts[1]!.type).toBe('future')
  })
})

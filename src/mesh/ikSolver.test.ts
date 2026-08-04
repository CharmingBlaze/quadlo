import { describe, it, expect } from 'vitest'
import { solve2BoneIK } from './ikSolver'

describe('ikSolver', () => {
  it('solves 2-bone IK within reach limit', () => {
    const res = solve2BoneIK(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1.5, z: 0 },
      1.0,
      1.0
    )
    expect(res.reachable).toBe(true)
    expect(res.rootAngleEuler).toBeDefined()
    expect(res.midAngleEuler).toBeDefined()
  })

  it('handles over-extension target gracefully', () => {
    const res = solve2BoneIK(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 5.0, z: 0 },
      1.0,
      1.0
    )
    expect(res.reachable).toBe(false)
    expect(res.rootAngleEuler).toBeDefined()
  })
})

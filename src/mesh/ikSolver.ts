import { type Vec3, sub3 } from '../utils/math'

export interface IKSolveResult {
  rootAngleEuler: Vec3
  midAngleEuler: Vec3
  solvedTargetPos: Vec3
  reachable: boolean
}

function vecLen3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

/**
 * Analytical 2-Bone Inverse Kinematics solver (e.g., Upper Arm -> Forearm -> Hand target)
 */
export function solve2BoneIK(
  rootPos: Vec3,
  targetPos: Vec3,
  l1: number, // Upper bone length
  l2: number  // Lower bone length
): IKSolveResult {
  const dir = sub3(targetPos, rootPos)
  const dist = vecLen3(dir)
  const maxReach = l1 + l2
  const minReach = Math.abs(l1 - l2)

  // Clamp target within reach limits
  const clampedDist = Math.max(minReach + 0.001, Math.min(maxReach - 0.001, dist))
  const reachable = dist <= maxReach && dist >= minReach

  // Law of Cosines to solve interior angles
  const cosMid = (clampedDist * clampedDist - l1 * l1 - l2 * l2) / (2 * l1 * l2)
  const midAngleRad = Math.acos(Math.max(-1, Math.min(1, cosMid)))

  const cosRoot = (l1 * l1 + clampedDist * clampedDist - l2 * l2) / (2 * l1 * clampedDist)
  const rootAngleRad = Math.acos(Math.max(-1, Math.min(1, cosRoot)))

  // Convert angles to Euler pitch/yaw
  const pitchRoot = Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z)) + rootAngleRad
  const yawRoot = Math.atan2(dir.x, dir.z)

  return {
    rootAngleEuler: { x: pitchRoot, y: yawRoot, z: 0 },
    midAngleEuler: { x: Math.PI - midAngleRad, y: 0, z: 0 },
    solvedTargetPos: targetPos,
    reachable,
  }
}

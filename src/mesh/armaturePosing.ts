import { dist3, sub3, add3, type Vec3 } from '../utils/math'
import { HalfEdgeMesh, type SceneObject } from './HalfEdgeMesh'

export interface BoneJoint {
  id: string
  name: string
  parentId: string | null
  position: Vec3 // Rest position
  rotationEuler?: Vec3 // Pitch (x), Yaw (y), Roll (z) in radians
}

export interface SkeletonRig {
  joints: BoneJoint[]
}

/** Helper: Rotate vector v by Euler angles (pitch, yaw, roll) */
export function rotateVec3Euler(v: Vec3, euler: Vec3): Vec3 {
  const { x: pitch, y: yaw, z: roll } = euler

  // Rotate around X (pitch)
  let cos = Math.cos(pitch)
  let sin = Math.sin(pitch)
  let y1 = v.y * cos - v.z * sin
  let z1 = v.y * sin + v.z * cos
  let x1 = v.x

  // Rotate around Y (yaw)
  cos = Math.cos(yaw)
  sin = Math.sin(yaw)
  let x2 = x1 * cos + z1 * sin
  let z2 = -x1 * sin + z1 * cos
  let y2 = y1

  // Rotate around Z (roll)
  cos = Math.cos(roll)
  sin = Math.sin(roll)
  let x3 = x2 * cos - y2 * sin
  let y3 = x2 * sin + y2 * cos
  let z3 = z2

  return { x: x3, y: y3, z: z3 }
}

/**
 * Computes world space transform matrix/position for all joints in a hierarchical rig.
 */
export function computeWorldRigTransforms(rig: SkeletonRig): Map<string, { position: Vec3; rotation: Vec3 }> {
  const out = new Map<string, { position: Vec3; rotation: Vec3 }>()
  const jointMap = new Map<string, BoneJoint>()
  for (const j of rig.joints) jointMap.set(j.id, j)

  function resolveJoint(id: string): { position: Vec3; rotation: Vec3 } {
    if (out.has(id)) return out.get(id)!

    const j = jointMap.get(id)
    if (!j) return { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }

    const localRot = j.rotationEuler ?? { x: 0, y: 0, z: 0 }

    if (!j.parentId) {
      const res = { position: { ...j.position }, rotation: { ...localRot } }
      out.set(id, res)
      return res
    }

    const parentRes = resolveJoint(j.parentId)
    const rotatedLocalPos = rotateVec3Euler(j.position, parentRes.rotation)
    const worldPos = add3(parentRes.position, rotatedLocalPos)
    const worldRot = add3(parentRes.rotation, localRot)

    const res = { position: worldPos, rotation: worldRot }
    out.set(id, res)
    return res
  }

  for (const j of rig.joints) resolveJoint(j.id)
  return out
}

/**
 * Rigid proximity skinning for low-poly geometry with Hierarchical FK support:
 * 1. Each vertex is bound to its nearest rest joint.
 * 2. World transforms for posed joints propagate down the hierarchy (Parent -> Child).
 * 3. Bound vertices are transformed rigidly relative to the joint's rest frame.
 */
export function poseMeshWithRig(
  object: SceneObject,
  restRig: SkeletonRig,
  posedRig: SkeletonRig
): SceneObject {
  const mesh = HalfEdgeMesh.fromObject(object)
  const restJoints = restRig.joints
  if (restJoints.length === 0 || posedRig.joints.length === 0) return object

  const restTransforms = computeWorldRigTransforms(restRig)
  const posedTransforms = computeWorldRigTransforms(posedRig)

  const newPositions: Vec3[] = []

  for (let vi = 0; vi < mesh.positions.length; vi++) {
    const pos = mesh.positions[vi]!

    // Find nearest rest joint in world space
    let closestJoint = restJoints[0]!
    let minDistance = Infinity

    for (let ji = 0; ji < restJoints.length; ji++) {
      const joint = restJoints[ji]!
      const restWorldPos = restTransforms.get(joint.id)?.position ?? joint.position
      const d = dist3(pos, restWorldPos)
      if (d < minDistance) {
        minDistance = d
        closestJoint = joint
      }
    }

    const restWorld = restTransforms.get(closestJoint.id)
    const posedWorld = posedTransforms.get(closestJoint.id)

    if (!restWorld || !posedWorld) {
      newPositions.push({ ...pos })
      continue
    }

    // Offset relative to rest joint world position
    const relPos = sub3(pos, restWorld.position)

    // Delta rotation
    const deltaRot = sub3(posedWorld.rotation, restWorld.rotation)
    const rotatedRelPos = rotateVec3Euler(relPos, deltaRot)

    // Final position relative to posed joint world position
    const finalPos = add3(posedWorld.position, rotatedRelPos)
    newPositions.push(finalPos)
  }

  mesh.positions = newPositions
  return mesh.toObject(object.id, object.name, object)
}

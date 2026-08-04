import React, { useMemo } from 'react'
import { computeWorldRigTransforms, type SkeletonRig } from '../mesh/armaturePosing'
import { ViewportLine } from './ViewportLine'

interface ArmatureGizmoProps {
  rig: SkeletonRig
  selectedJointId?: string
  onSelectJoint?: (id: string) => void
}

export const ArmatureGizmo: React.FC<ArmatureGizmoProps> = ({
  rig,
  selectedJointId,
  onSelectJoint,
}) => {
  const worldTransforms = useMemo(() => computeWorldRigTransforms(rig), [rig])

  if (!rig || rig.joints.length === 0) return null

  return (
    <group name="armature-gizmo">
      {/* Joint Nodes */}
      {rig.joints.map((joint) => {
        const isSelected = joint.id === selectedJointId
        const world = worldTransforms.get(joint.id)?.position ?? joint.position
        return (
          <mesh
            key={joint.id}
            position={[world.x, world.y, world.z]}
            onClick={(e) => {
              e.stopPropagation()
              if (onSelectJoint) onSelectJoint(joint.id)
            }}
          >
            <sphereGeometry args={[isSelected ? 0.8 : 0.5, 12, 12]} />
            <meshBasicMaterial color={isSelected ? '#00e5ff' : '#ffea00'} wireframe={false} />
          </mesh>
        )
      })}

      {/* Bone Lines connecting Parent to Child */}
      {rig.joints.map((joint) => {
        if (!joint.parentId) return null
        const childWorld = worldTransforms.get(joint.id)?.position ?? joint.position
        const parentWorld = worldTransforms.get(joint.parentId)?.position
        if (!parentWorld) return null

        const linePoints = [
          [parentWorld.x, parentWorld.y, parentWorld.z] as [number, number, number],
          [childWorld.x, childWorld.y, childWorld.z] as [number, number, number],
        ]

        return (
          <ViewportLine
            key={`bone-${joint.parentId}-${joint.id}`}
            points={linePoints}
            color="#00e5ff"
            lineWidth={2}
          />
        )
      })}
    </group>
  )
}

import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { poseMeshWithRig, type BoneJoint, type SkeletonRig } from '../../mesh/armaturePosing'
import { generateId } from '../../utils/math'

export const ArmaturePosingSection: React.FC = () => {
  const selectedObject = useAppStore((state: any) => {
    const id = state.selectedObjectId
    return state.objects.find((o: any) => o.id === id)
  })
  const updateObject = useAppStore((state: any) => state.updateObject)

  const [rig, setRig] = useState<SkeletonRig>({
    joints: [
      { id: 'joint-root', name: 'Root Joint', parentId: null, position: { x: 0, y: 0, z: 0 }, rotationEuler: { x: 0, y: 0, z: 0 } },
    ],
  })
  const [selectedJointId, setSelectedJointId] = useState<string>('joint-root')

  const selectedJoint = rig.joints.find((j) => j.id === selectedJointId)

  const handleAddJointAtOrigin = () => {
    const newId = `joint-${generateId()}`
    const newJoint: BoneJoint = {
      id: newId,
      name: `Joint ${rig.joints.length + 1}`,
      parentId: selectedJointId ?? null,
      position: { x: 0, y: 5, z: 0 },
      rotationEuler: { x: 0, y: 0, z: 0 },
    }
    setRig({ joints: [...rig.joints, newJoint] })
    setSelectedJointId(newId)
  }

  const handleAddJointAtMeshCenter = () => {
    let posX = 0, posY = 0, posZ = 0
    if (selectedObject && selectedObject.positions.length > 0) {
      for (const p of selectedObject.positions) {
        posX += p.x
        posY += p.y
        posZ += p.z
      }
      posX /= selectedObject.positions.length
      posY /= selectedObject.positions.length
      posZ /= selectedObject.positions.length
    }

    const newId = `joint-${generateId()}`
    const newJoint: BoneJoint = {
      id: newId,
      name: `Joint ${rig.joints.length + 1} (Mesh Center)`,
      parentId: selectedJointId ?? null,
      position: { x: posX, y: posY, z: posZ },
      rotationEuler: { x: 0, y: 0, z: 0 },
    }
    setRig({ joints: [...rig.joints, newJoint] })
    setSelectedJointId(newId)
  }

  const handleAutoBindMesh = () => {
    if (!selectedObject || !updateObject) return
    const restRig: SkeletonRig = {
      joints: rig.joints.map((j) => ({ ...j, rotationEuler: { x: 0, y: 0, z: 0 } })),
    }
    const posedObj = poseMeshWithRig(selectedObject, restRig, rig)
    updateObject(selectedObject.id, posedObj)
  }

  const handleUpdateJoint = (updated: Partial<BoneJoint>) => {
    if (!selectedJointId) return
    const newJoints = rig.joints.map((j) => (j.id === selectedJointId ? { ...j, ...updated } : j))
    const newRig = { joints: newJoints }
    setRig(newRig)

    if (selectedObject && updateObject) {
      const restRig: SkeletonRig = {
        joints: rig.joints.map((j) => ({ ...j, rotationEuler: { x: 0, y: 0, z: 0 } })),
      }
      const posedObj = poseMeshWithRig(selectedObject, restRig, newRig)
      updateObject(selectedObject.id, posedObj)
    }
  }

  return (
    <div style={{ fontSize: '11px', color: '#e0e0e0' }}>
      {/* Joint Selector & Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        <select
          value={selectedJointId}
          onChange={(e) => setSelectedJointId(e.target.value)}
          className="side-panel-select"
          style={{
            width: '100%',
            padding: '4px 6px',
            backgroundColor: 'var(--panel-bg-dark, #14171d)',
            border: '1px solid var(--border-color, #3a3f4d)',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '11px',
          }}
        >
          {rig.joints.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name} {j.parentId ? `(Child of ${rig.joints.find((p) => p.id === j.parentId)?.name})` : '(Root)'}
            </option>
          ))}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button onClick={handleAddJointAtMeshCenter} className="side-btn side-btn-primary" style={{ padding: '4px', fontSize: '10px' }}>
            + Bone at Mesh Center
          </button>
          <button onClick={handleAddJointAtOrigin} className="side-btn" style={{ padding: '4px', fontSize: '10px' }}>
            + Add Child Bone
          </button>
        </div>

        <button onClick={handleAutoBindMesh} className="side-btn side-btn-wide" style={{ padding: '4px', fontSize: '10px', color: '#00e5ff' }}>
          Auto-Bind Selected Mesh to Bones
        </button>
      </div>

      {selectedJoint && (
        <div style={{ backgroundColor: 'var(--panel-bg-dark, #14171d)', padding: '8px', borderRadius: '4px', border: '1px solid #3a3f4d' }}>
          {/* Joint Name & Parent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
            <div>
              <label style={{ display: 'block', color: '#8a8f9e', fontSize: '9px', marginBottom: '2px' }}>Name</label>
              <input
                type="text"
                value={selectedJoint.name}
                onChange={(e) => handleUpdateJoint({ name: e.target.value })}
                style={{ width: '100%', padding: '3px 6px', backgroundColor: '#2a2d34', border: '1px solid #3a3f4d', borderRadius: '3px', color: '#fff', fontSize: '10px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8a8f9e', fontSize: '9px', marginBottom: '2px' }}>Parent</label>
              <select
                value={selectedJoint.parentId ?? ''}
                onChange={(e) => handleUpdateJoint({ parentId: e.target.value || null })}
                style={{ width: '100%', padding: '3px 6px', backgroundColor: '#2a2d34', border: '1px solid #3a3f4d', borderRadius: '3px', color: '#fff', fontSize: '10px' }}
              >
                <option value="">None (Root)</option>
                {rig.joints.filter((j) => j.id !== selectedJoint.id).map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Euler Rotation Controls */}
          <div style={{ color: '#8a8f9e', fontSize: '9px', margin: '6px 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pose Rotation (Degrees)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            {['Pitch (X)', 'Yaw (Y)', 'Roll (Z)'].map((axisLabel, idx) => {
              const keys: ('x' | 'y' | 'z')[] = ['x', 'y', 'z']
              const key = keys[idx]!
              const rad = selectedJoint.rotationEuler?.[key] ?? 0
              const deg = Math.round((rad * 180) / Math.PI)

              return (
                <div key={axisLabel}>
                  <label style={{ display: 'block', color: '#8a8f9e', fontSize: '9px' }}>{axisLabel}: {deg}°</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={deg}
                    onChange={(e) => {
                      const newDeg = parseInt(e.target.value)
                      const newRad = (newDeg * Math.PI) / 180
                      const currEuler = selectedJoint.rotationEuler ?? { x: 0, y: 0, z: 0 }
                      handleUpdateJoint({ rotationEuler: { ...currEuler, [key]: newRad } })
                    }}
                    style={{ width: '100%', accentColor: '#00e5ff' }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

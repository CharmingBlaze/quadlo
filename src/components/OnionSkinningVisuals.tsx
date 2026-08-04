import React from 'react'
import type { OnionGhostFrame } from '../mesh/onionSkinning'

interface OnionSkinningVisualsProps {
  enabled: boolean
  ghosts: OnionGhostFrame[]
}

export const OnionSkinningVisuals: React.FC<OnionSkinningVisualsProps> = ({ enabled, ghosts }) => {
  if (!enabled || ghosts.length === 0) return null

  return (
    <group name="onion-skinning-ghosts">
      {ghosts.map((ghost, idx) => {
        const isPast = ghost.type === 'past'
        const ghostColor = isPast ? '#00e5ff' : '#ff00aa'

        return (
          <group key={`ghost-${ghost.frame}-${idx}`}>
            {/* Render semi-transparent ghost mesh position indicator */}
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={ghostColor} wireframe transparent opacity={ghost.opacity} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

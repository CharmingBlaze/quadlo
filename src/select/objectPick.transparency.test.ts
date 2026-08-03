import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { pickObjectIdFromHits } from './objectPick'

describe('pickObjectIdFromHits', () => {
  it('prefers opaque objects behind transparent surfaces', () => {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))
    glass.userData.sceneObjectId = 'glass'
    glass.userData.pickOpacity = 0.22

    const solid = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
    solid.userData.sceneObjectId = 'solid'
    solid.userData.pickOpacity = 1
    solid.position.z = -2

    const hits = [
      { object: glass, distance: 1, point: new THREE.Vector3() } as THREE.Intersection,
      { object: solid, distance: 3, point: new THREE.Vector3() } as THREE.Intersection,
    ]

    expect(pickObjectIdFromHits(hits)).toBe('solid')
  })

  it('falls back to transparent mesh when nothing opaque is behind it', () => {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
    glass.userData.sceneObjectId = 'glass'
    glass.userData.pickOpacity = 0.22

    const hits = [{ object: glass, distance: 1, point: new THREE.Vector3() } as THREE.Intersection]
    expect(pickObjectIdFromHits(hits)).toBe('glass')
  })
})

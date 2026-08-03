import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { prepareSceneObject } from '../mesh/objectTransform'
import { appendMtlSurfaceLines, resolveExportSurface } from './exportMaterialSurface'
import { exportSceneOBJ } from './sceneExport'
import { sceneObjectToThreeMesh, meshToSceneObject } from './sceneMeshBridge'

describe('export material surface transfer', () => {
  it('writes PBR blocky3d comments and opacity into OBJ MTL for solid meshes', () => {
    const obj = prepareSceneObject({
      id: 'glass-box',
      name: 'GlassBox',
      positions: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      faces: [[0, 1, 2]],
      faceColors: [0x88ccff],
      material: {
        mode: 'solid',
        solidColor: [0.53, 0.8, 1, 1],
        roughness: 0.04,
        metalness: 0,
        opacity: 0.22,
        doubleSided: true,
      },
      color: 0x88ccff,
      topologyLocked: false,
      polyBudget: 32,
      polyBudgetMode: 'strict',
      smoothShading: false,
      facetExaggeration: 0,
    })

    const { mtl } = exportSceneOBJ([obj], 'scene')
    expect(mtl).toContain('d 0.2200')
    expect(mtl).toContain('# blocky3d_pbr roughness=0.0400 metalness=0.0000 opacity=0.2200 doubleSided=1')
    expect(mtl).toContain('gltf_roughness=0.0400')
  })

  it('embeds blocky3dSurface on GLB export meshes', () => {
    const obj = prepareSceneObject({
      id: 'metal',
      name: 'MetalPanel',
      positions: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      faces: [[0, 1, 2]],
      faceColors: [0xaaaaaa],
      material: {
        mode: 'solid',
        solidColor: [0.67, 0.67, 0.67, 1],
        roughness: 0.38,
        metalness: 0.9,
        opacity: 1,
        doubleSided: false,
      },
      color: 0xaaaaaa,
      topologyLocked: false,
      polyBudget: 32,
      polyBudgetMode: 'strict',
      smoothShading: false,
      facetExaggeration: 0,
    })

    const mesh = sceneObjectToThreeMesh(obj)
    const mat = mesh.material as THREE.MeshStandardMaterial
    expect(mat.roughness).toBeCloseTo(0.38)
    expect(mat.metalness).toBeCloseTo(0.9)
    expect(mat.userData.blocky3dSurface).toMatchObject({
      roughness: 0.38,
      metalness: 0.9,
      opacity: 1,
      doubleSided: false,
    })
    mesh.geometry.dispose()
    mat.dispose()
  })

  it('round-trips PBR from exported three mesh back into scene object material', () => {
    const obj = prepareSceneObject({
      id: 'chrome',
      name: 'Chrome',
      positions: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      faces: [[0, 1, 2]],
      faceColors: [0xffffff],
      material: {
        mode: 'solid',
        solidColor: [1, 1, 1, 1],
        roughness: 0.06,
        metalness: 1,
        opacity: 0.8,
        doubleSided: true,
      },
      color: 0xffffff,
      topologyLocked: false,
      polyBudget: 32,
      polyBudgetMode: 'strict',
      smoothShading: false,
      facetExaggeration: 0,
    })

    const mesh = sceneObjectToThreeMesh(obj)
    const imported = meshToSceneObject(mesh)!
    expect(imported.material?.roughness).toBeCloseTo(0.06)
    expect(imported.material?.metalness).toBeCloseTo(1)
    expect(imported.material?.opacity).toBeCloseTo(0.8)
    expect(imported.material?.doubleSided).toBe(true)
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material).dispose()
  })

  it('resolveExportSurface uses matte defaults when unset', () => {
    const surface = resolveExportSurface({
      mode: 'solid',
      opacity: 1,
      doubleSided: false,
    })
    expect(surface.roughness).toBe(1)
    expect(surface.metalness).toBe(0)
  })

  it('appendMtlSurfaceLines includes dissolve and specular exponent', () => {
    const lines: string[] = []
    appendMtlSurfaceLines(lines, {
      roughness: 0.5,
      metalness: 0.2,
      opacity: 0.75,
      doubleSided: false,
    })
    expect(lines.some((line) => line.startsWith('d 0.7500'))).toBe(true)
    expect(lines.some((line) => line.startsWith('Ns '))).toBe(true)
  })
})

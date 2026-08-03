import { HalfEdgeMesh, type SceneObject } from '../src/mesh/HalfEdgeMesh'
import { simplifyMesh } from '../src/mesh/simplification'
import { remeshOrganic } from '../src/mesh/organicRemesh'
import { applySculpt } from '../src/sculpt/sculptTools'
import { unionCoincidentVertices } from '../src/mesh/vertexWeldGroups'
import { defaultMaterial } from '../src/material/materialTypes'

function gridMesh(n: number): SceneObject {
  const positions = []
  for (let y = 0; y <= n; y++) {
    for (let x = 0; x <= n; x++) {
      positions.push({ x: x / n - 0.5, y: Math.sin(x * 0.7) * Math.cos(y * 0.7) * 0.2, z: y / n - 0.5 })
    }
  }
  const faces: number[][] = []
  const faceColors: number[] = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const a = y * (n + 1) + x
      faces.push([a, a + 1, a + n + 2, a + n + 1])
      faceColors.push(0x7ecba1)
    }
  }
  return {
    id: 'bench', name: 'bench', positions, faces, faceColors,
    topologyLocked: false, polyBudget: 999999, polyBudgetMode: 'strict',
    smoothShading: false, facetExaggeration: 0, color: 0x7ecba1,
    material: defaultMaterial(),
  }
}

function time(label: string, fn: () => void): void {
  const t0 = performance.now()
  fn()
  console.log(`${label.padEnd(46)} ${(performance.now() - t0).toFixed(1)} ms`)
}

for (const n of [24, 40, 56]) {
  const obj = gridMesh(n)
  const verts = obj.positions.length
  console.log(`\n--- grid ${n}x${n} (${verts} verts, ${obj.faces.length} quads) ---`)

  time(`simplifyMesh -> ${Math.floor(verts / 4)} verts`, () => {
    simplifyMesh(HalfEdgeMesh.fromObject(obj), Math.floor(verts / 4))
  })

  time(`remeshOrganic -> ${Math.floor(verts / 4)} verts`, () => {
    remeshOrganic(HalfEdgeMesh.fromObject(obj), Math.floor(verts / 4))
  })

  const sculptMesh = HalfEdgeMesh.fromObject(obj)
  time('applySculpt x 60 dabs (one drag second)', () => {
    for (let i = 0; i < 60; i++) {
      applySculpt(sculptMesh, {
        tool: i % 2 ? 'pull' : 'relax',
        center: { x: 0, y: 0, z: 0 },
        radius: 0.35,
        strength: 0.01,
        topologyLocked: false,
      })
    }
  })

  time('unionCoincidentVertices (weld pass)', () => {
    unionCoincidentVertices(obj.positions, 1e-5)
  })
}

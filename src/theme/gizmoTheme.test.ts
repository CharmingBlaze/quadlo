import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { TransformControls } from 'three-stdlib'
import {
  applyTransformControlsTheme,
  syncGizmoInteractionColors,
} from './gizmoTheme'
import { getTheme } from './themes'
import type { ThemeColors } from './useTheme'

function mockTheme(): ThemeColors {
  const css = getTheme('quadlo-default').css
  return {
    css,
    accent: css['--accent'],
    accentNum: 0x6cbaf2,
    accentGreen: css['--accent-green'],
    accentGreenNum: 0x66dc78,
    accentOrange: css['--accent-orange'],
    accentOrangeNum: 0xf0a050,
    accentPink: css['--accent-pink'],
    accentPinkNum: 0xf07070,
    danger: css['--danger'],
    dangerNum: 0xff4444,
    text: css['--text'],
    textMuted: css['--text-muted'],
    bgPanel: css['--bg-panel'],
    bgDark: css['--bg-dark'],
    meshOutline: css['--mesh-outline'],
    meshOutlineSecondary: css['--mesh-outline-secondary'],
    meshSelected: css['--mesh-selected'],
    meshHover: css['--mesh-hover'],
    vertexIdle: '#888',
    vertexIdleBorder: '#666',
    vertexHover: '#aaa',
    vertexHoverBorder: '#888',
    vertexSelected: '#fff',
    vertexSelectedBorder: '#ccc',
    vertexDraft: '#0f0',
    vertexDraftHover: '#8f8',
    objectSelectOutline: css['--mesh-object-selected'] ?? css['--mesh-selected'],
    objectSelectOutlineSecondary: css['--mesh-selected'],
    edgeIdle: '#888',
    edgeHover: '#aaa',
    edgeSelected: '#fff',
    faceIdleFill: '#888',
    faceIdleWire: '#666',
    faceHoverFill: '#aaa',
    faceHoverWire: '#888',
    faceSelectedFill: '#fff',
    faceSelectedWire: '#ccc',
    symmetryPlane: css['--symmetry-plane'] ?? '#888',
    gridCell: css['--grid-cell'],
    gridSection: css['--grid-section'],
    uvCanvasBg: css['--uv-canvas-bg'],
    uvGridA: css['--uv-grid-a'],
    uvGridB: css['--uv-grid-b'],
    axisX: '#f07070',
    axisY: '#66dc78',
    axisZ: '#6cbaf2',
  }
}

function collectGizmoMaterials(controls: TransformControls, mode: 'translate' | 'rotate' | 'scale') {
  const gizmoRoot = (controls as unknown as { gizmo: { gizmo: Record<string, THREE.Object3D> } }).gizmo
  const modeGizmo = gizmoRoot.gizmo[mode]
  const out: Array<{ name: string; opacity: number; color: number; tempColor: number }> = []

  modeGizmo.traverse((obj) => {
    const mesh = obj as THREE.Mesh & { name?: string; tag?: string }
    if (mesh.tag === 'helper' || !mesh.material || !mesh.name) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      if (!(mat instanceof THREE.MeshBasicMaterial || mat instanceof THREE.LineBasicMaterial)) continue
      const ext = mat as THREE.Material & { tempColor?: THREE.Color }
      out.push({
        name: mesh.name,
        opacity: mat.opacity,
        color: mat.color.getHex(),
        tempColor: ext.tempColor?.getHex() ?? 0,
      })
    }
  })
  return out
}

describe('gizmoTheme', () => {
  it('themes active translate gizmo handles with readable opacity and tempColor', () => {
    const camera = new THREE.PerspectiveCamera()
    const controls = new TransformControls(camera)
    const target = new THREE.Object3D()
    controls.attach(target)
    controls.setMode('translate')

    applyTransformControlsTheme(controls, mockTheme())
    controls.updateMatrixWorld()

    const materials = collectGizmoMaterials(controls, 'translate')
    expect(materials.length).toBeGreaterThan(0)

    const axisMaterials = materials.filter((m) => ['X', 'Y', 'Z'].includes(m.name))
    expect(axisMaterials.length).toBeGreaterThan(0)
    for (const mat of axisMaterials) {
      expect(mat.opacity).toBeGreaterThan(0.5)
      expect(mat.color).toBe(mat.tempColor)
      expect(mat.color).not.toBe(0x000000)
    }
  })

  it('syncGizmoInteractionColors delegates to applyTransformControlsTheme', () => {
    const camera = new THREE.PerspectiveCamera()
    const controls = new TransformControls(camera)
    controls.attach(new THREE.Object3D())
    controls.setMode('translate')

    syncGizmoInteractionColors(controls, mockTheme())
    controls.updateMatrixWorld()

    const materials = collectGizmoMaterials(controls, 'translate')
    expect(materials.some((m) => m.name === 'X' && m.opacity > 0.5)).toBe(true)
  })
})

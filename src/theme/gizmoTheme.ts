import * as THREE from 'three'
import type { TransformControls as TransformControlsImpl } from 'three-stdlib'
import type { ThemeColors } from './useTheme'

const GIZMO_SLOT = '__gizmoColorSlot__'
const GIZMO_POLISHED = '__gizmoPolished__'

type GizmoSlot =
  | 'x'
  | 'y'
  | 'z'
  | 'planeA'
  | 'planeB'
  | 'planeC'
  | 'neutral'
  | 'center'
  | 'screen'

/** Default TransformControls material colors from three-stdlib. */
const SLOT_BY_DEFAULT_HEX: Record<number, GizmoSlot> = {
  0xff0000: 'x',
  0x00ff00: 'y',
  0x0000ff: 'z',
  0xffff00: 'planeA',
  0x00ffff: 'planeB',
  0xff00ff: 'planeC',
  0xffffff: 'center',
  0x787878: 'neutral',
}

/** Pro DCC axis RGB — readable on dark viewports without harsh primaries. */
const GIZMO_AXIS_RGB = {
  x: 0xeb4d4b, // rich, vivid red
  y: 0x2ecc71, // rich, vivid green
  z: 0x3498db, // rich, vivid blue
} as const

/** Plane slots map to the axis normal (XY→Z, XZ→Y, YZ→X). */
const PLANE_AXIS: Record<'planeA' | 'planeB' | 'planeC', keyof typeof GIZMO_AXIS_RGB> = {
  planeA: 'z',
  planeB: 'y',
  planeC: 'x',
}

type GizmoMaterial = THREE.MeshBasicMaterial | THREE.LineBasicMaterial

type TransformControlsGizmoRoot = THREE.Object3D & {
  gizmo: Record<'translate' | 'rotate' | 'scale', THREE.Object3D>
}

function gizmoRoot(controls: TransformControlsImpl): TransformControlsGizmoRoot | null {
  const root = (controls as unknown as { gizmo?: TransformControlsGizmoRoot }).gizmo
  return root?.gizmo ? root : null
}

function slotColor(_theme: ThemeColors, slot: GizmoSlot): number {
  switch (slot) {
    case 'x':
      return GIZMO_AXIS_RGB.x
    case 'y':
      return GIZMO_AXIS_RGB.y
    case 'z':
      return GIZMO_AXIS_RGB.z
    case 'planeA':
    case 'planeB':
    case 'planeC':
      return GIZMO_AXIS_RGB[PLANE_AXIS[slot]]
    default:
      return GIZMO_AXIS_RGB.x
  }
}

function resolveSlot(handleName: string | undefined, mat: GizmoMaterial): GizmoSlot {
  if (handleName === 'E') return 'screen'
  if (handleName === 'XYZ') return 'center'
  if (!mat.userData[GIZMO_SLOT]) {
    const hex = mat.color.getHex()
    mat.userData[GIZMO_SLOT] = SLOT_BY_DEFAULT_HEX[hex] ?? 'neutral'
  }
  return mat.userData[GIZMO_SLOT] as GizmoSlot
}

/**
 * Recolor a gizmo material. Only updates color + tempColor so TransformControls'
 * internal updateMatrixWorld hover/dim logic keeps working unchanged.
 */
function themedMaterialColor(
  mat: GizmoMaterial,
  theme: ThemeColors,
  handleName: string | undefined
): void {
  const slot = resolveSlot(handleName, mat)
  const hex = slotColor(theme, slot)
  mat.color.setHex(hex)
  mat.depthTest = false
  mat.depthWrite = false
  if (['XY', 'YZ', 'XZ'].includes(handleName ?? '')) {
    mat.transparent = true
    mat.opacity = 0.35
  } else {
    mat.transparent = true
    mat.opacity = 0.95
  }
  const ext = mat as GizmoMaterial & { tempColor?: THREE.Color }
  if (!(ext.tempColor instanceof THREE.Color)) {
    ext.tempColor = new THREE.Color(hex)
  } else {
    ext.tempColor.setHex(hex)
  }
}

/** One-time scale tweaks for plane fills and center handles (visual gizmo only). */
export function applyGizmoGeometryPolish(controls: TransformControlsImpl): void {
  if (controls.userData[GIZMO_POLISHED]) return
  controls.userData[GIZMO_POLISHED] = true

  const root = gizmoRoot(controls)
  if (!root) return

  for (const mode of ['translate', 'rotate', 'scale'] as const) {
    const group = root.gizmo[mode]
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.geometry || !mesh.name) return

      if (mesh.geometry.type === 'PlaneGeometry' && ['XY', 'YZ', 'XZ'].includes(mesh.name)) {
        mesh.scale.multiplyScalar(1.18)
      }
      if (mesh.name === 'XYZ' && mesh.geometry.type === 'OctahedronGeometry') {
        mesh.scale.multiplyScalar(1.2)
      }
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const mat of materials) {
          mat.depthTest = false
          mat.depthWrite = false
        }
      }
    })
  }
}

/** Recolor translate/rotate/scale gizmo handles. Visual gizmo meshes only — not picker/helpers. */
export function applyTransformControlsTheme(
  controls: TransformControlsImpl,
  theme: ThemeColors
): void {
  const root = gizmoRoot(controls)
  if (!root) return

  for (const mode of ['translate', 'rotate', 'scale'] as const) {
    root.gizmo[mode].traverse((obj) => {
      const handle = obj as THREE.Mesh & { name?: string; tag?: string }
      if (handle.tag === 'helper' || !handle.material) return

      const materials = Array.isArray(handle.material) ? handle.material : [handle.material]
      for (const raw of materials) {
        if (!(raw instanceof THREE.MeshBasicMaterial || raw instanceof THREE.LineBasicMaterial)) continue
        themedMaterialColor(raw, theme, handle.name)
      }
    })
  }
}

/** @deprecated Per-frame hover sync removed — it fought TransformControls' updateMatrixWorld. */
export function syncGizmoInteractionColors(
  controls: TransformControlsImpl,
  theme: ThemeColors
): void {
  applyTransformControlsTheme(controls, theme)
}

/** @deprecated Use applyTransformControlsTheme. */
export function applyGizmoActiveHighlight(
  controls: THREE.Object3D,
  _active: boolean,
  theme: ThemeColors
): void {
  applyTransformControlsTheme(controls as TransformControlsImpl, theme)
}

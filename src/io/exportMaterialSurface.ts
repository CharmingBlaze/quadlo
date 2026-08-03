import type { Material } from '../material/materialTypes'
import {
  DEFAULT_MATERIAL_METALNESS,
  DEFAULT_MATERIAL_ROUGHNESS,
  resolveMaterialSurface,
} from '../material/materialTypes'

/** Resolved surface values used by viewport and all export paths. */
export interface ExportSurfaceSnapshot {
  roughness: number
  metalness: number
  opacity: number
  doubleSided: boolean
}

/** Hints for DCC tools and game engines reading sidecar JSON. */
export interface ExportTargetHints {
  gltf: {
    metallicFactor: number
    roughnessFactor: number
    alphaMode: 'OPAQUE' | 'BLEND' | 'MASK'
    doubleSided: boolean
  }
  blender: {
    PrincipledBSDF: {
      Roughness: number
      Metallic: number
      Alpha: number
    }
    notes: string
  }
  unity: {
    _Metallic: number
    _Smoothness: number
    _Color_alpha: number
  }
  unreal: {
    Roughness: number
    Metallic: number
    Opacity: number
  }
}

export function resolveExportSurface(material: Material): ExportSurfaceSnapshot {
  const { roughness, metalness } = resolveMaterialSurface(material)
  const opacity = Math.max(0, Math.min(1, material.opacity))
  return {
    roughness,
    metalness,
    opacity,
    doubleSided: material.doubleSided,
  }
}

export function surfaceDedupeKey(surface: ExportSurfaceSnapshot): string {
  return [
    surface.roughness.toFixed(3),
    surface.metalness.toFixed(3),
    surface.opacity.toFixed(3),
    surface.doubleSided ? 'ds1' : 'ds0',
  ].join(':')
}

/** Map PBR roughness to Wavefront Ns for legacy DCC importers (Blender OBJ). */
export function roughnessToMtlNs(roughness: number): number {
  const r = Math.max(0.001, Math.min(1, roughness))
  return Math.round(Math.max(0, Math.min(1000, (1 - r) * 1000)))
}

export function buildExportTargetHints(
  surface: ExportSurfaceSnapshot,
  alphaCutout = false
): ExportTargetHints {
  const alphaMode: ExportTargetHints['gltf']['alphaMode'] =
    alphaCutout ? 'MASK' : surface.opacity < 0.999 ? 'BLEND' : 'OPAQUE'

  return {
    gltf: {
      metallicFactor: surface.metalness,
      roughnessFactor: surface.roughness,
      alphaMode,
      doubleSided: surface.doubleSided,
    },
    blender: {
      PrincipledBSDF: {
        Roughness: surface.roughness,
        Metallic: surface.metalness,
        Alpha: surface.opacity,
      },
      notes:
        alphaMode === 'BLEND'
          ? 'Transparent glass/water: enable Blend mode on Principled BSDF. Thin panes may need double-sided faces.'
          : 'Import GLB for automatic Principled BSDF wiring. OBJ uses MTL dissolve + blocky3d_pbr comments.',
    },
    unity: {
      _Metallic: surface.metalness,
      _Smoothness: 1 - surface.roughness,
      _Color_alpha: surface.opacity,
    },
    unreal: {
      Roughness: surface.roughness,
      Metallic: surface.metalness,
      Opacity: surface.opacity,
    },
  }
}

export function appendMtlSurfaceLines(lines: string[], surface: ExportSurfaceSnapshot): void {
  const opacity = surface.opacity
  const ns = roughnessToMtlNs(surface.roughness)
  lines.push(`d ${opacity.toFixed(4)}`)
  lines.push(`Tr ${(1 - opacity).toFixed(4)}`)
  lines.push(`Ns ${ns}`)
  lines.push(`illum ${opacity < 0.999 ? 7 : 2}`)
  lines.push(
    `# blocky3d_pbr roughness=${surface.roughness.toFixed(4)} metalness=${surface.metalness.toFixed(4)} opacity=${opacity.toFixed(4)} doubleSided=${surface.doubleSided ? 1 : 0}`
  )
  lines.push(
    `# blocky3d_targets gltf_metallic=${surface.metalness.toFixed(4)} gltf_roughness=${surface.roughness.toFixed(4)} blender_principled_roughness=${surface.roughness.toFixed(4)} unity_smoothness=${(1 - surface.roughness).toFixed(4)}`
  )
}

/** Parse blocky3d_pbr comment from imported MTL text. */
export function parseMtlBlocky3dPbr(mtlText: string): Partial<ExportSurfaceSnapshot> | null {
  const match = mtlText.match(
    /# blocky3d_pbr roughness=([\d.]+) metalness=([\d.]+) opacity=([\d.]+) doubleSided=([01])/
  )
  if (!match) return null
  return {
    roughness: Number(match[1]),
    metalness: Number(match[2]),
    opacity: Number(match[3]),
    doubleSided: match[4] === '1',
  }
}

export function materialFromExportSurface(
  base: Material,
  surface: ExportSurfaceSnapshot
): Material {
  return {
    ...base,
    roughness: surface.roughness ?? DEFAULT_MATERIAL_ROUGHNESS,
    metalness: surface.metalness ?? DEFAULT_MATERIAL_METALNESS,
    opacity: surface.opacity,
    doubleSided: surface.doubleSided,
  }
}

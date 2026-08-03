import type { FileFilter } from './fileDialogs'
import {
  IMAGE_IMPORT_FILTERS,
  MESH_IMPORT_FILTERS,
} from './download'
import type { ImportFormat } from './sceneImport'

export type ImportKind = 'mesh-auto' | 'mesh-obj' | 'mesh-glb' | 'mesh-gltf' | 'mesh-stl' | 'texture'

export type ExportKind =
  | 'glb'
  | 'gltf'
  | 'obj-mtl'
  | 'obj-zip'
  | 'stl'
  | 'textures-zip'
  | 'materials-json'

export type ImportOption = {
  kind: ImportKind
  label: string
  description: string
  filters: FileFilter[]
  expectedFormat?: ImportFormat
  requiresObjectSelection?: boolean
}

export type ExportOption = {
  kind: ExportKind
  label: string
  description: string
  extension: string
  needsMesh?: boolean
  needsTextures?: boolean
  recommended?: boolean
}

export const IMPORT_OPTIONS: ImportOption[] = [
  {
    kind: 'mesh-auto',
    label: '3D mesh (detect format)',
    description: 'OBJ, GLB, GLTF, or STL — format is detected from the file extension.',
    filters: MESH_IMPORT_FILTERS,
  },
  {
    kind: 'mesh-obj',
    label: 'Wavefront OBJ',
    description: 'Import geometry and materials from an .obj file.',
    filters: [{ name: 'Wavefront OBJ', extensions: ['obj'] }],
    expectedFormat: 'obj',
  },
  {
    kind: 'mesh-glb',
    label: 'GLB (binary glTF)',
    description: 'Import a single-file binary glTF model.',
    filters: [{ name: 'GLB', extensions: ['glb'] }],
    expectedFormat: 'gltf',
  },
  {
    kind: 'mesh-gltf',
    label: 'GLTF (JSON)',
    description: 'Import a JSON glTF model.',
    filters: [{ name: 'GLTF', extensions: ['gltf'] }],
    expectedFormat: 'gltf',
  },
  {
    kind: 'mesh-stl',
    label: 'STL',
    description: 'Import triangle mesh geometry (no materials or UVs).',
    filters: [{ name: 'STL', extensions: ['stl'] }],
    expectedFormat: 'stl',
  },
  {
    kind: 'texture',
    label: 'Texture image',
    description: 'Apply PNG, JPEG, or WebP as a texture on the selected object.',
    filters: IMAGE_IMPORT_FILTERS,
    requiresObjectSelection: true,
  },
]

export const EXPORT_OPTIONS: ExportOption[] = [
  {
    kind: 'glb',
    label: 'GLB — PBR model (recommended)',
    description:
      'Best for Blender & game engines: embeds roughness, metalness, opacity, double-sided, UVs, and textures.',
    extension: '.glb',
    needsMesh: true,
    recommended: true,
  },
  {
    kind: 'gltf',
    label: 'GLTF — PBR JSON model',
    description: 'Same PBR surface data as GLB in JSON form — Unity, Godot, and web pipelines.',
    extension: '.gltf',
    needsMesh: true,
  },
  {
    kind: 'obj-zip',
    label: 'OBJ bundle (ZIP)',
    description:
      'OBJ + MTL + textures + materials JSON with PBR sidecar hints for Blender legacy workflows.',
    extension: '.zip',
    needsMesh: true,
  },
  {
    kind: 'obj-mtl',
    label: 'OBJ + MTL',
    description:
      'Wavefront mesh with MTL dissolve/Ns and blocky3d_pbr comments — pair with materials JSON for full PBR.',
    extension: '.obj',
    needsMesh: true,
  },
  {
    kind: 'stl',
    label: 'STL — geometry only',
    description: 'Triangle mesh for 3D printing; no colors, UVs, or textures.',
    extension: '.stl',
    needsMesh: true,
  },
  {
    kind: 'textures-zip',
    label: 'Painted textures (ZIP)',
    description: 'Export all painted pixel textures in scope as PNG files.',
    extension: '.zip',
    needsTextures: true,
  },
  {
    kind: 'materials-json',
    label: 'Materials manifest (JSON)',
    description:
      'PBR surface snapshot + Blender/Unity/Unreal/glTF mapping hints for the current scope.',
    extension: '.json',
    needsMesh: true,
  },
]

export function importOption(kind: ImportKind): ImportOption {
  return IMPORT_OPTIONS.find((o) => o.kind === kind) ?? IMPORT_OPTIONS[0]!
}

export function exportOption(kind: ExportKind): ExportOption {
  return EXPORT_OPTIONS.find((o) => o.kind === kind) ?? EXPORT_OPTIONS[0]!
}

export function validateImportFile(kind: ImportKind, filename: string): void {
  const option = importOption(kind)
  if (!option.expectedFormat) return

  const lower = filename.toLowerCase()
  const formatOk =
    (option.expectedFormat === 'obj' && lower.endsWith('.obj')) ||
    (option.expectedFormat === 'gltf' &&
      (lower.endsWith('.glb') || lower.endsWith('.gltf'))) ||
    (option.expectedFormat === 'stl' && lower.endsWith('.stl'))

  if (!formatOk) {
    throw new Error(`Expected a ${option.label} file (.${option.filters[0]?.extensions[0] ?? '?'})`)
  }

  if (kind === 'mesh-glb' && !lower.endsWith('.glb')) {
    throw new Error('Expected a .glb file for this import type.')
  }
  if (kind === 'mesh-gltf' && !lower.endsWith('.gltf')) {
    throw new Error('Expected a .gltf file for this import type.')
  }
}

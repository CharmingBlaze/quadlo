export type MaterialMode = 'solid' | 'vertexGradient' | 'texture'

/** RGBA 0–1 */
export type Rgba4 = [number, number, number, number]

export interface Material {
  mode: MaterialMode
  solidColor?: Rgba4
  textureId?: string
  /** Sampling used when UVs leave the 0–1 texture bounds. */
  textureWrap?: 'clamp' | 'repeat' | 'mirror'
  /** Independent texture transform, applied live without rewriting mesh UVs. */
  textureRepeat?: [number, number]
  textureOffset?: [number, number]
  textureRotation?: number
  /** Multiplied with texture RGB; white preserves the original image. */
  textureTint?: Rgba4
  /** 0 keeps original texture colour; 1 applies the full multiplicative tint. */
  textureTintStrength?: number
  textureLumaAlpha?: boolean
  textureBrightness?: number
  textureShadowDetail?: number
  textureGradient?: { start: Rgba4; end: Rgba4; angle: number }
  /** Pixel documents either paint over the base color or replace it with transparent canvas. */
  textureCanvasMode?: 'overlay' | 'replace'
  /** PBR roughness — 1 is fully matte (game default), 0 is mirror-smooth. */
  roughness?: number
  /** PBR metalness — 0 is dielectric (plastic/paint), 1 is metal. */
  metalness?: number
  opacity: number
  doubleSided: boolean
}

/** Game-friendly defaults: matte, non-metallic surfaces unless you opt in. */
export const DEFAULT_MATERIAL_ROUGHNESS = 1
export const DEFAULT_MATERIAL_METALNESS = 0

export type MaterialSurfacePreset =
  | 'matte'
  | 'clay'
  | 'chalk'
  | 'fabric'
  | 'rubber'
  | 'paper'
  | 'plastic'
  | 'semigloss'
  | 'glossy'
  | 'enamel'
  | 'lacquer'
  | 'vinyl'
  | 'carPaint'
  | 'metal'
  | 'brushedSteel'
  | 'chrome'
  | 'copper'
  | 'gold'
  | 'rustedIron'
  | 'aluminum'
  | 'ceramic'
  | 'porcelain'
  | 'marble'
  | 'stone'
  | 'concrete'
  | 'woodMatte'
  | 'woodVarnish'
  | 'sand'
  | 'glassClear'
  | 'glassFrosted'
  | 'glassTinted'
  | 'glassWindow'
  | 'ice'
  | 'water'
  | 'jelly'
  | 'wax'
  | 'wet'
  | 'slime'
  | 'hologram'

export type SurfacePresetCategory =
  | 'Game & matte'
  | 'Paint & plastic'
  | 'Metal'
  | 'Natural'
  | 'Glass & liquid'
  | 'Special'

export interface MaterialSurfacePresetDef {
  label: string
  category: SurfacePresetCategory
  roughness: number
  metalness: number
  /** When set, applying the preset also adjusts material opacity. */
  opacity?: number
  hint: string
}

export const MATERIAL_SURFACE_CATEGORIES: SurfacePresetCategory[] = [
  'Game & matte',
  'Paint & plastic',
  'Metal',
  'Natural',
  'Glass & liquid',
  'Special',
]

export const MATERIAL_SURFACE_PRESETS: Record<MaterialSurfacePreset, MaterialSurfacePresetDef> = {
  matte: {
    label: 'Matte',
    category: 'Game & matte',
    roughness: 1,
    metalness: 0,
    opacity: 1,
    hint: 'Flat game albedo — no specular',
  },
  clay: {
    label: 'Clay',
    category: 'Game & matte',
    roughness: 0.92,
    metalness: 0,
    hint: 'Sculpting clay, dry earth',
  },
  chalk: {
    label: 'Chalk',
    category: 'Game & matte',
    roughness: 0.98,
    metalness: 0,
    hint: 'Soft powdery surface',
  },
  fabric: {
    label: 'Fabric',
    category: 'Game & matte',
    roughness: 0.88,
    metalness: 0,
    hint: 'Cloth, canvas, carpet',
  },
  rubber: {
    label: 'Rubber',
    category: 'Game & matte',
    roughness: 0.78,
    metalness: 0,
    hint: 'Matte tires, gaskets, toys',
  },
  paper: {
    label: 'Paper',
    category: 'Game & matte',
    roughness: 0.95,
    metalness: 0,
    hint: 'Cardboard, books, posters',
  },
  plastic: {
    label: 'Plastic',
    category: 'Paint & plastic',
    roughness: 0.55,
    metalness: 0,
    hint: 'Soft toy / prop plastic',
  },
  semigloss: {
    label: 'Semi-gloss',
    category: 'Paint & plastic',
    roughness: 0.28,
    metalness: 0.05,
    hint: 'Painted wood, enamel trim',
  },
  glossy: {
    label: 'Glossy',
    category: 'Paint & plastic',
    roughness: 0.12,
    metalness: 0.15,
    hint: 'Wet stone, lacquer, ceramic glaze',
  },
  enamel: {
    label: 'Enamel',
    category: 'Paint & plastic',
    roughness: 0.18,
    metalness: 0.08,
    hint: 'Hard baked paint finish',
  },
  lacquer: {
    label: 'Lacquer',
    category: 'Paint & plastic',
    roughness: 0.08,
    metalness: 0.1,
    hint: 'High-shine furniture coat',
  },
  vinyl: {
    label: 'Vinyl',
    category: 'Paint & plastic',
    roughness: 0.42,
    metalness: 0,
    hint: 'Records, UI panels, tarps',
  },
  carPaint: {
    label: 'Car paint',
    category: 'Paint & plastic',
    roughness: 0.15,
    metalness: 0.25,
    hint: 'Automotive clear coat',
  },
  metal: {
    label: 'Metal',
    category: 'Metal',
    roughness: 0.38,
    metalness: 0.9,
    hint: 'Steel, iron, general metal',
  },
  brushedSteel: {
    label: 'Brushed steel',
    category: 'Metal',
    roughness: 0.52,
    metalness: 0.85,
    hint: 'Appliances, brushed panels',
  },
  chrome: {
    label: 'Chrome',
    category: 'Metal',
    roughness: 0.06,
    metalness: 1,
    hint: 'Mirror-polished metal',
  },
  copper: {
    label: 'Copper',
    category: 'Metal',
    roughness: 0.35,
    metalness: 0.92,
    hint: 'Warm oxidizing metal',
  },
  gold: {
    label: 'Gold',
    category: 'Metal',
    roughness: 0.28,
    metalness: 0.95,
    hint: 'Jewelry, coins, trim',
  },
  rustedIron: {
    label: 'Rusted iron',
    category: 'Metal',
    roughness: 0.82,
    metalness: 0.55,
    hint: 'Weathered, rough oxidized metal',
  },
  aluminum: {
    label: 'Aluminum',
    category: 'Metal',
    roughness: 0.45,
    metalness: 0.88,
    hint: 'Anodized cases, foil',
  },
  ceramic: {
    label: 'Ceramic',
    category: 'Natural',
    roughness: 0.22,
    metalness: 0.05,
    hint: 'Glazed pottery, tiles',
  },
  porcelain: {
    label: 'Porcelain',
    category: 'Natural',
    roughness: 0.14,
    metalness: 0.02,
    hint: 'Fine white ceramic',
  },
  marble: {
    label: 'Marble',
    category: 'Natural',
    roughness: 0.32,
    metalness: 0.03,
    hint: 'Polished stone counters',
  },
  stone: {
    label: 'Stone',
    category: 'Natural',
    roughness: 0.72,
    metalness: 0,
    hint: 'Rough rock, cobble',
  },
  concrete: {
    label: 'Concrete',
    category: 'Natural',
    roughness: 0.86,
    metalness: 0,
    hint: 'Sidewalks, brutalist walls',
  },
  woodMatte: {
    label: 'Wood matte',
    category: 'Natural',
    roughness: 0.68,
    metalness: 0,
    hint: 'Unfinished lumber',
  },
  woodVarnish: {
    label: 'Wood varnish',
    category: 'Natural',
    roughness: 0.24,
    metalness: 0.04,
    hint: 'Polished hardwood floor',
  },
  sand: {
    label: 'Sand',
    category: 'Natural',
    roughness: 0.94,
    metalness: 0,
    hint: 'Beach, desert ground',
  },
  glassClear: {
    label: 'Glass clear',
    category: 'Glass & liquid',
    roughness: 0.04,
    metalness: 0,
    opacity: 0.22,
    hint: 'Transparent pane — use double-sided',
  },
  glassFrosted: {
    label: 'Glass frosted',
    category: 'Glass & liquid',
    roughness: 0.48,
    metalness: 0,
    opacity: 0.55,
    hint: 'Etched or sandblasted glass',
  },
  glassTinted: {
    label: 'Glass tinted',
    category: 'Glass & liquid',
    roughness: 0.08,
    metalness: 0,
    opacity: 0.38,
    hint: 'Smoked windows, bottles',
  },
  glassWindow: {
    label: 'Window glass',
    category: 'Glass & liquid',
    roughness: 0.02,
    metalness: 0,
    opacity: 0.12,
    hint: 'Very clear architectural glass',
  },
  ice: {
    label: 'Ice',
    category: 'Glass & liquid',
    roughness: 0.12,
    metalness: 0,
    opacity: 0.65,
    hint: 'Frozen blocks, icicles',
  },
  water: {
    label: 'Water',
    category: 'Glass & liquid',
    roughness: 0.05,
    metalness: 0,
    opacity: 0.35,
    hint: 'Calm pool surface',
  },
  jelly: {
    label: 'Jelly',
    category: 'Glass & liquid',
    roughness: 0.35,
    metalness: 0,
    opacity: 0.72,
    hint: 'Soft translucent gel',
  },
  wax: {
    label: 'Wax',
    category: 'Glass & liquid',
    roughness: 0.4,
    metalness: 0,
    opacity: 0.88,
    hint: 'Candles, paraffin',
  },
  wet: {
    label: 'Wet',
    category: 'Special',
    roughness: 0.06,
    metalness: 0.08,
    hint: 'Rain-soaked surfaces',
  },
  slime: {
    label: 'Slime',
    category: 'Special',
    roughness: 0.25,
    metalness: 0,
    opacity: 0.78,
    hint: 'Goo, gel monsters',
  },
  hologram: {
    label: 'Hologram',
    category: 'Special',
    roughness: 0.1,
    metalness: 0.35,
    opacity: 0.45,
    hint: 'Sci-fi emissive panels',
  },
}

export type MaterialSurfacePatch = Partial<Pick<Material, 'roughness' | 'metalness' | 'opacity'>>

export function surfacePresetPatch(preset: MaterialSurfacePresetDef): MaterialSurfacePatch {
  const patch: MaterialSurfacePatch = {
    roughness: preset.roughness,
    metalness: preset.metalness,
  }
  if (preset.opacity != null) patch.opacity = preset.opacity
  return patch
}

export function resolveMaterialSurface(material: Material): { roughness: number; metalness: number } {
  return {
    roughness: material.roughness ?? DEFAULT_MATERIAL_ROUGHNESS,
    metalness: material.metalness ?? DEFAULT_MATERIAL_METALNESS,
  }
}

export type GradientDirection = 'x' | 'y' | 'z' | 'radial'

/** Normalized position on the material gradient editor (0–1). */
export interface GradientHandle2D {
  u: number
  v: number
}

export type HarmonyScheme = 'complementary' | 'analogous' | 'triadic' | 'monochromatic'

export interface ColorCornerRef {
  faceIndex: number
  cornerIndex: number
}

export interface CustomPalette {
  id: string
  name: string
  colors: string[]
}

export interface MaterialEditorColor {
  r: number
  g: number
  b: number
  a: number
}

export function rgba4(r: number, g: number, b: number, a = 1): Rgba4 {
  return [r, g, b, a]
}

export function hexToRgba4(hex: string, alpha = 1): Rgba4 {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha]
}

export function rgba4ToHex([r, g, b]: Rgba4): string {
  const ri = Math.round(Math.max(0, Math.min(1, r)) * 255)
  const gi = Math.round(Math.max(0, Math.min(1, g)) * 255)
  const bi = Math.round(Math.max(0, Math.min(1, b)) * 255)
  return `#${((ri << 16) | (gi << 8) | bi).toString(16).padStart(6, '0')}`
}

export function numberToRgba4(color: number, alpha = 1): Rgba4 {
  return [
    ((color >> 16) & 255) / 255,
    ((color >> 8) & 255) / 255,
    (color & 255) / 255,
    alpha,
  ]
}

export function rgba4ToNumber([r, g, b]: Rgba4): number {
  const ri = Math.round(Math.max(0, Math.min(1, r)) * 255)
  const gi = Math.round(Math.max(0, Math.min(1, g)) * 255)
  const bi = Math.round(Math.max(0, Math.min(1, b)) * 255)
  return (ri << 16) | (gi << 8) | bi
}

/** Classic DCC clay grey — default tint for newly created mesh geometry. */
export const DEFAULT_MESH_COLOR = 0xa8a8a8
export const DEFAULT_MESH_COLOR_HEX = '#a8a8a8'

export function defaultMaterial(color = DEFAULT_MESH_COLOR): Material {
  return {
    mode: 'solid',
    solidColor: numberToRgba4(color),
    roughness: DEFAULT_MATERIAL_ROUGHNESS,
    metalness: DEFAULT_MATERIAL_METALNESS,
    opacity: 1,
    // Match historical viewport behavior (solids rendered both sides).
    doubleSided: false,
  }
}

export function cloneMaterial(m: Material): Material {
  return {
    ...m,
    solidColor: m.solidColor ? [...m.solidColor] as Rgba4 : undefined,
    textureTint: m.textureTint ? [...m.textureTint] as Rgba4 : undefined,
    textureRepeat: m.textureRepeat ? [...m.textureRepeat] as [number, number] : undefined,
    textureOffset: m.textureOffset ? [...m.textureOffset] as [number, number] : undefined,
    textureGradient: m.textureGradient
      ? { start: [...m.textureGradient.start] as Rgba4, end: [...m.textureGradient.end] as Rgba4, angle: m.textureGradient.angle }
      : undefined,
  }
}

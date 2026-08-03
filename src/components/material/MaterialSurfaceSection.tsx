import type { Material } from '../../material/materialTypes'
import {
  MATERIAL_SURFACE_CATEGORIES,
  MATERIAL_SURFACE_PRESETS,
  resolveMaterialSurface,
  surfacePresetPatch,
  type MaterialSurfacePatch,
  type MaterialSurfacePreset,
} from '../../material/materialTypes'

type MaterialSurfaceSectionProps = {
  material: Material
  disabled?: boolean
  onPatch: (patch: MaterialSurfacePatch) => void
}

function activePreset(material: Material): MaterialSurfacePreset | null {
  const { roughness, metalness } = resolveMaterialSurface(material)
  const opacity = material.opacity
  for (const [id, preset] of Object.entries(MATERIAL_SURFACE_PRESETS) as Array<
    [MaterialSurfacePreset, (typeof MATERIAL_SURFACE_PRESETS)[MaterialSurfacePreset]]
  >) {
    if (
      Math.abs(preset.roughness - roughness) < 0.04 &&
      Math.abs(preset.metalness - metalness) < 0.04 &&
      (preset.opacity == null || Math.abs((preset.opacity ?? 1) - opacity) < 0.06)
    ) {
      return id
    }
  }
  return null
}

function presetMeta(preset: (typeof MATERIAL_SURFACE_PRESETS)[MaterialSurfacePreset]): string {
  const parts = [
    `R ${Math.round(preset.roughness * 100)}`,
    `M ${Math.round(preset.metalness * 100)}`,
  ]
  if (preset.opacity != null && preset.opacity < 0.999) {
    parts.push(`O ${Math.round(preset.opacity * 100)}`)
  }
  return parts.join(' · ')
}

export function MaterialSurfaceSection({
  material,
  disabled = false,
  onPatch,
}: MaterialSurfaceSectionProps) {
  const { roughness, metalness } = resolveMaterialSurface(material)
  const opacity = material.opacity
  const preset = activePreset(material)

  return (
    <div className="mat-surface-section">
      <p className="side-color-hint muted">
        Controls shine and transparency in Model / Flat / Smooth views. Glass presets lower opacity —
        enable double-sided for thin panes.
      </p>
      <div className="mat-surface-presets-scroll">
        {MATERIAL_SURFACE_CATEGORIES.map((category) => {
          const entries = Object.entries(MATERIAL_SURFACE_PRESETS).filter(
            ([, p]) => p.category === category
          ) as Array<[MaterialSurfacePreset, (typeof MATERIAL_SURFACE_PRESETS)[MaterialSurfacePreset]]>
          if (entries.length === 0) return null
          return (
            <div key={category} className="mat-surface-category">
              <span className="mat-surface-category-title">{category}</span>
              <div className="mat-preset-grid mat-preset-grid-surfaces">
                {entries.map(([id, p]) => (
                  <button
                    key={id}
                    type="button"
                    className={`mat-preset-btn${preset === id ? ' active' : ''}`}
                    title={p.hint}
                    disabled={disabled}
                    onClick={() => onPatch(surfacePresetPatch(p))}
                  >
                    <span className="mat-preset-btn-label">{p.label}</span>
                    <span className="mat-preset-btn-meta">{presetMeta(p)}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <label className="mat-slider-row">
        <span>Roughness</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={roughness}
          disabled={disabled}
          onChange={(e) => onPatch({ roughness: Number(e.target.value), metalness, opacity })}
        />
        <span>{Math.round(roughness * 100)}%</span>
      </label>
      <label className="mat-slider-row">
        <span>Metalness</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={metalness}
          disabled={disabled}
          onChange={(e) => onPatch({ roughness, metalness: Number(e.target.value), opacity })}
        />
        <span>{Math.round(metalness * 100)}%</span>
      </label>
      <label className="mat-slider-row">
        <span>Opacity</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={opacity}
          disabled={disabled}
          onChange={(e) => onPatch({ roughness, metalness, opacity: Number(e.target.value) })}
        />
        <span>{Math.round(opacity * 100)}%</span>
      </label>
      <button
        type="button"
        className="side-btn side-btn-wide"
        disabled={disabled}
        onClick={() => onPatch({ roughness: 1, metalness: 0, opacity: 1 })}
      >
        Reset to matte
      </button>
    </div>
  )
}

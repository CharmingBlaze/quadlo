import { useMemo } from 'react'
import { ColorWheelPicker } from './ColorWheelPicker'
import { PRESET_PALETTES, PRESET_PALETTE_CATEGORIES } from '../../material/palettes'
import type { CustomPalette, HarmonyScheme, Rgba4 } from '../../material/materialTypes'
import { hexToRgba4, rgba4ToHex } from '../../material/materialTypes'

export interface ColorPickerSectionProps {
  color: Rgba4
  paletteId: string
  customPalettes: CustomPalette[]
  onChange: (color: Rgba4) => void
  onCommit: (color: Rgba4) => void
  onPaletteIdChange: (id: string) => void
  onAddSwatch: () => void
  onHarmony: (scheme: HarmonyScheme) => void
  hintLabel?: string
}

/** Shared color wheel + palette strip (material paint or pixel pen). */
export function ColorPickerSection({
  color,
  paletteId,
  customPalettes,
  onChange,
  onCommit,
  onPaletteIdChange,
  onAddSwatch,
  onHarmony,
  hintLabel = 'Color',
}: ColorPickerSectionProps) {
  const paletteOptions = useMemo(
    () => [
      ...PRESET_PALETTES.map((p) => ({ id: p.id, name: p.name, category: p.category })),
      ...customPalettes.map((p) => ({ id: p.id, name: p.name, category: 'Custom' as const })),
    ],
    [customPalettes]
  )

  const swatchCountLabel = (id: string, category: string) => {
    if (category === 'Custom') {
      return customPalettes.find((c) => c.id === id)?.colors.length ?? 0
    }
    return PRESET_PALETTES.find((preset) => preset.id === id)?.colors.length ?? 0
  }

  const swatches = useMemo(() => {
    const preset = PRESET_PALETTES.find((p) => p.id === paletteId)
    if (preset) return preset.colors
    const custom = customPalettes.find((p) => p.id === paletteId)
    return custom?.colors ?? PRESET_PALETTES[0]!.colors
  }, [paletteId, customPalettes])

  const schemes: { id: HarmonyScheme; label: string }[] = [
    { id: 'complementary', label: 'Comp' },
    { id: 'analogous', label: 'Analog' },
    { id: 'triadic', label: 'Triad' },
    { id: 'monochromatic', label: 'Mono' },
  ]

  return (
    <div className="mat-color-section">
      <ColorWheelPicker color={color} onChange={onChange} onCommit={onCommit} />
      <label className="mat-field">
        <span>Palette</span>
        <select
          className="shape-kind-select side-select"
          value={paletteId}
          onChange={(e) => onPaletteIdChange(e.target.value)}
        >
          {PRESET_PALETTE_CATEGORIES.map((category) => (
            <optgroup key={category} label={category}>
              {paletteOptions
                .filter((p) => p.category === category)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({swatchCountLabel(p.id, p.category)})
                  </option>
                ))}
            </optgroup>
          ))}
          {customPalettes.length > 0 && (
            <optgroup label="Custom">
              {paletteOptions
                .filter((p) => p.category === 'Custom')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({swatchCountLabel(p.id, p.category)})
                  </option>
                ))}
            </optgroup>
          )}
        </select>
      </label>
      <div
        className={`mat-palette-grid${swatches.length > 24 ? ' mat-palette-grid-scroll' : ''}`}
        title={`${swatches.length} swatches`}
      >
        {swatches.map((hex, i) => (
          <button
            key={`${hex}-${i}`}
            type="button"
            className="mat-palette-swatch"
            style={{ background: hex }}
            title={hex}
            onClick={() => onCommit(hexToRgba4(hex, color[3]))}
          />
        ))}
        <button type="button" className="mat-palette-swatch add" onClick={onAddSwatch} title="Add swatch">
          +
        </button>
      </div>
      <div className="mat-harmony-row">
        {schemes.map((scheme) => (
          <button
            key={scheme.id}
            type="button"
            className="side-btn"
            title={`Generate ${scheme.id} palette`}
            onClick={() => onHarmony(scheme.id)}
          >
            {scheme.label}
          </button>
        ))}
      </div>
      <p className="side-color-hint muted">
        {hintLabel}: {rgba4ToHex(color)} · {Math.round(color[3] * 100)}% alpha
      </p>
    </div>
  )
}

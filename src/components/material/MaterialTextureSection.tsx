import { useMemo } from 'react'
import type { Material } from '../../material/materialTypes'
import { hexToRgba4, rgba4ToHex } from '../../material/materialTypes'
import { compositeLayers } from '../../pixel/compositeLayers'
import type { PixelDocument } from '../../pixel/pixelTypes'
import type { UvTextureInfo } from '../../store/uvEditorSlice'

type MaterialTextureSectionProps = {
  material: Material
  textureInfo?: UvTextureInfo
  pixelDoc?: PixelDocument | null
  disabled?: boolean
  onImport: () => void
  onExport: () => void
  onOpenPixelEditor: () => void
  onOpenUvEditor: () => void
  onPatch: (patch: Partial<Material>) => void
}

const WRAP_OPTIONS: Array<{ value: NonNullable<Material['textureWrap']>; label: string }> = [
  { value: 'clamp', label: 'Clamp' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'mirror', label: 'Mirror' },
]

export function MaterialTextureSection({
  material,
  textureInfo,
  pixelDoc,
  disabled = false,
  onImport,
  onExport,
  onOpenPixelEditor,
  onOpenUvEditor,
  onPatch,
}: MaterialTextureSectionProps) {
  const repeat = material.textureRepeat ?? [1, 1]
  const offset = material.textureOffset ?? [0, 0]
  const rotation = material.textureRotation ?? 0
  const tint = material.textureTint ?? [1, 1, 1, 1]
  const tintStrength = material.textureTintStrength ?? 0.5
  const brightness = material.textureBrightness ?? 1
  const shadowDetail = material.textureShadowDetail ?? 0
  const canvasMode = material.textureCanvasMode ?? 'overlay'

  const previewStyle = useMemo(() => {
    if (!pixelDoc) return undefined
    const canvas = document.createElement('canvas')
    canvas.width = pixelDoc.width
    canvas.height = pixelDoc.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const pixels = compositeLayers(pixelDoc)
    const imageData = new ImageData(pixelDoc.width, pixelDoc.height)
    imageData.data.set(pixels)
    ctx.putImageData(imageData, 0, 0)
    return { backgroundImage: `url(${canvas.toDataURL()})` }
  }, [pixelDoc])

  return (
    <div className="mat-texture-section">
      <div className="mat-texture-preview-wrap">
        <div
          className="mat-texture-preview"
          style={previewStyle}
          title={textureInfo ? `${textureInfo.name} (${textureInfo.width}×${textureInfo.height})` : 'No texture'}
        >
          {!pixelDoc && <span className="mat-texture-preview-empty">No texture</span>}
        </div>
        <div className="mat-texture-meta">
          {textureInfo ? (
            <>
              <strong>{textureInfo.name}</strong>
              <span>
                {textureInfo.width}×{textureInfo.height}px
              </span>
            </>
          ) : (
            <span className="muted">Import an image or paint in the Pixel Editor.</span>
          )}
        </div>
      </div>

      <div className="mat-workflow-row">
        <button type="button" className="side-btn" disabled={disabled} onClick={onOpenPixelEditor}>
          Pixel Editor
        </button>
        <button type="button" className="side-btn" disabled={disabled} onClick={onOpenUvEditor}>
          UV Editor
        </button>
      </div>

      <div className="mat-btn-row">
        <button type="button" className="side-btn" disabled={disabled} onClick={onImport}>
          Import…
        </button>
        <button type="button" className="side-btn" disabled={disabled || !textureInfo} onClick={onExport}>
          Export PNG
        </button>
      </div>

      <div className="mat-subsection">
        <span className="mat-subsection-title">Sampling</span>
        <div className="mat-segment-row">
          {WRAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`side-btn${(material.textureWrap ?? 'clamp') === opt.value ? ' active' : ''}`}
              disabled={disabled}
              onClick={() => onPatch({ textureWrap: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="mat-field-block">
          <span>Canvas mode</span>
          <select
            className="side-select shape-kind-select"
            value={canvasMode}
            disabled={disabled}
            onChange={(e) =>
              onPatch({ textureCanvasMode: e.target.value as 'overlay' | 'replace' })
            }
          >
            <option value="overlay">Overlay on base color</option>
            <option value="replace">Replace with texture</option>
          </select>
        </label>
      </div>

      <div className="mat-subsection">
        <span className="mat-subsection-title">Tiling &amp; offset</span>
        <div className="mat-field-grid">
          <label className="mat-field">
            <span>Repeat U</span>
            <input
              type="number"
              min={0.01}
              max={64}
              step={0.05}
              value={repeat[0]}
              disabled={disabled}
              onChange={(e) =>
                onPatch({ textureRepeat: [Number(e.target.value), repeat[1]] })
              }
            />
          </label>
          <label className="mat-field">
            <span>Repeat V</span>
            <input
              type="number"
              min={0.01}
              max={64}
              step={0.05}
              value={repeat[1]}
              disabled={disabled}
              onChange={(e) =>
                onPatch({ textureRepeat: [repeat[0], Number(e.target.value)] })
              }
            />
          </label>
          <label className="mat-field">
            <span>Offset U</span>
            <input
              type="number"
              min={-8}
              max={8}
              step={0.01}
              value={offset[0]}
              disabled={disabled}
              onChange={(e) =>
                onPatch({ textureOffset: [Number(e.target.value), offset[1]] })
              }
            />
          </label>
          <label className="mat-field">
            <span>Offset V</span>
            <input
              type="number"
              min={-8}
              max={8}
              step={0.01}
              value={offset[1]}
              disabled={disabled}
              onChange={(e) =>
                onPatch({ textureOffset: [offset[0], Number(e.target.value)] })
              }
            />
          </label>
        </div>
        <label className="mat-slider-row">
          <span>Rotation</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={Math.round((rotation * 180) / Math.PI)}
            disabled={disabled}
            onChange={(e) =>
              onPatch({ textureRotation: (Number(e.target.value) * Math.PI) / 180 })
            }
          />
          <span>{Math.round((rotation * 180) / Math.PI)}°</span>
        </label>
        <button
          type="button"
          className="side-btn side-btn-wide"
          disabled={disabled}
          onClick={() =>
            onPatch({
              textureRepeat: [1, 1],
              textureOffset: [0, 0],
              textureRotation: 0,
              textureWrap: 'clamp',
            })
          }
        >
          Reset tiling
        </button>
      </div>

      <div className="mat-subsection">
        <span className="mat-subsection-title">Color &amp; tone</span>
        <label className="mat-gradient-stop">
          <span>Tint</span>
          <input
            type="color"
            value={rgba4ToHex(tint)}
            disabled={disabled}
            onChange={(e) => onPatch({ textureTint: hexToRgba4(e.target.value, tint[3]) })}
          />
        </label>
        <label className="mat-slider-row">
          <span>Tint strength</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={tintStrength}
            disabled={disabled}
            onChange={(e) => onPatch({ textureTintStrength: Number(e.target.value) })}
          />
          <span>{Math.round(tintStrength * 100)}%</span>
        </label>
        <label className="mat-slider-row">
          <span>Brightness</span>
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.01}
            value={brightness}
            disabled={disabled}
            onChange={(e) => onPatch({ textureBrightness: Number(e.target.value) })}
          />
          <span>{Math.round(brightness * 100)}%</span>
        </label>
        <label className="mat-slider-row">
          <span>Shadow detail</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={shadowDetail}
            disabled={disabled}
            onChange={(e) => onPatch({ textureShadowDetail: Number(e.target.value) })}
          />
          <span>{Math.round(shadowDetail * 100)}%</span>
        </label>
        <label className="side-checkbox">
          <input
            type="checkbox"
            checked={material.textureLumaAlpha ?? false}
            disabled={disabled}
            onChange={(e) => onPatch({ textureLumaAlpha: e.target.checked })}
          />
          <span>Cut dark pixels (luma alpha)</span>
        </label>
      </div>
    </div>
  )
}

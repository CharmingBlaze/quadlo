import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { FloatingPanel } from './FloatingPanel'
import { ColorPickerSection } from './material/ColorPickerSection'
import { GradientLineEditor } from './material/GradientLineEditor'
import { MaterialTextureSection } from './material/MaterialTextureSection'
import { MaterialSurfaceSection } from './material/MaterialSurfaceSection'
import { useAppStore } from '../store/appStore'
import { syncGradientStopsFromObject } from '../material/materialEditorSlice'
import type { GradientDirection, MaterialMode } from '../material/materialTypes'
import { hexToRgba4, rgba4ToHex } from '../material/materialTypes'
import { resolveEffectiveMaterial } from '../material/materials'
import { downloadObjectTexturePng } from '../io/materialTextureExport'
import { pickOpenFile } from '../io/fileDialogs'
import { IMAGE_IMPORT_FILTERS } from '../io/download'

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
  }
}

const MODE_LABELS: Record<MaterialMode, string> = {
  solid: 'Solid',
  vertexGradient: 'Gradient',
  texture: 'Texture',
}

export function MaterialEditorPanel() {
  const {
    materialEditorOpen,
    materialEditorPanel,
    materialEditorColor,
    materialEditorPaletteId,
    materialEditorCustomPalettes,
    materialEditorEyedropperActive,
    materialEditorGradientDirection,
    materialEditorGradientStart,
    materialEditorGradientEnd,
    materialEditorGradientActiveStop,
    materialEditorGradientStops,
    materialEditorApplyToSelection,
    selectedObjectId,
    selectionObjectIds,
    selectionMode,
    meshSelection,
    objectTextures,
    pixelDocuments,
    setMaterialEditorPanel,
    toggleMaterialEditor,
    setMaterialEditorColorLive,
    commitMaterialEditorColor,
    setMaterialEditorPaletteId,
    addCustomPaletteSwatch,
    generateMaterialHarmonyPalette,
    setMaterialEditorEyedropperActive,
    setMaterialEditorGradientDirection,
    setMaterialEditorGradientHandle,
    setMaterialEditorGradientActiveStop,
    beginMaterialEditorGradientDrag,
    commitMaterialEditorGradientDrag,
    setMaterialEditorGradientStop,
    previewMaterialEditorGradient,
    setMaterialEditorApplyToSelection,
    setMaterialEditorMode,
    setMaterialOpacity,
    setMaterialDoubleSided,
    patchMaterialTextureSettings,
    patchMaterialSurfaceSettings,
    createCustomPalette,
    renameCustomPalette,
    deleteCustomPalette,
    loadObjectTexture,
    openPixelEditor,
    setUvEditorOpen,
  } = useAppStore(
    useShallow((s) => ({
      materialEditorOpen: s.materialEditorOpen,
      materialEditorPanel: s.materialEditorPanel,
      materialEditorColor: s.materialEditorColor,
      materialEditorPaletteId: s.materialEditorPaletteId,
      materialEditorCustomPalettes: s.materialEditorCustomPalettes,
      materialEditorEyedropperActive: s.materialEditorEyedropperActive,
      materialEditorGradientDirection: s.materialEditorGradientDirection,
      materialEditorGradientStart: s.materialEditorGradientStart,
      materialEditorGradientEnd: s.materialEditorGradientEnd,
      materialEditorGradientActiveStop: s.materialEditorGradientActiveStop,
      materialEditorGradientStops: s.materialEditorGradientStops,
      materialEditorApplyToSelection: s.materialEditorApplyToSelection,
      materialColorCancelEpoch: s.materialColorCancelEpoch,
      selectedObjectId: s.selectedObjectId,
      selectionObjectIds: s.selectionObjectIds,
      selectionMode: s.selectionMode,
      meshSelection: s.meshSelection,
      objectTextures: s.objectTextures,
      pixelDocuments: s.pixelDocuments,
      setMaterialEditorPanel: s.setMaterialEditorPanel,
      toggleMaterialEditor: s.toggleMaterialEditor,
      setMaterialEditorColorLive: s.setMaterialEditorColorLive,
      commitMaterialEditorColor: s.commitMaterialEditorColor,
      setMaterialEditorPaletteId: s.setMaterialEditorPaletteId,
      addCustomPaletteSwatch: s.addCustomPaletteSwatch,
      generateMaterialHarmonyPalette: s.generateMaterialHarmonyPalette,
      setMaterialEditorEyedropperActive: s.setMaterialEditorEyedropperActive,
      setMaterialEditorGradientDirection: s.setMaterialEditorGradientDirection,
      setMaterialEditorGradientHandle: s.setMaterialEditorGradientHandle,
      setMaterialEditorGradientActiveStop: s.setMaterialEditorGradientActiveStop,
      beginMaterialEditorGradientDrag: s.beginMaterialEditorGradientDrag,
      commitMaterialEditorGradientDrag: s.commitMaterialEditorGradientDrag,
      setMaterialEditorGradientStop: s.setMaterialEditorGradientStop,
      previewMaterialEditorGradient: s.previewMaterialEditorGradient,
      setMaterialEditorApplyToSelection: s.setMaterialEditorApplyToSelection,
      setMaterialEditorMode: s.setMaterialEditorMode,
      setMaterialOpacity: s.setMaterialOpacity,
      setMaterialDoubleSided: s.setMaterialDoubleSided,
      patchMaterialTextureSettings: s.patchMaterialTextureSettings,
      patchMaterialSurfaceSettings: s.patchMaterialSurfaceSettings,
      createCustomPalette: s.createCustomPalette,
      renameCustomPalette: s.renameCustomPalette,
      deleteCustomPalette: s.deleteCustomPalette,
      loadObjectTexture: s.loadObjectTexture,
      openPixelEditor: s.openPixelEditor,
      setUvEditorOpen: s.setUvEditorOpen,
    }))
  )

  const primaryId = selectedObjectId ?? selectionObjectIds[0] ?? null
  const obj = useAppStore((s) => s.objects.find((o) => o.id === primaryId) ?? null)
  const mat = obj ? resolveEffectiveMaterial(obj) : null
  const hasSelection = selectionObjectIds.length > 0 || !!selectedObjectId
  const mode = mat?.mode ?? 'solid'

  const texId = mode === 'texture' ? mat?.textureId ?? primaryId : null
  const textureInfo = texId ? objectTextures[texId] : undefined
  const pixelDoc = texId ? pixelDocuments[texId] ?? null : null

  const selectionSummary = useMemo(() => {
    if (!hasSelection || !obj) return 'No object selected'
    const parts: string[] = [obj.name || 'Object']
    if (selectionMode === 'face' && meshSelection?.objectId === obj.id && meshSelection.faces.length > 0) {
      parts.push(`${meshSelection.faces.length} face${meshSelection.faces.length === 1 ? '' : 's'}`)
    } else if (selectionMode === 'vertex' && meshSelection?.vertices.length) {
      parts.push(`${meshSelection.vertices.length} verts`)
    } else if (selectionMode === 'edge' && meshSelection?.edges.length) {
      parts.push(`${meshSelection.edges.length} edges`)
    }
    parts.push(MODE_LABELS[mode])
    return parts.join(' · ')
  }, [hasSelection, obj, selectionMode, meshSelection, mode])

  useEffect(() => {
    if (!materialEditorOpen || !obj) return
    const stops = syncGradientStopsFromObject(obj)
    if (stops) {
      useAppStore.setState({
        materialEditorGradientStops: stops,
      })
    }
  }, [materialEditorOpen, primaryId, obj?.id, obj?.cornerColors])

  const runEyedropper = useCallback(async () => {
    if (window.EyeDropper) {
      try {
        const dropper = new window.EyeDropper()
        const result = await dropper.open()
        commitMaterialEditorColor(hexToRgba4(result.sRGBHex, materialEditorColor[3]))
        setMaterialEditorEyedropperActive(false)
        return
      } catch {
        /* cancelled */
      }
    }
    setMaterialEditorEyedropperActive(true)
  }, [commitMaterialEditorColor, materialEditorColor, setMaterialEditorEyedropperActive])

  useEffect(() => {
    if (!materialEditorEyedropperActive) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.material-editor-panel')) return
      const swatchEl = target?.closest('[data-mat-swatch]') as HTMLElement | null
      if (swatchEl?.dataset.color) {
        commitMaterialEditorColor(hexToRgba4(swatchEl.dataset.color, materialEditorColor[3]))
        setMaterialEditorEyedropperActive(false)
        return
      }
      setMaterialEditorEyedropperActive(false)
    }
    window.addEventListener('mousedown', onDown, true)
    return () => window.removeEventListener('mousedown', onDown, true)
  }, [
    materialEditorEyedropperActive,
    commitMaterialEditorColor,
    materialEditorColor,
    setMaterialEditorEyedropperActive,
  ])

  const textureCtx = useMemo(
    () => ({ pixelDocuments, objectTextures }),
    [pixelDocuments, objectTextures]
  )

  const exportTexture = useCallback(async () => {
    if (!obj) return
    await downloadObjectTexturePng(obj, textureCtx)
  }, [obj, textureCtx])

  const importTexture = useCallback(async () => {
    if (!primaryId) return
    const file = await pickOpenFile({
      title: 'Import texture',
      filters: IMAGE_IMPORT_FILTERS,
    })
    if (file) await loadObjectTexture(primaryId, file)
  }, [loadObjectTexture, primaryId])

  const openLinkedPixelEditor = useCallback(() => {
    if (!primaryId) return
    openPixelEditor({ linkObjectId: primaryId })
  }, [openPixelEditor, primaryId])

  const openLinkedUvEditor = useCallback(() => {
    setUvEditorOpen(true)
  }, [setUvEditorOpen])

  if (!materialEditorOpen) return null

  return (
    <FloatingPanel
      title="Material Editor"
      open={materialEditorOpen}
      state={materialEditorPanel}
      minWidth={360}
      minHeight={480}
      onClose={toggleMaterialEditor}
      onStateChange={setMaterialEditorPanel}
    >
      <div className="material-editor-panel">
        <div className="mat-context-bar">
          <div className="mat-context-main">
            <span className="mat-context-label">{selectionSummary}</span>
            {!hasSelection && (
              <span className="mat-context-hint muted">Edits apply to new objects</span>
            )}
          </div>
          <button
            type="button"
            className={`mat-icon-btn${materialEditorEyedropperActive ? ' active' : ''}`}
            title="Eyedropper — sample from screen or swatches"
            onClick={() => void runEyedropper()}
          >
            ⌖
          </button>
        </div>

        <div className="mat-section mat-section-compact">
          <span className="mat-section-title">Material type</span>
          <div className="mat-mode-row">
            {(['solid', 'vertexGradient', 'texture'] as MaterialMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`side-btn side-btn-wide${mode === m ? ' active' : ''}`}
                disabled={!hasSelection && m !== 'solid'}
                onClick={() => setMaterialEditorMode(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {(mode === 'solid' || mode === 'vertexGradient') && (
          <>
            <div className="mat-section">
              <span className="mat-section-title">Color &amp; palette</span>
              <ColorPickerSection
                color={materialEditorColor}
                paletteId={materialEditorPaletteId}
                customPalettes={materialEditorCustomPalettes}
                onChange={setMaterialEditorColorLive}
                onCommit={commitMaterialEditorColor}
                onPaletteIdChange={setMaterialEditorPaletteId}
                onAddSwatch={addCustomPaletteSwatch}
                onHarmony={(scheme) => generateMaterialHarmonyPalette(scheme)}
                hintLabel="Active"
              />
              {materialEditorCustomPalettes.some((p) => p.id === materialEditorPaletteId) && (
                <div className="mat-btn-row">
                  <button
                    type="button"
                    className="side-btn"
                    onClick={() => {
                      const name = window.prompt('Palette name')
                      if (name) renameCustomPalette(materialEditorPaletteId, name)
                    }}
                  >
                    Rename palette
                  </button>
                  <button
                    type="button"
                    className="side-btn"
                    onClick={() => deleteCustomPalette(materialEditorPaletteId)}
                  >
                    Delete
                  </button>
                  <button type="button" className="side-btn" onClick={() => createCustomPalette()}>
                    + Palette
                  </button>
                </div>
              )}
              <label className="mat-slider-row">
                <span>Opacity</span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.01}
                  value={mat?.opacity ?? materialEditorColor[3]}
                  onChange={(e) => setMaterialOpacity(Number(e.target.value))}
                />
                <span>{Math.round((mat?.opacity ?? materialEditorColor[3]) * 100)}%</span>
              </label>
            </div>

            {mode === 'vertexGradient' && (
              <div className="mat-section">
                <span className="mat-section-title">Vertex gradient</span>
                <p className="side-color-hint muted">
                  Drag the stops to shape a world-space gradient on your mesh.
                </p>
                <GradientLineEditor
                  start={materialEditorGradientStart}
                  end={materialEditorGradientEnd}
                  stops={materialEditorGradientStops}
                  activeStop={materialEditorGradientActiveStop}
                  radial={materialEditorGradientDirection === 'radial'}
                  disabled={!hasSelection}
                  onStartChange={(h) => setMaterialEditorGradientHandle(0, h)}
                  onEndChange={(h) => setMaterialEditorGradientHandle(1, h)}
                  onActiveStopChange={setMaterialEditorGradientActiveStop}
                  onDragBegin={beginMaterialEditorGradientDrag}
                  onDragEnd={commitMaterialEditorGradientDrag}
                />
                <label className="mat-field-block">
                  <span>Direction preset</span>
                  <select
                    className="side-select shape-kind-select"
                    value={materialEditorGradientDirection}
                    onChange={(e) =>
                      setMaterialEditorGradientDirection(e.target.value as GradientDirection)
                    }
                  >
                    <option value="x">World X</option>
                    <option value="y">World Y</option>
                    <option value="z">World Z</option>
                    <option value="radial">Radial</option>
                  </select>
                </label>
                <div className="mat-gradient-stops">
                  {materialEditorGradientStops.map((stop, i) => (
                    <label
                      key={i}
                      className={`mat-gradient-stop${materialEditorGradientActiveStop === i ? ' active' : ''}`}
                    >
                      <span>Stop {i + 1}</span>
                      <input
                        type="color"
                        value={rgba4ToHex(stop)}
                        onFocus={() => setMaterialEditorGradientActiveStop(i as 0 | 1)}
                        onChange={(e) =>
                          setMaterialEditorGradientStop(i, hexToRgba4(e.target.value, stop[3]))
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="side-checkbox">
                  <input
                    type="checkbox"
                    checked={materialEditorApplyToSelection}
                    onChange={(e) => setMaterialEditorApplyToSelection(e.target.checked)}
                  />
                  <span>Apply to current selection only</span>
                </label>
                <button
                  type="button"
                  className="side-btn side-btn-wide"
                  disabled={!hasSelection}
                  onClick={previewMaterialEditorGradient}
                >
                  Re-apply gradient
                </button>
              </div>
            )}
          </>
        )}

        {mode === 'texture' && mat && (
          <div className="mat-section">
            <span className="mat-section-title">Texture material</span>
            <MaterialTextureSection
              material={mat}
              textureInfo={textureInfo}
              pixelDoc={pixelDoc}
              disabled={!hasSelection}
              onImport={() => void importTexture()}
              onExport={() => void exportTexture()}
              onOpenPixelEditor={openLinkedPixelEditor}
              onOpenUvEditor={openLinkedUvEditor}
              onPatch={patchMaterialTextureSettings}
            />
          </div>
        )}

        <div className="mat-section">
          <span className="mat-section-title">Surface</span>
          {mat && (
            <MaterialSurfaceSection
              material={mat}
              disabled={!hasSelection}
              onPatch={patchMaterialSurfaceSettings}
            />
          )}
          <label className="side-checkbox">
            <input
              type="checkbox"
              checked={mat?.doubleSided ?? false}
              disabled={!hasSelection}
              onChange={(e) => setMaterialDoubleSided(e.target.checked)}
            />
            <span>Double-sided (draw both face sides)</span>
          </label>
        </div>
      </div>
    </FloatingPanel>
  )
}

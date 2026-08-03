import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import {
  registerViewportInvalidator,
  unregisterViewportInvalidator,
  updateViewportInvalidatorVisibility,
  invalidateViewport,
  invalidateAllViewports,
} from '../../rendering/viewportInvalidation'
import { useAppStore } from '../../store/appStore'
import { useViewportRuntime } from './ViewportRuntimeContext'
import { useCancelInvalidateOnUnmount } from '../ViewportRenderContext'

/** Register this canvas with the shared invalidation service. */
export function ViewportInvalidatorBridge() {
  const { slotIndex, layoutVisible } = useViewportRuntime()
  const invalidate = useThree((s) => s.invalidate)
  useCancelInvalidateOnUnmount(invalidate)

  useEffect(() => {
    registerViewportInvalidator(slotIndex, invalidate, layoutVisible)
    return () => unregisterViewportInvalidator(slotIndex, invalidate)
  }, [slotIndex, invalidate])

  useEffect(() => {
    updateViewportInvalidatorVisibility(slotIndex, layoutVisible)
    if (layoutVisible) invalidateViewport(slotIndex, 'layout')
  }, [slotIndex, layoutVisible])

  return null
}

/**
 * Scene / selection / material / CAD draft changes → every visible viewport.
 * Hover that belongs to this slot → this viewport only.
 */
export function ViewportSceneInvalidator({
  objects,
  themeId,
  meshSelection,
  selectionObjectIds,
  selectedObjectId,
  viewportDisplayMode,
  viewportXRay,
  activeTool,
  showGrid,
  facetExaggeration,
  showDensityHeatmap,
  cadPreviewSignal,
}: {
  objects: unknown
  themeId: unknown
  meshSelection: unknown
  selectionObjectIds: unknown
  selectedObjectId: unknown
  viewportDisplayMode: unknown
  viewportXRay: unknown
  activeTool: unknown
  showGrid: unknown
  facetExaggeration: unknown
  showDensityHeatmap: unknown
  cadPreviewSignal: unknown
}) {
  const { slotIndex, layoutVisible } = useViewportRuntime()
  const viewportShadowsEnabled = useAppStore((s) => s.viewportShadowsEnabled)
  const meshHover = useAppStore((s) => s.meshHover)
  const hoverForThisSlot =
    meshHover?.viewportSlot === undefined || meshHover.viewportSlot === slotIndex
      ? meshHover
      : null

  // Shared scene / selection — each visible slot demand-renders itself.
  // Pixel texture uploads invalidate via invalidateAllViewports — do not
  // re-render the React viewport tree on every stroke commit.
  useEffect(() => {
    if (!layoutVisible) return
    invalidateViewport(slotIndex, 'scene')
  }, [
    objects,
    themeId,
    meshSelection,
    selectionObjectIds,
    selectedObjectId,
    viewportDisplayMode,
    viewportShadowsEnabled,
    viewportXRay,
    activeTool,
    showGrid,
    facetExaggeration,
    showDensityHeatmap,
    layoutVisible,
    slotIndex,
  ])

  // Hover — owning slot only (including clear when hover leaves this slot).
  useEffect(() => {
    if (!layoutVisible) return
    invalidateViewport(slotIndex, 'hover')
  }, [hoverForThisSlot, slotIndex, layoutVisible])

  // CAD / stroke drafts — every visible slot (previews mount in all of them).
  useEffect(() => {
    if (!layoutVisible) return
    invalidateViewport(slotIndex, 'cad-preview')
  }, [cadPreviewSignal, slotIndex, layoutVisible])

  return null
}

/** Live sketch/pen stroke preview — keep every visible viewport in sync while drawing. */
export function ViewportStrokeInvalidator() {
  const { layoutVisible } = useViewportRuntime()
  const isDrawing = useAppStore((s) => s.isDrawing)
  const currentStrokePreview = useAppStore((s) => s.currentStrokePreview)
  const currentStrokeView = useAppStore((s) => s.currentStrokeView)
  const vectorShapePreviewKey = useAppStore((s) => {
    if (!s.vectorIsDrawing || s.activeTool !== 'vector-shape') return null
    const b = s.vectorDraft[s.vectorDraft.length - 1]
    return `${s.vectorDraftView}:${s.vectorDraft.length}:${b?.x ?? ''}:${b?.y ?? ''}`
  })
  const penPreviewKey = useAppStore((s) => {
    const draft = s.vectorPenDraft
    if (!draft) return null
    const preview = draft.previewPoint
    return `${draft.view}:${draft.anchors.length}:${draft.closed ? 1 : 0}:${preview?.x ?? ''}:${preview?.y ?? ''}`
  })

  useEffect(() => {
    if (!layoutVisible) return
    if (!isDrawing && !penPreviewKey && !vectorShapePreviewKey) return
    invalidateAllViewports('cad-preview')
  }, [
    isDrawing,
    currentStrokePreview,
    currentStrokeView,
    penPreviewKey,
    vectorShapePreviewKey,
    layoutVisible,
  ])

  return null
}

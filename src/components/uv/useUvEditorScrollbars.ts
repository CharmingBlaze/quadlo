import { useCallback, type RefObject } from 'react'
import { useAppStore } from '../../store/appStore'
import {
  uvEditorPanCssFromPainted,
  uvEditorPanFromScrollRatio,
  uvEditorScrollAxisMetrics,
  uvEditorScrollDocSpan,
} from '../../uv/uvEditorView'

export interface UvViewPanZoom {
  panX: number
  panY: number
  zoom: number
}

export interface UvEditorScrollbarParams {
  containerRef: RefObject<HTMLDivElement | null>
  viewLayerRef: RefObject<HTMLDivElement | null>
  viewportSizeRef: RefObject<{ w: number; h: number }>
  liveViewRef: RefObject<UvViewPanZoom | null>
  paintedViewRef: RefObject<UvViewPanZoom>
  scrollThumbHRef: RefObject<HTMLDivElement | null>
  scrollThumbVRef: RefObject<HTMLDivElement | null>
  texW: number
  texH: number
  pan: { x: number; y: number }
  zoom: number
  setUvEditorView: (zoom: number, panX: number, panY: number) => void
  /** Scrollbars own their pointer stream; any in-flight canvas drag is abandoned. */
  cancelDrag: () => void
}

/**
 * Scrollbar geometry plus the shared camera helpers the rest of the panel reads.
 *
 * Thumbs are measured against a fixed padded atlas (half a texture beyond each
 * edge) so they stay meaningful when zoomed far past the 0-1 range.
 */
export function useUvEditorScrollbars({
  containerRef,
  viewLayerRef,
  viewportSizeRef,
  liveViewRef,
  paintedViewRef,
  scrollThumbHRef,
  scrollThumbVRef,
  texW,
  texH,
  pan,
  zoom,
  setUvEditorView,
  cancelDrag,
}: UvEditorScrollbarParams) {
  const containerEl = containerRef.current
  if (containerEl) {
    const w = containerEl.clientWidth
    const h = containerEl.clientHeight
    if (w > 0 && h > 0) viewportSizeRef.current = { w, h }
  }
  const cw = viewportSizeRef.current.w || containerEl?.clientWidth || 600
  const ch = viewportSizeRef.current.h || containerEl?.clientHeight || 600

  const docX0 = -texW * 0.5
  const docX1 = texW * 1.5
  const docY0 = -texH * 0.5
  const docY1 = texH * 1.5
  const docSpanX = Math.max(docX1 - docX0, 1)
  const docSpanY = Math.max(docY1 - docY0, 1)
  const viewW = cw / Math.max(zoom, 1e-6)
  const viewH = ch / Math.max(zoom, 1e-6)
  const xMinVisible = -pan.x / Math.max(zoom, 1e-6)
  const yMinVisible = -pan.y / Math.max(zoom, 1e-6)

  const trackW = Math.max(1, cw - 16)
  const trackH = Math.max(1, ch - 16)
  const thumbW = Math.max(24, trackW * Math.min(1, viewW / docSpanX))
  const thumbHSize = Math.max(24, trackH * Math.min(1, viewH / docSpanY))
  const scrollRangeX = Math.max(0, docSpanX - viewW)
  const scrollRangeY = Math.max(0, docSpanY - viewH)
  const posRatioX =
    scrollRangeX > 0 ? Math.max(0, Math.min(1, (xMinVisible - docX0) / scrollRangeX)) : 0
  const posRatioY =
    scrollRangeY > 0 ? Math.max(0, Math.min(1, (yMinVisible - docY0) / scrollRangeY)) : 0
  const thumbX = (trackW - thumbW) * posRatioX
  const thumbY = (trackH - thumbHSize) * posRatioY
  const showScrollH = scrollRangeX > 1e-3
  const showScrollV = scrollRangeY > 1e-3

  const getViewPanZoom = useCallback((): UvViewPanZoom => {
    const live = liveViewRef.current
    if (live) return live
    const state = useAppStore.getState()
    return {
      panX: state.uvEditorPanX,
      panY: state.uvEditorPanY,
      zoom: state.uvEditorZoom,
    }
  }, [liveViewRef])

  /** Pan moves the frozen viewport paint; zoom/content changes call redraw. */
  const applyCamera = useCallback(() => {
    const layer = viewLayerRef.current
    if (!layer) return
    const live = getViewPanZoom()
    const painted = paintedViewRef.current
    if (Math.abs(live.zoom - painted.zoom) > 1e-6) {
      layer.style.transform = ''
      return
    }
    layer.style.transform = uvEditorPanCssFromPainted(painted, live)
  }, [getViewPanZoom, paintedViewRef, viewLayerRef])

  const syncScrollThumbsFromView = useCallback(
    (view: UvViewPanZoom) => {
      const container = containerRef.current
      const vw = Math.max(1, viewportSizeRef.current.w || container?.clientWidth || 600)
      const vh = Math.max(1, viewportSizeRef.current.h || container?.clientHeight || 600)
      const z = Math.max(view.zoom, 1e-6)
      const xMin = -view.panX / z
      const yMin = -view.panY / z
      const visW = vw / z
      const visH = vh / z
      const d0x = -texW * 0.5
      const d1x = texW * 1.5
      const d0y = -texH * 0.5
      const d1y = texH * 1.5
      const spanXv = Math.max(d1x - d0x, 1)
      const spanYv = Math.max(d1y - d0y, 1)
      const trackWv = Math.max(1, vw - 16)
      const trackHv = Math.max(1, vh - 16)
      const thumbWv = Math.max(24, trackWv * Math.min(1, visW / spanXv))
      const thumbHv = Math.max(24, trackHv * Math.min(1, visH / spanYv))
      const rangeX = Math.max(0, spanXv - visW)
      const rangeY = Math.max(0, spanYv - visH)
      const posXv = rangeX > 0 ? Math.max(0, Math.min(1, (xMin - d0x) / rangeX)) : 0
      const posYv = rangeY > 0 ? Math.max(0, Math.min(1, (yMin - d0y) / rangeY)) : 0
      if (scrollThumbHRef.current) {
        scrollThumbHRef.current.style.left = `${(trackWv - thumbWv) * posXv}px`
        scrollThumbHRef.current.style.width = `${thumbWv}px`
      }
      if (scrollThumbVRef.current) {
        scrollThumbVRef.current.style.top = `${(trackHv - thumbHv) * posYv}px`
        scrollThumbVRef.current.style.height = `${thumbHv}px`
      }
    },
    [containerRef, scrollThumbHRef, scrollThumbVRef, texH, texW, viewportSizeRef]
  )

  const finishScrollbarPan = useCallback(() => {
    const live = liveViewRef.current
    if (!live) return
    // Do not clear liveView here — clearing before the store updates snaps the camera back.
    setUvEditorView(live.zoom, live.panX, live.panY)
    applyCamera()
  }, [applyCamera, liveViewRef, setUvEditorView])

  const handleScrollHThumbDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current
      if (container) {
        viewportSizeRef.current = { w: container.clientWidth, h: container.clientHeight }
      }
      const startClientX = e.clientX
      const view = getViewPanZoom()
      const startPanX = view.panX
      const currentZoom = view.zoom
      const currentPanY = view.panY
      const vw = Math.max(1, viewportSizeRef.current.w || 600)
      const { span } = uvEditorScrollDocSpan(texW)
      const { panPerPx } = uvEditorScrollAxisMetrics(vw, currentZoom, span)
      liveViewRef.current = { zoom: currentZoom, panX: startPanX, panY: currentPanY }
      cancelDrag()

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startClientX
        liveViewRef.current = {
          zoom: currentZoom,
          panX: startPanX - dx * panPerPx,
          panY: currentPanY,
        }
        applyCamera()
        syncScrollThumbsFromView(liveViewRef.current)
      }

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
        finishScrollbarPan()
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    },
    [
      applyCamera,
      cancelDrag,
      containerRef,
      finishScrollbarPan,
      getViewPanZoom,
      liveViewRef,
      syncScrollThumbsFromView,
      texW,
      viewportSizeRef,
    ]
  )

  const handleScrollVThumbDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current
      if (container) {
        viewportSizeRef.current = { w: container.clientWidth, h: container.clientHeight }
      }
      const startClientY = e.clientY
      const view = getViewPanZoom()
      const startPanY = view.panY
      const currentZoom = view.zoom
      const currentPanX = view.panX
      const vh = Math.max(1, viewportSizeRef.current.h || 600)
      const { span } = uvEditorScrollDocSpan(texH)
      const { panPerPx } = uvEditorScrollAxisMetrics(vh, currentZoom, span)
      liveViewRef.current = { zoom: currentZoom, panX: currentPanX, panY: startPanY }
      cancelDrag()

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dy = moveEvent.clientY - startClientY
        liveViewRef.current = {
          zoom: currentZoom,
          panX: currentPanX,
          panY: startPanY - dy * panPerPx,
        }
        applyCamera()
        syncScrollThumbsFromView(liveViewRef.current)
      }

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
        finishScrollbarPan()
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    },
    [
      applyCamera,
      cancelDrag,
      containerRef,
      finishScrollbarPan,
      getViewPanZoom,
      liveViewRef,
      syncScrollThumbsFromView,
      texH,
      viewportSizeRef,
    ]
  )

  const handleScrollHTrackDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== e.currentTarget || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const view = getViewPanZoom()
      const vw = Math.max(1, viewportSizeRef.current.w || cw)
      const { doc0, span } = uvEditorScrollDocSpan(texW)
      const { track, thumb, range } = uvEditorScrollAxisMetrics(vw, view.zoom, span)
      if (range <= 0) return
      const ratio = Math.max(0, Math.min(1, (clickX - thumb / 2) / Math.max(1, track - thumb)))
      liveViewRef.current = {
        zoom: view.zoom,
        panX: uvEditorPanFromScrollRatio(doc0, range, ratio, view.zoom),
        panY: view.panY,
      }
      cancelDrag()
      applyCamera()
      syncScrollThumbsFromView(liveViewRef.current)
      finishScrollbarPan()
    },
    [
      applyCamera,
      cancelDrag,
      cw,
      finishScrollbarPan,
      getViewPanZoom,
      liveViewRef,
      syncScrollThumbsFromView,
      texW,
      viewportSizeRef,
    ]
  )

  const handleScrollVTrackDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== e.currentTarget || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clickY = e.clientY - rect.top
      const view = getViewPanZoom()
      const vh = Math.max(1, viewportSizeRef.current.h || ch)
      const { doc0, span } = uvEditorScrollDocSpan(texH)
      const { track, thumb, range } = uvEditorScrollAxisMetrics(vh, view.zoom, span)
      if (range <= 0) return
      const ratio = Math.max(0, Math.min(1, (clickY - thumb / 2) / Math.max(1, track - thumb)))
      liveViewRef.current = {
        zoom: view.zoom,
        panX: view.panX,
        panY: uvEditorPanFromScrollRatio(doc0, range, ratio, view.zoom),
      }
      cancelDrag()
      applyCamera()
      syncScrollThumbsFromView(liveViewRef.current)
      finishScrollbarPan()
    },
    [
      applyCamera,
      cancelDrag,
      ch,
      finishScrollbarPan,
      getViewPanZoom,
      liveViewRef,
      syncScrollThumbsFromView,
      texH,
      viewportSizeRef,
    ]
  )

  return {
    cw,
    ch,
    trackW,
    trackH,
    thumbW,
    thumbHSize,
    thumbX,
    thumbY,
    showScrollH,
    showScrollV,
    getViewPanZoom,
    applyCamera,
    syncScrollThumbsFromView,
    finishScrollbarPan,
    handleScrollHThumbDown,
    handleScrollVThumbDown,
    handleScrollHTrackDown,
    handleScrollVTrackDown,
  }
}

import type { ViewMoveBasis } from '../utils/viewNavigation'
import {
  loadViewportLwToolsLayout,
  saveViewportLwToolsLayout,
  type ViewportLwToolsLayout,
} from './viewportLwToolsPersistence'
import type { ViewportDisplayMode } from '../rendering/viewportDisplay'
import { DEFAULT_VIEWPORT_SLOT_VIEWS } from '../scene/viewTypes'
import type { SelectableViewType, ViewType, ViewportSlotIndex } from '../scene/viewTypes'
import type { ViewportFitFrame } from '../viewport/fitViewports'
import {
  clearViewportSplits,
  loadViewportSplits,
  saveViewportSplits,
} from './viewportSplitPersistence'

export interface FloatingToolbarPosition {
  x: number
  y: number
}

/** Previous top-left defaults — used to one-time migrate in-memory positions on load. */
export const LEGACY_TOOLBAR_POSITIONS = {
  transform: { x: 20, y: 20 },
  primitives: { x: 20, y: 72 },
} as const

/** Layout constants for bottom-docked toolbar cluster (match App.css sizing). */
export const TOOLBAR_LAYOUT = {
  bottomInset: 24,
  gap: 16,
  toolbarHeight: 36,
  /** handle(16) + label(56) + 8×42 btn + divider(9) + close(28) + padding(8) + gaps(22) */
  transformWidth: 475,
  /** handle(16) + 13×28 icons + close(28) + padding(8) + gaps(26) */
  primitivesWidth: 440,
} as const

type LegacyHorizontalSnapshot = BottomToolbarLayout & {
  transformWidth: number
  primitivesWidth: number
  /** Centered on full window width (ignored side panel). */
  centerInFullWindow?: boolean
  /** Side panel was wrongly treated as left-docked (added panel width to clusterLeft). */
  mistakenLeftPanelOffset?: boolean
}

/** Prior horizontal bottom snapshots — migrate when positions still match these. */
const LEGACY_HORIZONTAL_BOTTOM_SNAPSHOTS: LegacyHorizontalSnapshot[] = [
  {
    bottomInset: 20,
    gap: 10,
    toolbarHeight: 32,
    transformWidth: 500,
    primitivesWidth: 398,
    centerInFullWindow: true,
  },
  {
    bottomInset: 20,
    gap: 10,
    toolbarHeight: 32,
    transformWidth: 500,
    primitivesWidth: 398,
    mistakenLeftPanelOffset: true,
  },
  {
    ...TOOLBAR_LAYOUT,
    mistakenLeftPanelOffset: true,
  },
  {
    ...TOOLBAR_LAYOUT,
    centerInFullWindow: true,
  },
]

/** Previous vertical-at-bottom layout — used to migrate in-memory positions on load. */
const LEGACY_VERTICAL_BOTTOM_LAYOUT = {
  gap: 10,
  transformHeight: 32,
  primitivesWidth: 36,
  primitivesHeight: 418,
} as const

function toolbarPositionsEqual(a: FloatingToolbarPosition, b: FloatingToolbarPosition): boolean {
  return a.x === b.x && a.y === b.y
}

type BottomToolbarLayout = {
  bottomInset: number
  gap: number
  toolbarHeight: number
  transformWidth: number
  primitivesWidth: number
}

/** Default inspector width — wider on touch devices for readable, tappable controls. */
export function defaultSidePanelWidth(): number {
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return 300
  }
  return 280
}

/** Measured main canvas width (`.app-main`), excluding the right side panel. */
export function measureViewportAreaWidth(): number | null {
  if (typeof document === 'undefined') return null
  const appMain = document.querySelector('.app-main')
  if (appMain instanceof HTMLElement && appMain.offsetWidth >= 320) {
    return appMain.offsetWidth
  }
  return null
}

/** Bottom-docked defaults centered in the viewport area (left of side panel). */
export function computeBottomToolbarPositions(options?: {
  viewportWidth?: number
  /** Measured `.app-main` width — used directly without subtracting the side panel again. */
  mainAreaWidth?: number
  viewportHeight?: number
  sidePanelWidth?: number
  showSidePanel?: boolean
  showPrimitivesBar?: boolean
  showTransformBar?: boolean
  primitivesWidth?: number
  transformWidth?: number
  layout?: Partial<BottomToolbarLayout>
  /** When true, center on full window (legacy migration fingerprint only). */
  centerInFullWindow?: boolean
  /** When true, reproduce the mistaken left-docked side-panel offset (legacy migration only). */
  mistakenLeftPanelOffset?: boolean
}): {
  transformBarPosition: FloatingToolbarPosition
  primitivesBarPosition: FloatingToolbarPosition
} {
  const vw = options?.viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1920)
  const vh = options?.viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 1080)
  const sidePanelWidth = options?.sidePanelWidth ?? defaultSidePanelWidth()
  const showSidePanel = options?.showSidePanel ?? true
  const showPrimitives = options?.showPrimitivesBar ?? true
  const showTransform = options?.showTransformBar ?? true
  const panelW = showSidePanel ? sidePanelWidth : 0
  const layout = { ...TOOLBAR_LAYOUT, ...options?.layout }
  const bottomInset = layout.bottomInset
  const gap = layout.gap
  const toolbarHeight = layout.toolbarHeight
  const transformWidth = options?.transformWidth ?? layout.transformWidth
  const primitivesWidth = options?.primitivesWidth ?? layout.primitivesWidth
  const viewportW = Math.max(
    320,
    options?.mainAreaWidth ??
      (options?.centerInFullWindow ? vw : vw - panelW)
  )
  const toolbarY = Math.round(vh - bottomInset - toolbarHeight)

  const clusterLeftForWidth = (width: number) => {
    const centeredLeft = Math.max(16, (viewportW - width) / 2)
    if (options?.mistakenLeftPanelOffset) return panelW + centeredLeft
    if (options?.centerInFullWindow) return Math.max(16, (vw - width) / 2)
    return centeredLeft
  }

  if (showPrimitives && showTransform) {
    const clusterWidth = primitivesWidth + gap + transformWidth
    const clusterLeft = clusterLeftForWidth(clusterWidth)
    return {
      primitivesBarPosition: { x: Math.round(clusterLeft), y: toolbarY },
      transformBarPosition: { x: Math.round(clusterLeft + primitivesWidth + gap), y: toolbarY },
    }
  }

  if (showTransform) {
    const left = clusterLeftForWidth(transformWidth)
    return {
      primitivesBarPosition: { x: Math.round(left), y: toolbarY },
      transformBarPosition: { x: Math.round(left), y: toolbarY },
    }
  }

  if (showPrimitives) {
    const left = clusterLeftForWidth(primitivesWidth)
    return {
      primitivesBarPosition: { x: Math.round(left), y: toolbarY },
      transformBarPosition: { x: Math.round(left), y: toolbarY },
    }
  }

  const left = clusterLeftForWidth(transformWidth)
  return {
    primitivesBarPosition: { x: Math.round(left), y: toolbarY },
    transformBarPosition: { x: Math.round(left), y: toolbarY },
  }
}

/** Measure rendered toolbar widths for mounted panels (optional refinement). */
export function measureToolbarClusterWidths(): {
  primitivesWidth: number
  transformWidth: number
} | null {
  if (typeof document === 'undefined') return null
  const primitivesEl = document.querySelector('.primitives-toolbar')
  const transformEl = document.querySelector('.transform-toolbar')
  let primitivesWidth: number = TOOLBAR_LAYOUT.primitivesWidth
  let transformWidth: number = TOOLBAR_LAYOUT.transformWidth
  let hasMeasured = false
  if (primitivesEl instanceof HTMLElement && primitivesEl.offsetWidth >= 8) {
    primitivesWidth = primitivesEl.offsetWidth
    hasMeasured = true
  }
  if (transformEl instanceof HTMLElement && transformEl.offsetWidth >= 8) {
    transformWidth = transformEl.offsetWidth
    hasMeasured = true
  }
  if (!hasMeasured) return null
  return { primitivesWidth, transformWidth }
}

function isLegacyVerticalBottomCluster(
  transform: FloatingToolbarPosition,
  primitives: FloatingToolbarPosition
): boolean {
  const yDiff = transform.y - primitives.y
  const xGap = transform.x - (primitives.x + LEGACY_VERTICAL_BOTTOM_LAYOUT.primitivesWidth)
  const expectedYDiff =
    LEGACY_VERTICAL_BOTTOM_LAYOUT.primitivesHeight - LEGACY_VERTICAL_BOTTOM_LAYOUT.transformHeight
  return (
    Math.abs(yDiff - expectedYDiff) <= 1 &&
    Math.abs(xGap - LEGACY_VERTICAL_BOTTOM_LAYOUT.gap) <= 1
  )
}

function isLegacyHorizontalBottomCluster(
  transform: FloatingToolbarPosition,
  primitives: FloatingToolbarPosition,
  sidePanelWidth: number,
  showSidePanel: boolean
): boolean {
  if (Math.abs(transform.y - primitives.y) > 1) return false
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  for (const snapshot of LEGACY_HORIZONTAL_BOTTOM_SNAPSHOTS) {
    const expected = computeBottomToolbarPositions({
      viewportWidth: vw,
      viewportHeight: vh,
      sidePanelWidth,
      showSidePanel,
      layout: snapshot,
      transformWidth: snapshot.transformWidth,
      primitivesWidth: snapshot.primitivesWidth,
      centerInFullWindow: snapshot.centerInFullWindow,
      mistakenLeftPanelOffset: snapshot.mistakenLeftPanelOffset,
    })
    if (
      toolbarPositionsEqual(transform, expected.transformBarPosition) &&
      toolbarPositionsEqual(primitives, expected.primitivesBarPosition)
    ) {
      return true
    }
  }
  return false
}

/** Move toolbars to the bottom cluster when they still use legacy defaults. */
export function bootstrapToolbarPositions(
  current: Pick<
    ViewportLayoutState,
    | 'transformBarPosition'
    | 'primitivesBarPosition'
    | 'sidePanelWidth'
    | 'showSidePanel'
    | 'showPrimitivesBar'
    | 'showTransformBar'
  >,
  measured?: { primitivesWidth: number; transformWidth: number } | null
): Partial<ViewportLayoutState> | null {
  const isLegacyTopLeft =
    toolbarPositionsEqual(current.transformBarPosition, LEGACY_TOOLBAR_POSITIONS.transform) &&
    toolbarPositionsEqual(current.primitivesBarPosition, LEGACY_TOOLBAR_POSITIONS.primitives)
  const isLegacyVerticalBottom = isLegacyVerticalBottomCluster(
    current.transformBarPosition,
    current.primitivesBarPosition
  )
  const isLegacyHorizontalBottom = isLegacyHorizontalBottomCluster(
    current.transformBarPosition,
    current.primitivesBarPosition,
    current.sidePanelWidth,
    current.showSidePanel
  )
  if (!isLegacyTopLeft && !isLegacyVerticalBottom && !isLegacyHorizontalBottom) return null
  return {
    ...computeBottomToolbarPositions({
      mainAreaWidth: measureViewportAreaWidth() ?? undefined,
      sidePanelWidth: current.sidePanelWidth,
      showSidePanel: current.showSidePanel,
      showPrimitivesBar: current.showPrimitivesBar,
      showTransformBar: current.showTransformBar,
      primitivesWidth: measured?.primitivesWidth,
      transformWidth: measured?.transformWidth,
    }),
    toolbarClusterAutoCenter: true,
  }
}

/** Re-center using measured widths when positions still match the estimated or legacy layout. */
export function refineToolbarClusterCenter(
  current: Pick<
    ViewportLayoutState,
    | 'transformBarPosition'
    | 'primitivesBarPosition'
    | 'sidePanelWidth'
    | 'showSidePanel'
    | 'showPrimitivesBar'
    | 'showTransformBar'
  >,
  measured: { primitivesWidth: number; transformWidth: number }
): Partial<ViewportLayoutState> | null {
  const estimated = computeBottomToolbarPositions({
    sidePanelWidth: current.sidePanelWidth,
    showSidePanel: current.showSidePanel,
    showPrimitivesBar: current.showPrimitivesBar,
    showTransformBar: current.showTransformBar,
  })
  const atEstimated =
    toolbarPositionsEqual(current.transformBarPosition, estimated.transformBarPosition) &&
    toolbarPositionsEqual(current.primitivesBarPosition, estimated.primitivesBarPosition)
  const atLegacyHorizontal = isLegacyHorizontalBottomCluster(
    current.transformBarPosition,
    current.primitivesBarPosition,
    current.sidePanelWidth,
    current.showSidePanel
  )
  if (!atEstimated && !atLegacyHorizontal) return null

  const refined = computeBottomToolbarPositions({
    mainAreaWidth: measureViewportAreaWidth() ?? undefined,
    sidePanelWidth: current.sidePanelWidth,
    showSidePanel: current.showSidePanel,
    showPrimitivesBar: current.showPrimitivesBar,
    showTransformBar: current.showTransformBar,
    primitivesWidth: measured.primitivesWidth,
    transformWidth: measured.transformWidth,
  })
  if (
    toolbarPositionsEqual(current.transformBarPosition, refined.transformBarPosition) &&
    toolbarPositionsEqual(current.primitivesBarPosition, refined.primitivesBarPosition)
  ) {
    return null
  }
  return refined
}

type ToolbarClusterLayoutState = Pick<
  ViewportLayoutState,
  | 'transformBarPosition'
  | 'primitivesBarPosition'
  | 'sidePanelWidth'
  | 'showSidePanel'
  | 'showPrimitivesBar'
  | 'showTransformBar'
  | 'toolbarClusterAutoCenter'
>

function computeToolbarClusterPositions(
  current: ToolbarClusterLayoutState,
  measured?: { primitivesWidth: number; transformWidth: number } | null
): Pick<ViewportLayoutState, 'transformBarPosition' | 'primitivesBarPosition'> {
  return computeBottomToolbarPositions({
    mainAreaWidth: measureViewportAreaWidth() ?? undefined,
    sidePanelWidth: current.sidePanelWidth,
    showSidePanel: current.showSidePanel,
    showPrimitivesBar: current.showPrimitivesBar,
    showTransformBar: current.showTransformBar,
    primitivesWidth: measured?.primitivesWidth,
    transformWidth: measured?.transformWidth,
  })
}

/** Re-center the bottom toolbar cluster when auto-centering is enabled (or forced). */
export function syncBottomToolbarCluster(
  current: ToolbarClusterLayoutState,
  options?: {
    force?: boolean
    measured?: { primitivesWidth: number; transformWidth: number } | null
  }
): Partial<ViewportLayoutState> | null {
  if (!options?.force && !current.toolbarClusterAutoCenter) return null

  const measured = options?.measured ?? measureToolbarClusterWidths()
  const positions = computeToolbarClusterPositions(current, measured)
  if (
    toolbarPositionsEqual(current.transformBarPosition, positions.transformBarPosition) &&
    toolbarPositionsEqual(current.primitivesBarPosition, positions.primitivesBarPosition)
  ) {
    return null
  }
  return {
    ...positions,
    toolbarClusterAutoCenter: true,
  }
}

export interface ViewportFitRequest extends ViewportFitFrame {
  /** Monotonic id so every viewport applies even if center/radius match a prior fit. */
  nonce: number
}

export interface ViewportResetRequest {
  /** Monotonic id so every viewport applies even on repeated resets. */
  nonce: number
}

/** LightWave-style armed viewport navigation (LMB drag in viewport). */
export type ViewportStickyNav = 'pan' | 'orbit' | 'dolly'

export type { ViewportLwToolsLayout } from './viewportLwToolsPersistence'

export interface ViewportLayoutState {
  activeView: ViewType
  /** Slot index (0–3) when quad layout is maximized to one pane. */
  maximizedSlot: ViewportSlotIndex | null
  /** Viewport slot under the pointer (for hover outline + space maximize). */
  hoveredViewportSlot: ViewportSlotIndex | null
  viewportSlotViews: ViewType[]
  viewportColSplit: number
  viewportRowSplit: number
  sidePanelWidth: number
  showSidePanel: boolean
  showGrid: boolean
  viewportDisplayMode: ViewportDisplayMode
  viewportShadowsEnabled: boolean
  viewportXRay: boolean
  viewMoveBasis: ViewMoveBasis | null
  showTransformBar: boolean
  transformBarPosition: FloatingToolbarPosition
  showPrimitivesBar: boolean
  primitivesBarPosition: FloatingToolbarPosition
  /** When true, layout changes re-center the bottom toolbar cluster. Cleared on user drag. */
  toolbarClusterAutoCenter: boolean
  /** When set, each viewport resets orientation and frames this sphere. */
  viewportFitRequest: ViewportFitRequest | null
  /** When set, each viewport resets to its canonical orientation and default zoom. */
  viewportResetRequest: ViewportResetRequest | null
  /** Armed LightWave nav tool — LMB drags use this mode until toggled off or Escape. */
  viewportStickyNav: ViewportStickyNav | null
  /** LightWave viewport gadget cluster placement. */
  viewportLwToolsLayout: ViewportLwToolsLayout
}

export interface ViewportLayoutActions {
  setActiveView: (view: ViewType) => void
  setViewportSlotView: (index: ViewportSlotIndex, view: SelectableViewType) => void
  setHoveredViewportSlot: (index: ViewportSlotIndex | null) => void
  toggleMaximizedView: (slot?: ViewportSlotIndex) => void
  setViewportColSplit: (ratio: number) => void
  setViewportRowSplit: (ratio: number) => void
  setSidePanelWidth: (width: number) => void
  setShowSidePanel: (show: boolean) => void
  setShowGrid: (show: boolean) => void
  setViewportDisplayMode: (mode: ViewportDisplayMode) => void
  setViewportShadowsEnabled: (enabled: boolean) => void
  setViewportXRay: (enabled: boolean) => void
  setViewMoveBasis: (basis: ViewMoveBasis | null) => void
  setShowTransformBar: (show: boolean) => void
  setTransformBarPosition: (position: FloatingToolbarPosition) => void
  setShowPrimitivesBar: (show: boolean) => void
  setPrimitivesBarPosition: (position: FloatingToolbarPosition) => void
  requestViewportFit: (frame: ViewportFitFrame) => void
  requestViewportReset: () => void
  resetViewportQuadLayout: () => void
  setViewportStickyNav: (mode: ViewportStickyNav | null) => void
  setViewportLwToolsLayout: (layout: ViewportLwToolsLayout) => void
}

export type ViewportSlice = ViewportLayoutState & ViewportLayoutActions

/** Blender-like solid X-Ray surface opacity (0–1). */
export const VIEWPORT_XRAY_OPACITY = 0.5

const defaultToolbarPositions = computeBottomToolbarPositions({
  showPrimitivesBar: false,
  showTransformBar: true,
})
const persistedSplits = loadViewportSplits()

/** Perspective slot in the default quad layout (bottom-right). */
const DEFAULT_MAXIMIZED_SLOT = DEFAULT_VIEWPORT_SLOT_VIEWS.findIndex(
  (view) => view === 'perspective'
) as ViewportSlotIndex

export const viewportLayoutInitialState: ViewportLayoutState = {
  activeView: DEFAULT_VIEWPORT_SLOT_VIEWS[DEFAULT_MAXIMIZED_SLOT]!,
  maximizedSlot: DEFAULT_MAXIMIZED_SLOT,
  hoveredViewportSlot: null,
  viewportSlotViews: [...DEFAULT_VIEWPORT_SLOT_VIEWS],
  viewportColSplit: persistedSplits?.col ?? 0.5,
  viewportRowSplit: persistedSplits?.row ?? 0.5,
  sidePanelWidth: defaultSidePanelWidth(),
  showSidePanel: true,
  showGrid: true,
  viewportDisplayMode: 'model',
  viewportShadowsEnabled: true,
  viewportXRay: false,
  viewMoveBasis: null,
  showTransformBar: true,
  transformBarPosition: defaultToolbarPositions.transformBarPosition,
  showPrimitivesBar: false,
  primitivesBarPosition: defaultToolbarPositions.primitivesBarPosition,
  toolbarClusterAutoCenter: true,
  viewportFitRequest: null,
  viewportResetRequest: null,
  viewportStickyNav: null,
  viewportLwToolsLayout: loadViewportLwToolsLayout() ?? 'top-right',
}

export function createViewportSlice<T extends ViewportLayoutState>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
): ViewportLayoutActions {
  return {
    setActiveView: (view) => set({ activeView: view } as Partial<T>),

    setViewportSlotView: (index, view) =>
      set((s) => {
        const viewportSlotViews = [...s.viewportSlotViews] as ViewType[]
        viewportSlotViews[index] = view
        return { viewportSlotViews } as Partial<T>
      }),

    setHoveredViewportSlot: (index) =>
      set((s) =>
        s.hoveredViewportSlot === index ? s : ({ hoveredViewportSlot: index } as Partial<T>)
      ),

    toggleMaximizedView: (slot) =>
      set((s) => {
        const target =
          slot ?? s.hoveredViewportSlot ?? findActiveSlotForView(s.activeView, s.viewportSlotViews)
        if (s.maximizedSlot !== null) {
          const patch = { maximizedSlot: null as ViewportSlotIndex | null } as Partial<T>
          const synced = syncBottomToolbarCluster({ ...s, ...patch })
          return synced ? ({ ...patch, ...synced } as Partial<T>) : patch
        }
        const patch = {
          maximizedSlot: target,
          activeView: s.viewportSlotViews[target]!,
        } as Partial<T>
        const synced = syncBottomToolbarCluster({ ...s, ...patch }, { force: true })
        return synced ? ({ ...patch, ...synced } as Partial<T>) : patch
      }),

    setViewportColSplit: (ratio) =>
      set((s) => {
        const next = Math.min(0.82, Math.max(0.18, ratio))
        if (Math.abs(s.viewportColSplit - next) < 0.0001) return s as T
        saveViewportSplits(next, s.viewportRowSplit)
        return { viewportColSplit: next } as Partial<T>
      }),

    setViewportRowSplit: (ratio) =>
      set((s) => {
        const next = Math.min(0.82, Math.max(0.18, ratio))
        if (Math.abs(s.viewportRowSplit - next) < 0.0001) return s as T
        saveViewportSplits(s.viewportColSplit, next)
        return { viewportRowSplit: next } as Partial<T>
      }),

    resetViewportQuadLayout: () =>
      set((s) => {
        clearViewportSplits()
        const patch = {
          viewportColSplit: 0.5,
          viewportRowSplit: 0.5,
          ...(s.maximizedSlot !== null ? { maximizedSlot: null as ViewportSlotIndex | null } : {}),
        }
        return patch as Partial<T>
      }),

    setSidePanelWidth: (width) =>
      set((s) => {
        const next = Math.min(420, Math.max(200, width))
        if (Math.abs(s.sidePanelWidth - next) < 0.1) return s as T
        const patch = { sidePanelWidth: next } as Partial<T>
        const synced = syncBottomToolbarCluster({ ...s, ...patch })
        return synced ? ({ ...patch, ...synced } as Partial<T>) : patch
      }),

    setShowSidePanel: (show) =>
      set((s) => {
        if (s.showSidePanel === show) return s as T
        const patch = { showSidePanel: show } as Partial<T>
        const synced = syncBottomToolbarCluster({ ...s, ...patch })
        return synced ? ({ ...patch, ...synced } as Partial<T>) : patch
      }),

    setShowGrid: (show) => set({ showGrid: show } as Partial<T>),

    setViewportDisplayMode: (mode) =>
      set(
        (mode === 'normals'
          ? { viewportDisplayMode: mode, selectionMode: 'face' }
          : { viewportDisplayMode: mode }) as Partial<T>
      ),

    setViewportShadowsEnabled: (enabled) =>
      set({ viewportShadowsEnabled: enabled } as Partial<T>),

    setViewportXRay: (enabled) => set({ viewportXRay: enabled } as Partial<T>),

    setShowTransformBar: (show) =>
      set((s) => {
        if (s.showTransformBar === show) return s as T
        const patch = {
          showTransformBar: show,
          toolbarClusterAutoCenter: true,
        } as Partial<T>
        const synced = syncBottomToolbarCluster({ ...s, ...patch }, { force: true })
        return synced ? ({ ...patch, ...synced } as Partial<T>) : patch
      }),

    setTransformBarPosition: (position) =>
      set((s) => {
        const next = { x: Math.max(8, position.x), y: Math.max(8, position.y) }
        if (s.transformBarPosition.x === next.x && s.transformBarPosition.y === next.y) return s as T
        return {
          transformBarPosition: next,
          toolbarClusterAutoCenter: false,
        } as Partial<T>
      }),

    setShowPrimitivesBar: (show) =>
      set((s) => {
        if (s.showPrimitivesBar === show) return s as T
        const patch = {
          showPrimitivesBar: show,
          toolbarClusterAutoCenter: true,
        } as Partial<T>
        const synced = syncBottomToolbarCluster({ ...s, ...patch }, { force: true })
        return synced ? ({ ...patch, ...synced } as Partial<T>) : patch
      }),

    setPrimitivesBarPosition: (position) =>
      set((s) => {
        const next = { x: Math.max(8, position.x), y: Math.max(8, position.y) }
        if (s.primitivesBarPosition.x === next.x && s.primitivesBarPosition.y === next.y) return s as T
        return {
          primitivesBarPosition: next,
          toolbarClusterAutoCenter: false,
        } as Partial<T>
      }),

    setViewMoveBasis: (basis) =>
      set((s) => {
        const prev = s.viewMoveBasis
        if (prev === basis) return s as T
        if (!prev || !basis) return { viewMoveBasis: basis } as Partial<T>
        if (
          prev.right.x === basis.right.x &&
          prev.right.y === basis.right.y &&
          prev.right.z === basis.right.z &&
          prev.up.x === basis.up.x &&
          prev.up.y === basis.up.y &&
          prev.up.z === basis.up.z
        ) {
          return s as T
        }
        return { viewMoveBasis: basis } as Partial<T>
      }),

    requestViewportFit: (frame) =>
      set((s) => {
        const nonce = (s.viewportFitRequest?.nonce ?? 0) + 1
        return {
          viewportFitRequest: {
            nonce,
            center: { ...frame.center },
            radius: frame.radius,
          },
        } as Partial<T>
      }),

    requestViewportReset: () =>
      set((s) => {
        const nonce = (s.viewportResetRequest?.nonce ?? 0) + 1
        return { viewportResetRequest: { nonce } } as Partial<T>
      }),

    setViewportStickyNav: (mode) =>
      set((s) =>
        s.viewportStickyNav === mode ? (s as T) : ({ viewportStickyNav: mode } as Partial<T>)
      ),

    setViewportLwToolsLayout: (layout) =>
      set((s) => {
        if (s.viewportLwToolsLayout === layout) return s as T
        saveViewportLwToolsLayout(layout)
        return { viewportLwToolsLayout: layout } as Partial<T>
      }),
  }
}

function findActiveSlotForView(view: ViewType, slots: ViewType[]): ViewportSlotIndex {
  const index = slots.findIndex((slotView) => slotView === view)
  return (index >= 0 ? index : 0) as ViewportSlotIndex
}

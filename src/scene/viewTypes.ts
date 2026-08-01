export type OrthoViewType = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

/** @deprecated Use `right` — kept for older saved state / call sites. */
export type LegacyViewType = 'side'

export type ViewType = OrthoViewType | 'perspective' | LegacyViewType

export const ORTHO_VIEW_OPTIONS: { id: OrthoViewType; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
]

export type SelectableViewType = OrthoViewType | 'perspective'

export const VIEWPORT_VIEW_OPTIONS: { id: SelectableViewType; label: string }[] = [
  ...ORTHO_VIEW_OPTIONS,
  { id: 'perspective', label: 'Perspective' },
]

export const VIEW_LABELS: Record<OrthoViewType | 'perspective', string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left Side',
  right: 'Right Side',
  top: 'Top',
  bottom: 'Bottom',
  perspective: 'Perspective',
}

export type ViewportSlotIndex = 0 | 1 | 2 | 3

export const DEFAULT_VIEWPORT_SLOT_VIEWS: ViewType[] = [
  'front',
  'right',
  'top',
  'perspective',
]

export function normalizeViewType(view: ViewType): OrthoViewType | 'perspective' {
  if (view === 'side') return 'right'
  return view
}

export function isOrthoView(view: ViewType): view is OrthoViewType {
  return (
    view === 'front' ||
    view === 'back' ||
    view === 'left' ||
    view === 'right' ||
    view === 'top' ||
    view === 'bottom' ||
    view === 'side'
  )
}

export function getViewLabel(view: ViewType): string {
  const normalized = normalizeViewType(view)
  return VIEW_LABELS[normalized]
}

/** Default orthographic zoom (Three.js: lower = wider framing). Legacy was 2 (~1.5× tighter). */
export const DEFAULT_ORTHO_ZOOM = 2 / 1.5

export function getOrthoCameraSetup(view: OrthoViewType): {
  position: [number, number, number]
  up: [number, number, number]
  zoom: number
} {
  switch (view) {
    case 'front':
      return { position: [0, 0, 200], up: [0, 1, 0], zoom: DEFAULT_ORTHO_ZOOM }
    case 'back':
      return { position: [0, 0, -200], up: [0, 1, 0], zoom: DEFAULT_ORTHO_ZOOM }
    case 'right':
      return { position: [200, 0, 0], up: [0, 1, 0], zoom: DEFAULT_ORTHO_ZOOM }
    case 'left':
      return { position: [-200, 0, 0], up: [0, 1, 0], zoom: DEFAULT_ORTHO_ZOOM }
    case 'top':
      return { position: [0, 200, 0], up: [0, 0, -1], zoom: DEFAULT_ORTHO_ZOOM }
    case 'bottom':
      return { position: [0, -200, 0], up: [0, 0, 1], zoom: DEFAULT_ORTHO_ZOOM }
  }
}

export function getCameraSetup(view: ViewType): {
  position: [number, number, number]
  up: [number, number, number]
  zoom: number
  orthographic: boolean
} {
  if (view === 'perspective') {
    return {
      position: [120, 100, 120],
      up: [0, 1, 0],
      zoom: 1,
      orthographic: false,
    }
  }
  const ortho = getOrthoCameraSetup(normalizeViewType(view) as OrthoViewType)
  return { ...ortho, orthographic: true }
}

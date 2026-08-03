/**
 * Side panel preferences that belong to the person, not the document: how big
 * the controls are and which sections they keep folded away. Persisted outside
 * the scene store so they survive new/opened projects.
 */

const STORAGE_KEY = 'quadlo-side-panel-prefs'

export type PanelDensity = 'compact' | 'cozy' | 'large'

export const PANEL_DENSITIES: readonly {
  id: PanelDensity
  label: string
  title: string
}[] = [
  { id: 'compact', label: 'Compact', title: 'Smallest controls — most tools on screen at once' },
  { id: 'cozy', label: 'Cozy', title: 'Balanced sizing for mouse and trackpad' },
  { id: 'large', label: 'Large', title: 'Big targets for stylus, pen and touch' },
]

export interface SidePanelPrefs {
  density: PanelDensity
  /** Section ids the user has folded away. Anything absent is expanded. */
  collapsedSections: readonly string[]
}

function isDensity(value: unknown): value is PanelDensity {
  return value === 'compact' || value === 'cozy' || value === 'large'
}

/** Pen and touch users start at the largest targets unless they say otherwise. */
export function defaultPanelDensity(): PanelDensity {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'cozy'
  try {
    return window.matchMedia('(pointer: coarse)').matches ? 'large' : 'cozy'
  } catch {
    return 'cozy'
  }
}

export function defaultSidePanelPrefs(): SidePanelPrefs {
  return { density: defaultPanelDensity(), collapsedSections: [] }
}

export function loadSidePanelPrefs(): SidePanelPrefs {
  const fallback = defaultSidePanelPrefs()
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<SidePanelPrefs>
    return {
      density: isDensity(parsed.density) ? parsed.density : fallback.density,
      collapsedSections: Array.isArray(parsed.collapsedSections)
        ? parsed.collapsedSections.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return fallback
  }
}

export function saveSidePanelPrefs(prefs: SidePanelPrefs): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota / privacy mode */
  }
}

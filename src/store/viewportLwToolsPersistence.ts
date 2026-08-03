const STORAGE_KEY = 'quadlo-viewport-lw-tools-layout'

export type ViewportLwToolsLayout = 'top-right' | 'right-middle'

export function loadViewportLwToolsLayout(): ViewportLwToolsLayout | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'top-right' || raw === 'right-middle') return raw
    return null
  } catch {
    return null
  }
}

export function saveViewportLwToolsLayout(layout: ViewportLwToolsLayout): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, layout)
  } catch {
    /* ignore quota / privacy mode */
  }
}

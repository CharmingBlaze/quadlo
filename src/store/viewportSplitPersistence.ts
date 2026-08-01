const STORAGE_KEY = 'quadlo-viewport-splits'

export interface ViewportSplitRatios {
  col: number
  row: number
}

export function loadViewportSplits(): ViewportSplitRatios | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ViewportSplitRatios>
    if (typeof parsed.col !== 'number' || typeof parsed.row !== 'number') return null
    if (!Number.isFinite(parsed.col) || !Number.isFinite(parsed.row)) return null
    return {
      col: Math.min(0.82, Math.max(0.18, parsed.col)),
      row: Math.min(0.82, Math.max(0.18, parsed.row)),
    }
  } catch {
    return null
  }
}

export function saveViewportSplits(col: number, row: number): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ col, row }))
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearViewportSplits(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

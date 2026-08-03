import { useCallback, useMemo, useRef, useState } from 'react'
import {
  loadSidePanelPrefs,
  saveSidePanelPrefs,
  type PanelDensity,
  type SidePanelPrefs,
} from './sidePanelPrefs'

export interface SidePanelPrefsApi {
  density: PanelDensity
  setDensity: (density: PanelDensity) => void
  isCollapsed: (sectionId: string) => boolean
  toggleSection: (sectionId: string) => void
  /** Force a section open — used when search jumps the user to it. */
  expandSection: (sectionId: string) => void
  expandAll: () => void
  collapseAll: (sectionIds: readonly string[]) => void
  collapsedCount: number
}

/**
 * Owns panel density and per-section collapse state for the whole panel.
 *
 * Collapse state has to live above the sections themselves: tab switches
 * unmount every section, and folding a section shut only to have it spring
 * back open on the next visit is the kind of small betrayal that makes a panel
 * feel unreliable.
 */
export function useSidePanelPrefs(): SidePanelPrefsApi {
  const [prefs, setPrefs] = useState<SidePanelPrefs>(loadSidePanelPrefs)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  const update = useCallback((next: SidePanelPrefs) => {
    prefsRef.current = next
    setPrefs(next)
    saveSidePanelPrefs(next)
  }, [])

  const collapsed = useMemo(
    () => new Set(prefs.collapsedSections),
    [prefs.collapsedSections]
  )

  const setDensity = useCallback(
    (density: PanelDensity) => {
      if (prefsRef.current.density === density) return
      update({ ...prefsRef.current, density })
    },
    [update]
  )

  const toggleSection = useCallback(
    (sectionId: string) => {
      const current = prefsRef.current.collapsedSections
      const next = current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
      update({ ...prefsRef.current, collapsedSections: next })
    },
    [update]
  )

  const expandSection = useCallback(
    (sectionId: string) => {
      const current = prefsRef.current.collapsedSections
      if (!current.includes(sectionId)) return
      update({
        ...prefsRef.current,
        collapsedSections: current.filter((id) => id !== sectionId),
      })
    },
    [update]
  )

  const expandAll = useCallback(() => {
    if (prefsRef.current.collapsedSections.length === 0) return
    update({ ...prefsRef.current, collapsedSections: [] })
  }, [update])

  const collapseAll = useCallback(
    (sectionIds: readonly string[]) => {
      const merged = new Set([...prefsRef.current.collapsedSections, ...sectionIds])
      update({ ...prefsRef.current, collapsedSections: [...merged] })
    },
    [update]
  )

  return {
    density: prefs.density,
    setDensity,
    isCollapsed: useCallback((sectionId: string) => collapsed.has(sectionId), [collapsed]),
    toggleSection,
    expandSection,
    expandAll,
    collapseAll,
    collapsedCount: prefs.collapsedSections.length,
  }
}

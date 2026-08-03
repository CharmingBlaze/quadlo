import {
  DEFAULT_THEME_ID,
  PREVIOUS_DEFAULT_THEME_ID,
  isThemeId,
  type ThemeId,
} from './themes'

const THEME_STORAGE_KEY = 'lpo-theme'
/** One-time bump: force Painter default so the Substance look is visible after theme work. */
const THEME_MIGRATE_KEY = 'lpo-theme-migrate-painter-v1'
/** One-time move onto the Quadlo palette — only for people still on the old default. */
const THEME_MIGRATE_QUADLO_KEY = 'lpo-theme-migrate-quadlo-v1'

export function readStoredThemeId(): ThemeId {
  try {
    if (!localStorage.getItem(THEME_MIGRATE_KEY)) {
      localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID)
      localStorage.setItem(THEME_MIGRATE_KEY, '1')
      localStorage.setItem(THEME_MIGRATE_QUADLO_KEY, '1')
      return DEFAULT_THEME_ID
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY)

    // Move existing installs onto the new default once, but only if they never
    // chose a theme themselves — a deliberate pick outranks our redesign.
    if (!localStorage.getItem(THEME_MIGRATE_QUADLO_KEY)) {
      localStorage.setItem(THEME_MIGRATE_QUADLO_KEY, '1')
      if (!stored || stored === PREVIOUS_DEFAULT_THEME_ID) {
        localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID)
        return DEFAULT_THEME_ID
      }
    }

    if (stored && isThemeId(stored)) return stored
  } catch {
    /* ignore */
  }
  // Fresh installs and cleared storage start on the Quadlo palette.
  return DEFAULT_THEME_ID
}

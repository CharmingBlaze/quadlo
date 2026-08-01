import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from './themes'

const THEME_STORAGE_KEY = 'lpo-theme'
/** One-time bump: force Painter default so the Substance look is visible after theme work. */
const THEME_MIGRATE_KEY = 'lpo-theme-migrate-painter-v1'

export function readStoredThemeId(): ThemeId {
  try {
    if (!localStorage.getItem(THEME_MIGRATE_KEY)) {
      localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID)
      localStorage.setItem(THEME_MIGRATE_KEY, '1')
      return DEFAULT_THEME_ID
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && isThemeId(stored)) return stored
  } catch {
    /* ignore */
  }
  // Fresh installs and cleared storage always start on Painter (Substance-like).
  return DEFAULT_THEME_ID
}

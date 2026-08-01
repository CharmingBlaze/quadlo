import { isLightHex } from './colorUtils'
import { getTheme, getThemeProfile, type ThemeId } from './themes'

export function applyTheme(themeId: ThemeId): void {
  const root = document.documentElement
  const theme = getTheme(themeId)
  const { css } = theme
  for (const [key, value] of Object.entries(css)) {
    if (value != null) root.style.setProperty(key, value)
  }
  root.dataset.theme = themeId
  root.dataset.themeProfile = getThemeProfile(themeId, theme.group)
  // Drive contrast-aware chrome: light panels get dark text, dark panels get light text.
  const light = isLightHex(css['--bg-panel'])
  root.dataset.themeContrast = light ? 'light' : 'dark'
  // Match OS overlay scrollbars + form controls to theme brightness.
  root.style.colorScheme = light ? 'light' : 'dark'
}

import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { darkenHex, lightenHex } from './colorUtils'
import { getTheme, hexToNumber, type ThemeCssVars } from './themes'

export interface ThemeColors {
  css: ThemeCssVars
  accent: string
  accentNum: number
  accentGreen: string
  accentGreenNum: number
  accentOrange: string
  accentOrangeNum: number
  accentPink: string
  accentPinkNum: number
  danger: string
  dangerNum: number
  text: string
  textMuted: string
  bgPanel: string
  bgDark: string
  meshOutline: string
  meshOutlineSecondary: string
  meshSelected: string
  meshHover: string
  /** Edit/draw vertex handles — derived from theme mesh/accent colors, slightly darkened. */
  vertexIdle: string
  vertexIdleBorder: string
  vertexHover: string
  vertexHoverBorder: string
  vertexSelected: string
  vertexSelectedBorder: string
  vertexDraft: string
  vertexDraftHover: string
  /** Object selection outline — primary / multi-select secondary. */
  objectSelectOutline: string
  objectSelectOutlineSecondary: string
  /** Edge selection overlay (idle / hover / selected). */
  edgeIdle: string
  edgeHover: string
  edgeSelected: string
  /** Face selection overlay fill and boundary wire. */
  faceIdleFill: string
  faceIdleWire: string
  faceHoverFill: string
  faceHoverWire: string
  faceSelectedFill: string
  faceSelectedWire: string
  symmetryPlane: string
  gridCell: string
  gridSection: string
  uvCanvasBg: string
  uvGridA: string
  uvGridB: string
  /** Viewport axis line colors (X/Y/Z). */
  axisX: string
  axisY: string
  axisZ: string
}

export function useTheme(): ThemeColors {
  const themeId = useAppStore((s) => s.themeId)
  return useMemo(() => {
    const css = getTheme(themeId).css
    return {
      css,
      accent: css['--accent'],
      accentNum: hexToNumber(css['--accent']),
      accentGreen: css['--accent-green'],
      accentGreenNum: hexToNumber(css['--accent-green']),
      accentOrange: css['--accent-orange'],
      accentOrangeNum: hexToNumber(css['--accent-orange']),
      accentPink: css['--accent-pink'],
      accentPinkNum: hexToNumber(css['--accent-pink']),
      danger: css['--danger'],
      dangerNum: hexToNumber(css['--danger']),
      text: css['--text'],
      textMuted: css['--text-muted'],
      bgPanel: css['--bg-panel'],
      bgDark: css['--bg-dark'],
      meshOutline: css['--mesh-outline'],
      meshOutlineSecondary: css['--mesh-outline-secondary'],
      meshSelected: css['--mesh-selected'],
      meshHover: css['--mesh-hover'],
      vertexIdle: darkenHex(css['--mesh-outline-secondary'], 0.18),
      vertexIdleBorder: darkenHex(css['--mesh-outline'], 0.26),
      vertexHover: lightenHex(css['--mesh-hover'], 0.12),
      vertexHoverBorder: lightenHex(css['--mesh-hover'], 0.22),
      // Selected verts use full theme selection color + a brighter rim so they pop on every theme.
      vertexSelected: lightenHex(css['--mesh-selected'], 0.16),
      vertexSelectedBorder: lightenHex(css['--mesh-selected'], 0.32),
      vertexDraft: lightenHex(css['--accent'], 0.1),
      vertexDraftHover: lightenHex(css['--mesh-hover'], 0.14),
      // Object AABB outline — may diverge from component --mesh-selected (e.g. Painter amber box, blue verts).
      objectSelectOutline: css['--mesh-object-selected'] ?? css['--mesh-selected'],
      objectSelectOutlineSecondary: darkenHex(
        css['--mesh-object-selected'] ?? css['--mesh-selected'],
        0.28
      ),
      edgeIdle: darkenHex(css['--mesh-outline-secondary'], 0.28),
      edgeHover: lightenHex(css['--mesh-hover'], 0.04),
      edgeSelected: lightenHex(css['--mesh-selected'], 0.1),
      faceIdleFill: darkenHex(css['--mesh-outline-secondary'], 0.38),
      faceIdleWire: darkenHex(css['--mesh-outline'], 0.3),
      faceHoverFill: darkenHex(css['--mesh-hover'], 0.26),
      faceHoverWire: lightenHex(css['--mesh-hover'], 0.06),
      faceSelectedFill: darkenHex(css['--mesh-selected'], 0.22),
      faceSelectedWire: lightenHex(css['--mesh-selected'], 0.12),
      symmetryPlane: css['--symmetry-plane'],
      gridCell: css['--grid-cell'],
      gridSection: css['--grid-section'],
      uvCanvasBg: css['--uv-canvas-bg'],
      uvGridA: css['--uv-grid-a'],
      uvGridB: css['--uv-grid-b'],
      axisX: css['--accent-pink'],
      axisY: css['--accent-green'],
      axisZ: css['--accent'],
    }
  }, [themeId])
}

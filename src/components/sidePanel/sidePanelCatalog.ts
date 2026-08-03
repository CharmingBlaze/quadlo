/**
 * Declarative map of everything the right side panel contains.
 *
 * The panel body is built from hand-written JSX, so this catalog is what gives
 * the panel a machine-readable table of contents: it powers the search box, the
 * per-section icons, and the persisted collapse state keys. Adding a section to
 * the panel means adding it here too, otherwise it is unsearchable.
 */

export type SidePanelTabId = 'create' | 'edit' | 'look' | 'scene'
export type EditSubTabId = 'select-transform' | 'mesh'

export type SectionIconId =
  | 'shapes'
  | 'stroke'
  | 'mesh'
  | 'options'
  | 'tool'
  | 'select'
  | 'transform'
  | 'gizmo'
  | 'symmetry'
  | 'geometry'
  | 'topology'
  | 'object'
  | 'appearance'
  | 'display'
  | 'image'
  | 'workspace'
  | 'theme'

export interface SidePanelSectionMeta {
  id: string
  title: string
  tab: SidePanelTabId
  subTab?: EditSubTabId
  icon: SectionIconId
  /** One-line explanation shown in search results and as the header tooltip. */
  blurb: string
  /** Extra search terms — the names of the controls the section contains. */
  keywords: readonly string[]
}

export const SIDE_PANEL_SECTIONS: readonly SidePanelSectionMeta[] = [
  {
    id: 'shape-tools',
    title: 'Shape tools',
    tab: 'create',
    icon: 'shapes',
    blurb: 'Primitives and vector shapes',
    keywords: [
      'primitive', 'box', 'cube', 'sphere', 'cylinder', 'cone', 'torus', 'plane',
      'capsule', 'pyramid', 'wedge', 'tube', 'vector', 'shape', 'cad', 'circle',
      'rectangle', 'star', 'polygon',
    ],
  },
  {
    id: 'strokes-drawing',
    title: 'Strokes & drawing',
    tab: 'create',
    icon: 'stroke',
    blurb: 'Sketch, pen, hair, ribbons, sweeps, extrude and lathe',
    keywords: [
      'sketch', 'draw', 'pen', 'outline', 'path', 'blob', 'capsule', 'hair',
      'hair paths', 'hair strips', 'rounded hair', 'ribbon', 'tapered tube',
      'sweep', 'stroke', 'centerline', 'curve',
      'extrude', 'lathe', 'revolve', 'spin', 'solidify', 'thickness',
    ],
  },
  {
    id: 'mesh-tools',
    title: 'Mesh tools',
    tab: 'create',
    icon: 'mesh',
    blurb: 'Poly draw, select and push/pull',
    keywords: [
      'select', 'line', 'rectangle', 'polygon', 'ngon', 'push', 'pull',
      'pushpull', 'double sided', 'poly draw', 'face', 'quad',
    ],
  },
  {
    id: 'drawing-options',
    title: 'Drawing options',
    tab: 'create',
    icon: 'options',
    blurb: 'Snapping and smoothing while you draw',
    keywords: [
      'auto connect', 'smooth draw', 'single sided', 'double sided',
      'snap to vertex', 'snap to edge', 'snap to grid', 'snapping',
    ],
  },
  {
    id: 'active-stroke',
    title: 'Active tool · Stroke',
    tab: 'create',
    icon: 'tool',
    blurb: 'Settings for the current stroke tool',
    keywords: ['stroke settings', 'width', 'depth', 'segments', 'taper', 'tip'],
  },
  {
    id: 'active-primitive',
    title: 'Active tool · Primitive',
    tab: 'create',
    icon: 'tool',
    blurb: 'Settings for the current primitive',
    keywords: ['primitive settings', 'segments', 'radius', 'height', 'source'],
  },
  {
    id: 'active-vector',
    title: 'Active tool · Vector',
    tab: 'create',
    icon: 'tool',
    blurb: 'Settings for the vector pen and shapes',
    keywords: ['vector settings', 'placement', 'bezier', 'handle', 'anchor'],
  },
  {
    id: 'active-sculpt',
    title: 'Active tool · Sculpt',
    tab: 'create',
    icon: 'tool',
    blurb: 'Brush size and strength for sculpting',
    keywords: [
      'sculpt', 'brush', 'strength', 'radius', 'inflate', 'deflate', 'relax',
      'smooth', 'pinch', 'push', 'pull',
    ],
  },

  {
    id: 'selection',
    title: 'Selection',
    tab: 'edit',
    subTab: 'select-transform',
    icon: 'select',
    blurb: 'Selection mode, filters and x-ray',
    keywords: [
      'object', 'vertex', 'edge', 'face', 'x-ray', 'xray', 'select all',
      'invert', 'deselect', 'grow', 'shrink', 'loop', 'ring',
    ],
  },
  {
    id: 'transform',
    title: 'Transform',
    tab: 'edit',
    subTab: 'select-transform',
    icon: 'transform',
    blurb: 'Move, rotate, scale and snapping',
    keywords: ['move', 'rotate', 'scale', 'translate', 'snap', 'increment', 'pivot'],
  },
  {
    id: 'gizmo',
    title: 'Gizmo',
    tab: 'edit',
    subTab: 'select-transform',
    icon: 'gizmo',
    blurb: 'Gizmo space, size and behaviour',
    keywords: ['gizmo', 'handle', 'axis', 'local', 'world', 'pivot', 'origin', 'size'],
  },
  {
    id: 'symmetry',
    title: 'Symmetry',
    tab: 'edit',
    subTab: 'mesh',
    icon: 'symmetry',
    blurb: 'Mirror edits across an axis',
    keywords: ['mirror', 'symmetry', 'axis', 'x', 'y', 'z', 'topology mirror'],
  },
  {
    id: 'geometry',
    title: 'Geometry',
    tab: 'edit',
    subTab: 'mesh',
    icon: 'geometry',
    blurb: 'Normals, welding and cleanup',
    keywords: [
      'normals', 'flip', 'recalculate', 'weld', 'merge', 'cleanup', 'doubles',
      'degenerate', 'triangulate',
    ],
  },
  {
    id: 'topology-tools',
    title: 'Topology Tools',
    tab: 'edit',
    subTab: 'mesh',
    icon: 'topology',
    blurb: 'Knife, loop cut, inset, extrude and bevel',
    keywords: [
      'knife', 'mirror knife', 'loop cut', 'bevel', 'chamfer', 'subdivide',
      'inset', 'bridge', 'extrude', 'face extrude', 'push pull faces', 'e',
      'simplify', 'decimate', 'remesh',
    ],
  },
  {
    id: 'object',
    title: 'Object',
    tab: 'edit',
    subTab: 'mesh',
    icon: 'object',
    blurb: 'Shading, duplication and poly budget',
    keywords: [
      'smooth shading', 'flat', 'duplicate', 'copy', 'paste', 'delete',
      'poly budget', 'lock topology', 'rename',
    ],
  },

  {
    id: 'appearance',
    title: 'Appearance',
    tab: 'look',
    icon: 'appearance',
    blurb: 'Object colour, palette and materials',
    keywords: ['color', 'colour', 'palette', 'swatch', 'material', 'texture', 'tint'],
  },
  {
    id: 'display',
    title: 'Display',
    tab: 'look',
    icon: 'display',
    blurb: 'Shading mode, grid, shadows and wireframe',
    keywords: [
      'shaded', 'wireframe', 'flat', 'grid', 'shadow', 'lighting', 'preview',
      'display mode', 'render',
    ],
  },
  {
    id: 'references',
    title: 'References & images',
    tab: 'look',
    icon: 'image',
    blurb: 'Backdrops and blueprint images',
    keywords: ['reference', 'backdrop', 'blueprint', 'image', 'import', 'opacity', 'plane'],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    tab: 'look',
    icon: 'workspace',
    blurb: 'Toolbars, panel density and layout',
    keywords: [
      'toolbar', 'transform bar', 'primitives bar', 'density', 'compact',
      'comfortable', 'large', 'stylus', 'touch', 'panel size', 'layout',
    ],
  },
  {
    id: 'theme',
    title: 'Theme',
    tab: 'look',
    icon: 'theme',
    blurb: 'Colour theme for the whole app',
    keywords: ['theme', 'dark', 'light', 'colour scheme', 'skin', 'accent'],
  },
]

const SECTIONS_BY_ID = new Map(SIDE_PANEL_SECTIONS.map((s) => [s.id, s]))

export function sidePanelSection(id: string): SidePanelSectionMeta | undefined {
  return SECTIONS_BY_ID.get(id)
}

export const SIDE_PANEL_TAB_LABELS: Record<SidePanelTabId, string> = {
  create: 'Create',
  edit: 'Edit',
  look: 'Look',
  scene: 'Scene',
}

export interface SidePanelSearchHit {
  section: SidePanelSectionMeta
  /** The keyword that matched, when the match came from a keyword rather than the title. */
  matchedTerm: string | null
  score: number
}

function matchScore(haystack: string, needle: string): number | null {
  const index = haystack.indexOf(needle)
  if (index < 0) return null
  if (index === 0) return haystack.length === needle.length ? 0 : 1
  // Word-boundary matches rank above matches buried mid-word.
  return haystack[index - 1] === ' ' ? 2 : 3
}

/** Rank sections against a free-text query. Empty queries return nothing. */
export function searchSidePanel(query: string, limit = 8): SidePanelSearchHit[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []

  const hits: SidePanelSearchHit[] = []
  for (const section of SIDE_PANEL_SECTIONS) {
    let best: { score: number; term: string | null } | null = null

    const titleScore = matchScore(section.title.toLowerCase(), needle)
    if (titleScore !== null) best = { score: titleScore, term: null }

    for (const keyword of section.keywords) {
      const score = matchScore(keyword, needle)
      if (score === null) continue
      // Keywords rank below titles so "Transform" beats a tool that mentions it.
      const weighted = score + 4
      if (!best || weighted < best.score) best = { score: weighted, term: keyword }
    }

    if (!best && matchScore(section.blurb.toLowerCase(), needle) !== null) {
      best = { score: 12, term: null }
    }

    if (best) hits.push({ section, matchedTerm: best.term, score: best.score })
  }

  hits.sort((a, b) => a.score - b.score || a.section.title.localeCompare(b.section.title))
  return hits.slice(0, limit)
}

/** Human-readable trail shown under a search hit, e.g. "Edit › Mesh". */
export function sectionBreadcrumb(section: SidePanelSectionMeta): string {
  const tab = SIDE_PANEL_TAB_LABELS[section.tab]
  if (section.subTab === 'select-transform') return `${tab} › Select & Transform`
  if (section.subTab === 'mesh') return `${tab} › Mesh`
  return tab
}

import type { FaceGroup } from '../../mesh/faceGroups'

/** Below this many visible pixels an island counts as off-screen for auto-fit. */
export const AUTO_FIT_MIN_VISIBLE_PX = 8

export function isBboxVisibleInViewport(
  box: { minX: number; minY: number; maxX: number; maxY: number },
  cw: number,
  ch: number,
  panX: number,
  panY: number,
  zoom: number,
  minVisiblePx = AUTO_FIT_MIN_VISIBLE_PX
): boolean {
  const sx0 = panX + box.minX * zoom
  const sy0 = panY + box.minY * zoom
  const sx1 = panX + box.maxX * zoom
  const sy1 = panY + box.maxY * zoom
  const ix0 = Math.max(0, sx0)
  const iy0 = Math.max(0, sy0)
  const ix1 = Math.min(cw, sx1)
  const iy1 = Math.min(ch, sy1)
  return ix1 - ix0 >= minVisiblePx && iy1 - iy0 >= minVisiblePx
}

let checkerPattern: CanvasPattern | null = null
let checkerPatternColors = ''

export function drawChecker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gridA: string,
  gridB: string
): void {
  const colorKey = `${gridA}-${gridB}`
  if (!checkerPattern || checkerPatternColors !== colorKey) {
    const offscreen = document.createElement('canvas')
    offscreen.width = 32
    offscreen.height = 32
    const octx = offscreen.getContext('2d')
    if (octx) {
      octx.fillStyle = gridA
      octx.fillRect(0, 0, 32, 32)
      octx.fillStyle = gridB
      octx.fillRect(0, 0, 16, 16)
      octx.fillRect(16, 16, 16, 16)
      checkerPattern = ctx.createPattern(offscreen, 'repeat')
      checkerPatternColors = colorKey
    }
  }

  if (checkerPattern) {
    ctx.fillStyle = checkerPattern
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.fillStyle = gridA
    ctx.fillRect(0, 0, w, h)
  }
}

export function pointInPolygon(
  px: number,
  py: number,
  poly: { x: number; y: number }[]
): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x
    const yi = poly[i]!.y
    const xj = poly[j]!.x
    const yj = poly[j]!.y
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function resolveUvRegionState(
  group: FaceGroup,
  selectedFaceSet: Set<number>,
  hoverGroupId: number | null
): 'idle' | 'hover' | 'selected' {
  if (group.faceIndices.some((fi) => selectedFaceSet.has(fi))) return 'selected'
  if (hoverGroupId !== null && hoverGroupId === group.id) return 'hover'
  return 'idle'
}

/** Edge-of-viewport pointer toward a selection that scrolled out of view. */
export function drawNavigatorArrow(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  panX: number,
  panY: number,
  zoom: number,
  box: { cx: number; cy: number } | null,
  fillColor: string,
  strokeColor: string
): void {
  if (!box) return
  const scx = panX + box.cx * zoom
  const scy = panY + box.cy * zoom
  if (scx >= 12 && scx <= cw - 12 && scy >= 12 && scy <= ch - 12) return

  const vcx = cw / 2
  const vcy = ch / 2
  const dx = scx - vcx
  const dy = scy - vcy
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return

  let t = Infinity
  if (dx > 1) t = Math.min(t, (cw - 20 - vcx) / dx)
  if (dx < -1) t = Math.min(t, (20 - vcx) / dx)
  if (dy > 1) t = Math.min(t, (ch - 20 - vcy) / dy)
  if (dy < -1) t = Math.min(t, (20 - vcy) / dy)
  if (!Number.isFinite(t) || t <= 0) return

  const ex = vcx + dx * t
  const ey = vcy + dy * t
  const angle = Math.atan2(scy - ey, scx - ex)
  const size = 10

  ctx.save()
  ctx.fillStyle = fillColor
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(ex + Math.cos(angle) * size, ey + Math.sin(angle) * size)
  ctx.lineTo(ex + Math.cos(angle + 2.4) * size * 0.65, ey + Math.sin(angle + 2.4) * size * 0.65)
  ctx.lineTo(ex + Math.cos(angle - 2.4) * size * 0.65, ey + Math.sin(angle - 2.4) * size * 0.65)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

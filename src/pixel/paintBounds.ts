import type { PixelDirtyRect } from './pixelDirtyRect'

/** Running texel extent of a stroke, in inclusive min/max form. */
export type PaintBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function growPaintBounds(
  bounds: PaintBounds | null,
  points: readonly { x: number; y: number }[]
): PaintBounds | null {
  let out = bounds
  for (const p of points) {
    const x = Math.floor(p.x)
    const y = Math.floor(p.y)
    if (!out) {
      out = { minX: x, minY: y, maxX: x, maxY: y }
      continue
    }
    if (x < out.minX) out.minX = x
    if (y < out.minY) out.minY = y
    if (x > out.maxX) out.maxX = x
    if (y > out.maxY) out.maxY = y
  }
  return out
}

/** Convert to a dirty rect, padded by the brush radius the stroke used. */
export function paintBoundsToRect(
  bounds: PaintBounds | null,
  brushSize: number
): PixelDirtyRect | null {
  if (!bounds) return null
  const pad = Math.ceil(Math.max(1, brushSize) / 2) + 1
  return {
    x: bounds.minX - pad,
    y: bounds.minY - pad,
    w: bounds.maxX - bounds.minX + 1 + pad * 2,
    h: bounds.maxY - bounds.minY + 1 + pad * 2,
  }
}

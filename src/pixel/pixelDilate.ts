/**
 * UV seam bleed (texture padding).
 *
 * A UV island stops at a hard edge in the texture. When the GPU samples with
 * bilinear filtering or drops to a lower mip, texels just outside the island
 * get mixed in — and those are transparent, so the island edge darkens into a
 * visible seam on the model. Painting outward from the island edge into the
 * empty margin gives the filter something matching to blend with.
 */

import { clampDirtyRect, type PixelDirtyRect } from './pixelDirtyRect'

/** Enough padding for bilinear sampling plus a couple of mip levels. */
export const DEFAULT_SEAM_BLEED_PASSES = 4

/** Below this alpha a texel counts as empty and may be filled by bleed. */
const OPAQUE_THRESHOLD = 8

/**
 * Grow opaque texels outward by `passes` pixels, in place.
 *
 * Each pass fills empty texels that touch a filled one with the average colour
 * of those neighbours at full alpha. Only texels that were already empty are
 * written, so existing artwork is never modified.
 *
 * Pass `rect` to limit work to a stroke's bounds; it is expanded by `passes`
 * internally so bleed can travel outward from edges inside the rect.
 *
 * Returns the region actually touched, or null when nothing changed.
 */
export function bleedTransparentEdges(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  passes = DEFAULT_SEAM_BLEED_PASSES,
  rect?: PixelDirtyRect | null
): PixelDirtyRect | null {
  if (width <= 0 || height <= 0 || passes <= 0) return null

  const area = rect
    ? clampDirtyRect(
        {
          x: rect.x - passes,
          y: rect.y - passes,
          w: rect.w + passes * 2,
          h: rect.h + passes * 2,
        },
        width,
        height
      )
    : { x: 0, y: 0, w: width, h: height }
  if (!area) return null

  const x0 = area.x
  const y0 = area.y
  const x1 = area.x + area.w
  const y1 = area.y + area.h

  let touchedMinX = Infinity
  let touchedMinY = Infinity
  let touchedMaxX = -Infinity
  let touchedMaxY = -Infinity

  // Filled state is snapshotted per pass so bleed advances exactly one pixel
  // per pass instead of racing ahead within a single scan.
  let filled = new Uint8Array(area.w * area.h)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3]!
      filled[(y - y0) * area.w + (x - x0)] = alpha >= OPAQUE_THRESHOLD ? 1 : 0
    }
  }

  for (let pass = 0; pass < passes; pass++) {
    const next = new Uint8Array(filled)
    let wroteAny = false

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const local = (y - y0) * area.w + (x - x0)
        if (filled[local]) continue

        let r = 0
        let g = 0
        let b = 0
        let count = 0

        for (let oy = -1; oy <= 1; oy++) {
          const ny = y + oy
          if (ny < y0 || ny >= y1) continue
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue
            const nx = x + ox
            if (nx < x0 || nx >= x1) continue
            if (!filled[(ny - y0) * area.w + (nx - x0)]) continue
            const ni = (ny * width + nx) * 4
            r += pixels[ni]!
            g += pixels[ni + 1]!
            b += pixels[ni + 2]!
            count++
          }
        }

        if (count === 0) continue

        const i = (y * width + x) * 4
        pixels[i] = Math.round(r / count)
        pixels[i + 1] = Math.round(g / count)
        pixels[i + 2] = Math.round(b / count)
        pixels[i + 3] = 255
        next[local] = 1
        wroteAny = true

        if (x < touchedMinX) touchedMinX = x
        if (y < touchedMinY) touchedMinY = y
        if (x > touchedMaxX) touchedMaxX = x
        if (y > touchedMaxY) touchedMaxY = y
      }
    }

    if (!wroteAny) break
    filled = next
  }

  if (touchedMaxX < touchedMinX) return null
  return {
    x: touchedMinX,
    y: touchedMinY,
    w: touchedMaxX - touchedMinX + 1,
    h: touchedMaxY - touchedMinY + 1,
  }
}

import { describe, expect, it } from 'vitest'
import {
  beginSoftBrushStroke,
  paintSoftBrushDab,
  pressureAdjustedParams,
  resetSoftBrushStroke,
  type SoftBrushParams,
} from './softBrush'

const BASE: SoftBrushParams = {
  size: 10,
  hardness: 1,
  opacity: 1,
  flow: 1,
  shape: 'round',
}

function alphaAt(pixels: Uint8ClampedArray, w: number, x: number, y: number): number {
  return pixels[(y * w + x) * 4 + 3]!
}

function filledCount(pixels: Uint8ClampedArray): number {
  let n = 0
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 0) n++
  return n
}

describe('pressureAdjustedParams', () => {
  it('leaves params untouched when no pressure axis is enabled', () => {
    expect(pressureAdjustedParams(BASE, 0.5)).toBe(BASE)
  })

  it('ignores an absent pressure reading so mouse input paints at full size', () => {
    const params = { ...BASE, pressureSize: true }
    expect(pressureAdjustedParams(params, undefined)).toBe(params)
  })

  it('scales size and opacity independently', () => {
    const sized = pressureAdjustedParams({ ...BASE, pressureSize: true }, 0.5)
    expect(sized.size).toBeLessThan(BASE.size)
    expect(sized.opacity).toBe(BASE.opacity)

    const faded = pressureAdjustedParams({ ...BASE, pressureOpacity: true }, 0.5)
    expect(faded.opacity).toBeLessThan(BASE.opacity)
    expect(faded.size).toBe(BASE.size)
  })

  it('keeps a light touch visible rather than collapsing to nothing', () => {
    const light = pressureAdjustedParams({ ...BASE, pressureSize: true }, 0)
    expect(light.size).toBeGreaterThanOrEqual(1)
  })

  it('reaches full size at maximum pressure', () => {
    const full = pressureAdjustedParams({ ...BASE, pressureSize: true }, 1)
    expect(full.size).toBeCloseTo(BASE.size, 5)
  })
})

describe('pressure-driven dabs', () => {
  it('paints a smaller footprint at low pressure', () => {
    const w = 32
    const h = 32
    const params = { ...BASE, pressureSize: true }

    const heavy = new Uint8ClampedArray(w * h * 4)
    resetSoftBrushStroke()
    beginSoftBrushStroke(heavy, w, h, 16, 16, [255, 0, 0, 255], params, false, undefined, 1)

    const light = new Uint8ClampedArray(w * h * 4)
    resetSoftBrushStroke()
    beginSoftBrushStroke(light, w, h, 16, 16, [255, 0, 0, 255], params, false, undefined, 0.2)

    expect(filledCount(light)).toBeGreaterThan(0)
    expect(filledCount(light)).toBeLessThan(filledCount(heavy))
  })
})

describe('soft eraser', () => {
  it('fades alpha through the brush falloff instead of clearing outright', () => {
    const w = 16
    const h = 16
    const pixels = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) {
      pixels[i * 4] = 255
      pixels[i * 4 + 3] = 255
    }

    paintSoftBrushDab(
      pixels,
      w,
      h,
      8,
      8,
      [0, 0, 0, 255],
      { size: 8, hardness: 0, opacity: 1, flow: 0.5, shape: 'round' },
      true
    )

    const center = alphaAt(pixels, w, 8, 8)
    const edge = alphaAt(pixels, w, 8, 11)
    // Centre loses the most alpha; the soft edge keeps more; outside is intact.
    expect(center).toBeLessThan(255)
    expect(edge).toBeGreaterThan(center)
    expect(alphaAt(pixels, w, 0, 0)).toBe(255)
  })
})

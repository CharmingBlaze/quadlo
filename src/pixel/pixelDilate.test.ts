import { describe, expect, it } from 'vitest'
import { bleedTransparentEdges } from './pixelDilate'

function makeCanvas(w: number, h: number): Uint8ClampedArray {
  return new Uint8ClampedArray(w * h * 4)
}

function setPixel(
  pixels: Uint8ClampedArray,
  w: number,
  x: number,
  y: number,
  rgba: [number, number, number, number]
): void {
  const i = (y * w + x) * 4
  pixels[i] = rgba[0]
  pixels[i + 1] = rgba[1]
  pixels[i + 2] = rgba[2]
  pixels[i + 3] = rgba[3]
}

function getPixel(
  pixels: Uint8ClampedArray,
  w: number,
  x: number,
  y: number
): [number, number, number, number] {
  const i = (y * w + x) * 4
  return [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!, pixels[i + 3]!]
}

describe('bleedTransparentEdges', () => {
  it('grows a lone opaque texel outward by one pixel per pass', () => {
    const pixels = makeCanvas(5, 5)
    setPixel(pixels, 5, 2, 2, [255, 0, 0, 255])

    bleedTransparentEdges(pixels, 5, 5, 1)

    // The 8 neighbours pick up the colour at full alpha.
    expect(getPixel(pixels, 5, 1, 2)).toEqual([255, 0, 0, 255])
    expect(getPixel(pixels, 5, 3, 3)).toEqual([255, 0, 0, 255])
    // Two pixels away is still untouched after a single pass.
    expect(getPixel(pixels, 5, 0, 2)).toEqual([0, 0, 0, 0])
  })

  it('reaches further with more passes', () => {
    const pixels = makeCanvas(7, 7)
    setPixel(pixels, 7, 3, 3, [0, 128, 255, 255])

    bleedTransparentEdges(pixels, 7, 7, 3)

    expect(getPixel(pixels, 7, 0, 3)[3]).toBe(255)
    expect(getPixel(pixels, 7, 6, 3)[3]).toBe(255)
  })

  it('never overwrites existing artwork', () => {
    const pixels = makeCanvas(3, 3)
    setPixel(pixels, 3, 0, 0, [255, 0, 0, 255])
    setPixel(pixels, 3, 1, 1, [0, 255, 0, 255])

    bleedTransparentEdges(pixels, 3, 3, 2)

    expect(getPixel(pixels, 3, 0, 0)).toEqual([255, 0, 0, 255])
    expect(getPixel(pixels, 3, 1, 1)).toEqual([0, 255, 0, 255])
  })

  it('reports the region it touched and leaves an empty canvas alone', () => {
    const pixels = makeCanvas(5, 5)
    setPixel(pixels, 5, 2, 2, [10, 20, 30, 255])

    const touched = bleedTransparentEdges(pixels, 5, 5, 1)
    expect(touched).toEqual({ x: 1, y: 1, w: 3, h: 3 })

    expect(bleedTransparentEdges(makeCanvas(5, 5), 5, 5, 2)).toBeNull()
  })

  it('honours a stroke rect but still bleeds outside it', () => {
    const pixels = makeCanvas(9, 9)
    setPixel(pixels, 9, 4, 4, [255, 255, 255, 255])

    // Rect covers only the painted texel; padding must still spread outward.
    bleedTransparentEdges(pixels, 9, 9, 2, { x: 4, y: 4, w: 1, h: 1 })

    expect(getPixel(pixels, 9, 2, 4)[3]).toBe(255)
    // Far outside the padded rect stays empty.
    expect(getPixel(pixels, 9, 8, 8)[3]).toBe(0)
  })

  it('averages colour from multiple filled neighbours', () => {
    const pixels = makeCanvas(3, 1)
    setPixel(pixels, 3, 0, 0, [0, 0, 0, 255])
    setPixel(pixels, 3, 2, 0, [200, 100, 50, 255])

    bleedTransparentEdges(pixels, 3, 1, 1)

    expect(getPixel(pixels, 3, 1, 0)).toEqual([100, 50, 25, 255])
  })
})

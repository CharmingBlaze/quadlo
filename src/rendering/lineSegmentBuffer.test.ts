import { describe, expect, it } from 'vitest'
import { InterleavedBufferAttribute } from 'three'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import {
  applyPolylineToLineGeometry,
  flattenPolyline,
  polylinesEqual,
  segmentBufferLength,
  writePolylineSegments,
  type LinePoint,
} from './lineSegmentBuffer'

const A: LinePoint = [0, 0, 0]
const B: LinePoint = [1, 2, 3]
const C: LinePoint = [4, 5, 6]

describe('segmentBufferLength', () => {
  it('is empty below two points', () => {
    expect(segmentBufferLength(0)).toBe(0)
    expect(segmentBufferLength(1)).toBe(0)
  })

  it('allocates start+end xyz per segment', () => {
    expect(segmentBufferLength(2)).toBe(6)
    expect(segmentBufferLength(4)).toBe(18)
  })
})

describe('writePolylineSegments', () => {
  it('interleaves consecutive points as start/end pairs', () => {
    const out = new Float32Array(segmentBufferLength(3))
    writePolylineSegments([A, B, C], out)
    expect([...out]).toEqual([0, 0, 0, 1, 2, 3, 1, 2, 3, 4, 5, 6])
  })

  it('matches the layout three builds from a flat polyline', () => {
    const points = [A, B, C]
    const flat = flattenPolyline(points)
    // Mirrors LineGeometry.setPositions' pair expansion.
    const expected = new Float32Array(2 * (flat.length - 3))
    for (let i = 0; i < flat.length - 3; i += 3) {
      expected[2 * i] = flat[i]!
      expected[2 * i + 1] = flat[i + 1]!
      expected[2 * i + 2] = flat[i + 2]!
      expected[2 * i + 3] = flat[i + 3]!
      expected[2 * i + 4] = flat[i + 4]!
      expected[2 * i + 5] = flat[i + 5]!
    }

    const out = new Float32Array(segmentBufferLength(points.length))
    writePolylineSegments(points, out)
    expect([...out]).toEqual([...expected])
  })

  it('leaves the buffer untouched for a degenerate line', () => {
    const out = new Float32Array(6)
    writePolylineSegments([A], out)
    expect([...out]).toEqual([0, 0, 0, 0, 0, 0])
  })
})

describe('polylinesEqual', () => {
  it('detects unchanged points so drags skip redundant uploads', () => {
    expect(polylinesEqual([A, B], [[0, 0, 0], [1, 2, 3]])).toBe(true)
  })

  it('detects moved points and length changes', () => {
    expect(polylinesEqual([A, B], [A, C])).toBe(false)
    expect(polylinesEqual([A, B], [A])).toBe(false)
    expect(polylinesEqual(null, [A])).toBe(false)
  })
})

describe('applyPolylineToLineGeometry', () => {
  function mockGeometry(initialSegmentCount = 0) {
    let positions = new Float32Array(6)
    let instanceStart = new Float32Array(segmentBufferLength(Math.max(2, initialSegmentCount + 1)))
    let instanceEnd = new Float32Array(instanceStart.length)
    let instanceCount = initialSegmentCount

    return {
      setPositions(array: Float32Array) {
        positions = array
        instanceStart = new Float32Array(segmentBufferLength(Math.max(2, array.length / 3)))
        instanceEnd = new Float32Array(instanceStart.length)
      },
      getAttribute(name: string) {
        if (name === 'instanceStart') {
          return { data: { array: instanceStart, needsUpdate: false }, count: instanceStart.length / 3 }
        }
        if (name === 'instanceEnd') {
          return { data: { array: instanceEnd, needsUpdate: false }, count: instanceEnd.length / 3 }
        }
        return undefined
      },
      get instanceCount() {
        return instanceCount
      },
      set instanceCount(value: number) {
        instanceCount = value
      },
      get positions() {
        return positions
      },
      get instanceStart() {
        return instanceStart
      },
      computeBoundingBox: () => {},
      computeBoundingSphere: () => {},
    }
  }

  it('sets instanceCount when rebuilding the polyline buffer', () => {
    const geometry = mockGeometry(0)
    applyPolylineToLineGeometry(geometry, [A, B, C])
    expect(geometry.instanceCount).toBe(2)
    expect([...geometry.positions]).toEqual([...flattenPolyline([A, B, C])])
  })

  it('rebuilds via setPositions when the buffer size changes', () => {
    const geometry = mockGeometry(0)
    applyPolylineToLineGeometry(geometry, [A, B])
    expect(geometry.instanceCount).toBe(1)
    expect([...geometry.positions]).toEqual([...flattenPolyline([A, B])])
  })

  it('clears instanceCount for a degenerate polyline', () => {
    const geometry = mockGeometry(2)
    applyPolylineToLineGeometry(geometry, [A])
    expect(geometry.instanceCount).toBe(0)
  })

  it('uses LineGeometry.setPositions for live viewport overlays', () => {
    const geometry = new LineGeometry()
    applyPolylineToLineGeometry(geometry, [A, B, C])
    expect(geometry.instanceCount).toBe(2)
    const start = geometry.getAttribute('instanceStart') as InterleavedBufferAttribute
    expect(start.count).toBe(2)
    expect(start.data.array[0]).toBe(0)
    expect(start.data.array[3]).toBe(1)
  })
})

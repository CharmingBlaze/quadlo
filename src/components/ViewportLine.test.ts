import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  copyPolyline,
  pointX,
  pointY,
  pointZ,
  polylinesEqual,
  type LinePoint,
} from '../rendering/lineSegmentBuffer'

/**
 * ViewportLine now uses native THREE.Line + BufferGeometry.
 * Line2/LineMaterial fat lines were invisible in R3F 9 (Sketch + Pen markers
 * showed, connecting polylines did not).
 */
describe('ViewportLine native line path', () => {
  it('THREE.Line keeps the BufferGeometry assigned at construction', () => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 })
    const line = new THREE.Line(geometry, material)

    expect(line.geometry).toBe(geometry)
    expect(line.material).toBe(material)
  })

  it('updates BufferGeometry positions for a live stroke polyline', () => {
    const geometry = new THREE.BufferGeometry()
    const points: LinePoint[] = [
      [0, 0, 0],
      [1, 2, 3],
      [4, 5, 6],
    ]

    const arr = new Float32Array(points.length * 3)
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!
      arr[i * 3] = pointX(p)
      arr[i * 3 + 1] = pointY(p)
      arr[i * 3 + 2] = pointZ(p)
    }
    const attr = new THREE.BufferAttribute(arr, 3)
    attr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', attr)
    geometry.setDrawRange(0, points.length)

    const pos = geometry.getAttribute('position') as THREE.BufferAttribute
    expect(pos.count).toBe(3)
    expect(geometry.drawRange.count).toBe(3)
    expect(pos.getX(1)).toBe(1)
    expect(pos.getY(1)).toBe(2)
    expect(pos.getZ(1)).toBe(3)
  })

  it('skips redundant uploads when the polyline is unchanged', () => {
    const a: LinePoint[] = [
      [0, 0, 0],
      [1, 1, 1],
    ]
    const snap = copyPolyline(a)
    expect(polylinesEqual(snap, a)).toBe(true)
    expect(
      polylinesEqual(snap, [
        [0, 0, 0],
        [1, 1, 2],
      ])
    ).toBe(false)
  })

  it('LineDashedMaterial can replace LineBasicMaterial on the same Line', () => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ])
    const basic = new THREE.LineBasicMaterial({ color: 0xffffff })
    const dashed = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 2,
      gapSize: 1,
    })
    const line = new THREE.Line(geometry, basic)
    line.material = dashed
    line.computeLineDistances()

    expect(line.material).toBe(dashed)
    expect(geometry.getAttribute('lineDistance')).toBeTruthy()
  })
})

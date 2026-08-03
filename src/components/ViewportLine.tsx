import { useEffect, useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  copyPolyline,
  pointX,
  pointY,
  pointZ,
  polylinesEqual,
  type LinePoint,
  type LineTuple,
} from '../rendering/lineSegmentBuffer'

export interface ViewportLineProps {
  points: readonly LinePoint[]
  color?: string | number
  lineWidth?: number
  dashed?: boolean
  dashSize?: number
  gapSize?: number
  transparent?: boolean
  opacity?: number
  depthTest?: boolean
  depthWrite?: boolean
  toneMapped?: boolean
  renderOrder?: number
  visible?: boolean
  frustumCulled?: boolean
}

type LineBundle = {
  line: THREE.Line
  geometry: THREE.BufferGeometry
  basic: THREE.LineBasicMaterial
  dashedMat: THREE.LineDashedMaterial
}

function createLineBundle(): LineBundle {
  const geometry = new THREE.BufferGeometry()
  const basic = new THREE.LineBasicMaterial({ color: 0xffffff })
  const dashedMat = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 1,
    gapSize: 1,
  })
  const line = new THREE.Line(geometry, basic)
  line.frustumCulled = false
  return { line, geometry, basic, dashedMat }
}

/** Update BufferGeometry positions in place; grow capacity only when needed. */
function applyPolylineToBufferGeometry(
  geometry: THREE.BufferGeometry,
  points: readonly LinePoint[]
): void {
  const count = points.length
  if (count < 2) {
    geometry.setDrawRange(0, 0)
    return
  }

  let pos = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!pos || pos.count < count) {
    const capacity = Math.max(count, pos ? pos.count * 2 : 32)
    const arr = new Float32Array(capacity * 3)
    pos = new THREE.BufferAttribute(arr, 3)
    pos.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', pos)
  }

  const arr = pos.array as Float32Array
  for (let i = 0; i < count; i++) {
    const p = points[i]!
    const o = i * 3
    arr[o] = pointX(p)
    arr[o + 1] = pointY(p)
    arr[o + 2] = pointZ(p)
  }
  pos.needsUpdate = true
  geometry.setDrawRange(0, count)
  geometry.computeBoundingSphere()
}

/** Safely compute dashed line distances if position attribute exists and contains >= 2 points. */
function safeComputeLineDistances(
  line: THREE.Line,
  geometry: THREE.BufferGeometry,
  dashed: boolean
): void {
  if (!dashed) return
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (pos && pos.count >= 2) {
    try {
      line.computeLineDistances()
    } catch {
      // Ignore transient attribute updates
    }
  }
}

/**
 * Viewport polyline overlay.
 *
 * Uses native THREE.Line — Line2/LineMaterial fat lines proved unreliable in
 * R3F 9 (markers rendered, connecting polylines did not across Sketch + Pen).
 * Screen-space width is ignored on most platforms; visibility is the priority.
 */
export function ViewportLine({
  points,
  color = '#ffffff',
  lineWidth: _lineWidth = 1,
  dashed = false,
  dashSize = 1,
  gapSize = 1,
  transparent = false,
  opacity = 1,
  depthTest = true,
  depthWrite = true,
  toneMapped = false,
  renderOrder,
  visible = true,
  frustumCulled = false,
}: ViewportLineProps) {
  const invalidate = useThree((s) => s.invalidate)

  const bundleRef = useRef<LineBundle | null>(null)
  if (!bundleRef.current) {
    bundleRef.current = createLineBundle()
  }
  const { line, geometry, basic, dashedMat } = bundleRef.current

  const lastPointsRef = useRef<LineTuple[] | null>(null)

  useLayoutEffect(() => {
    if (polylinesEqual(lastPointsRef.current, points)) return

    applyPolylineToBufferGeometry(geometry, points)
    safeComputeLineDistances(line, geometry, dashed)

    lastPointsRef.current = copyPolyline(points)
    invalidate()
  }, [points, geometry, line, dashed, invalidate])

  useLayoutEffect(() => {
    const mat = dashed ? dashedMat : basic
    mat.color.set(color)
    mat.transparent = transparent
    mat.opacity = opacity
    mat.depthTest = depthTest
    mat.depthWrite = depthWrite
    mat.toneMapped = toneMapped
    if (dashed) {
      dashedMat.dashSize = dashSize
      dashedMat.gapSize = gapSize
    }
    if (line.material !== mat) {
      line.material = mat
      safeComputeLineDistances(line, geometry, dashed)
    }
    invalidate()
  }, [
    color,
    dashSize,
    gapSize,
    transparent,
    opacity,
    depthTest,
    depthWrite,
    toneMapped,
    dashed,
    basic,
    dashedMat,
    line,
    invalidate,
  ])

  useEffect(
    () => () => {
      const bundle = bundleRef.current
      if (!bundle) return
      bundle.geometry.dispose()
      bundle.basic.dispose()
      bundle.dashedMat.dispose()
      bundleRef.current = null
    },
    []
  )

  return (
    <primitive
      object={line}
      visible={visible}
      frustumCulled={frustumCulled}
      {...(renderOrder === undefined ? {} : { renderOrder })}
    />
  )
}

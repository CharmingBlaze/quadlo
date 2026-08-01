import { TransformControls, type TransformControlsProps } from '@react-three/drei'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { TransformControls as TransformControlsImpl } from 'three-stdlib'
import { applyGizmoGeometryPolish, applyTransformControlsTheme } from '../theme/gizmoTheme'
import { useTheme } from '../theme/useTheme'
import type { ThemeColors } from '../theme/useTheme'
import { pushViewportSharedInteraction, popViewportSharedInteraction } from '../rendering/viewportFrameLoop'
import {
  beginGizmoPointerCapture,
  endGizmoPointerCapture,
} from '../viewport/gizmoPointerGate'
import { useViewportSlotIndex } from './ViewportSlotContext'

type TransformControlEvent = Parameters<NonNullable<TransformControlsProps['onMouseDown']>>[0]

type OrbitControlsLike = { enabled: boolean } | null | undefined

function applyControlsTheme(controls: TransformControlsImpl, theme: ThemeColors, polishedRef: { current: boolean }) {
  if (!polishedRef.current) {
    applyGizmoGeometryPolish(controls)
    polishedRef.current = true
  }
  applyTransformControlsTheme(controls, theme)
}

export const ThemedTransformControls = forwardRef<
  TransformControlsImpl,
  TransformControlsProps
>(function ThemedTransformControls(props, forwardedRef) {
  const theme = useTheme()
  const themeRef = useRef(theme)
  themeRef.current = theme
  const slotIndex = useViewportSlotIndex()
  const orbitControls = useThree((s) => s.controls as OrbitControlsLike)
  const localRef = useRef<TransformControlsImpl>(null)
  const polishedRef = useRef(false)
  const draggingRef = useRef(false)
  const { onMouseDown, onMouseUp, ...rest } = props

  const syncTheme = useCallback((controls: TransformControlsImpl) => {
    applyControlsTheme(controls, themeRef.current, polishedRef)
  }, [])

  useLayoutEffect(() => {
    const controls = localRef.current
    if (!controls) return
    syncTheme(controls)
  }, [theme, syncTheme])

  useEffect(() => {
    const controls = localRef.current as (TransformControlsImpl & {
      addEventListener(type: 'dragging-changed', listener: (event: { value: boolean }) => void): void
      removeEventListener(type: 'dragging-changed', listener: (event: { value: boolean }) => void): void
    }) | null
    if (!controls) return

    const onDraggingChanged = (event: { value: boolean }) => {
      draggingRef.current = event.value
      if (orbitControls) orbitControls.enabled = !event.value
    }

    controls.addEventListener('dragging-changed', onDraggingChanged)
    return () => {
      controls.removeEventListener('dragging-changed', onDraggingChanged)
      if (orbitControls) orbitControls.enabled = true
    }
  }, [orbitControls])

  useEffect(() => () => {
    endGizmoPointerCapture()
    if (orbitControls) orbitControls.enabled = true
  }, [orbitControls])

  const mergeRef = (instance: TransformControlsImpl | null) => {
    localRef.current = instance
    if (typeof forwardedRef === 'function') forwardedRef(instance)
    else if (forwardedRef) forwardedRef.current = instance
    if (instance) syncTheme(instance)
  }

  const handleMouseDown = useCallback(
    (event: TransformControlEvent) => {
      beginGizmoPointerCapture()
      pushViewportSharedInteraction(slotIndex)
      if (orbitControls) orbitControls.enabled = false
      onMouseDown?.(event)
    },
    [onMouseDown, orbitControls, slotIndex]
  )

  const handleMouseUp = useCallback(
    (event: TransformControlEvent) => {
      popViewportSharedInteraction(slotIndex)
      endGizmoPointerCapture()
      if (orbitControls && !draggingRef.current) orbitControls.enabled = true
      onMouseUp?.(event)
    },
    [onMouseUp, orbitControls, slotIndex]
  )

  return (
    <TransformControls
      ref={mergeRef}
      {...rest}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  )
})

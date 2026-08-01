import { useMemo } from 'react'
import type { TransformControlsProps } from '@react-three/drei'
import { useAppStore } from '../store/appStore'

/** Shared TransformControls props driven by the gizmo slice (space, snap, size). */
export function useTransformGizmoSettings(): Pick<
  TransformControlsProps,
  'space' | 'size' | 'translationSnap' | 'rotationSnap' | 'scaleSnap'
> {
  const gizmoSpace = useAppStore((s) => s.gizmoSpace)
  const gizmoSize = useAppStore((s) => s.gizmoSize)
  const gizmoSnapEnabled = useAppStore((s) => s.gizmoSnapEnabled)
  const gizmoTranslationSnap = useAppStore((s) => s.gizmoTranslationSnap)
  const gizmoRotationSnap = useAppStore((s) => s.gizmoRotationSnap)
  const gizmoScaleSnap = useAppStore((s) => s.gizmoScaleSnap)

  return useMemo(
    () => ({
      space: gizmoSpace,
      size: gizmoSize,
      translationSnap: gizmoSnapEnabled ? gizmoTranslationSnap : null,
      rotationSnap: gizmoSnapEnabled ? gizmoRotationSnap : null,
      scaleSnap: gizmoSnapEnabled ? gizmoScaleSnap : null,
    }),
    [
      gizmoSpace,
      gizmoSize,
      gizmoSnapEnabled,
      gizmoTranslationSnap,
      gizmoRotationSnap,
      gizmoScaleSnap,
    ]
  )
}

export function useGizmoVisible(): boolean {
  return useAppStore((s) => s.gizmoVisible)
}

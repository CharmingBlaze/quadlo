export type GizmoSpace = 'world' | 'local'

export interface GizmoLayoutState {
  /** When false, transform gizmos are hidden even in move/rotate/scale modes. */
  gizmoVisible: boolean
  gizmoSpace: GizmoSpace
  gizmoSnapEnabled: boolean
  /** World units; applied when snap is enabled. */
  gizmoTranslationSnap: number
  /** Radians; applied when snap is enabled. */
  gizmoRotationSnap: number
  /** Uniform scale step; applied when snap is enabled. */
  gizmoScaleSnap: number
  /** TransformControls handle size multiplier. */
  gizmoSize: number
}

export interface GizmoLayoutActions {
  setGizmoVisible: (visible: boolean) => void
  setGizmoSpace: (space: GizmoSpace) => void
  setGizmoSnapEnabled: (enabled: boolean) => void
  setGizmoTranslationSnap: (value: number) => void
  setGizmoRotationSnap: (value: number) => void
  setGizmoScaleSnap: (value: number) => void
  setGizmoSize: (size: number) => void
}

export type GizmoSlice = GizmoLayoutState & GizmoLayoutActions

export const gizmoInitialState: GizmoLayoutState = {
  gizmoVisible: true,
  gizmoSpace: 'world',
  gizmoSnapEnabled: false,
  gizmoTranslationSnap: 1,
  gizmoRotationSnap: Math.PI / 12,
  gizmoScaleSnap: 0.1,
  gizmoSize: 0.8,
}

export function createGizmoSlice<T extends GizmoSlice>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
): GizmoSlice {
  return {
    ...gizmoInitialState,
    setGizmoVisible: (visible) => set({ gizmoVisible: visible } as Partial<T>),
    setGizmoSpace: (space) => set({ gizmoSpace: space } as Partial<T>),
    setGizmoSnapEnabled: (enabled) => set({ gizmoSnapEnabled: enabled } as Partial<T>),
    setGizmoTranslationSnap: (value) =>
      set({ gizmoTranslationSnap: Math.max(0.001, value) } as Partial<T>),
    setGizmoRotationSnap: (value) =>
      set({ gizmoRotationSnap: Math.max(0.001, value) } as Partial<T>),
    setGizmoScaleSnap: (value) => set({ gizmoScaleSnap: Math.max(0.001, value) } as Partial<T>),
    setGizmoSize: (size) => set({ gizmoSize: Math.max(0.4, Math.min(3, size)) } as Partial<T>),
  }
}

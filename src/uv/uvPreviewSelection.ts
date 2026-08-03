import type { SceneObject } from '../mesh/HalfEdgeMesh'
import { expandFaceToPlanarRegion } from '../mesh/faceGroups'

/** Shared selection rule for clicking authored faces in the UV 3D preview. */
export function resolveUvPreviewFaceSelection(
  current: readonly number[],
  face: number,
  additive: boolean
): number[] {
  if (!additive) return [face]
  if (current.includes(face)) return current.filter((value) => value !== face)
  return [...new Set([...current, face])]
}

/** Sticky-aware face pick — matches the main UV canvas selection rules. */
export function resolveUvFaceSelection(
  obj: SceneObject | null,
  current: readonly number[],
  face: number,
  additive: boolean,
  sticky: boolean
): number[] {
  if (!sticky || !obj) {
    return resolveUvPreviewFaceSelection(current, face, additive)
  }
  const region = expandFaceToPlanarRegion(obj, face)
  if (!additive) return region
  const allSelected = region.length > 0 && region.every((fi) => current.includes(fi))
  if (allSelected) {
    const remove = new Set(region)
    return current.filter((fi) => !remove.has(fi))
  }
  return [...new Set([...current, ...region])]
}

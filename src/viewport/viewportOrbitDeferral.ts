/** Shared gate so select tools can arm OrbitControls mid-drag without moving the camera on click. */

import type { ViewportSlotIndex } from '../scene/viewTypes'

export type DeferredOrbitArmEvent = Pick<
  PointerEvent,
  'clientX' | 'clientY' | 'pointerId' | 'pointerType' | 'button'
>

type ArmDeferredOrbit = (event: DeferredOrbitArmEvent) => void
type ResetCameraNavigation = (event?: DeferredOrbitArmEvent) => void
type LeftButtonPolicyListener = () => void

const armDeferredOrbitBySlot = new Map<ViewportSlotIndex, ArmDeferredOrbit>()
const resetCameraNavigationBySlot = new Map<ViewportSlotIndex, ResetCameraNavigation>()

/** When true, synthetic pointer events used to arm orbit must not run selection handlers. */
export let suppressSyntheticOrbitEvents = false

/** Object/component free-drag owns LMB — OrbitControls LEFT stays idle. */
let leftButtonBlocked = false
const leftButtonPolicyListeners = new Set<LeftButtonPolicyListener>()

function notifyLeftButtonPolicyListeners(): void {
  for (const listener of leftButtonPolicyListeners) listener()
}

export function setViewportLeftButtonBlocked(blocked: boolean): void {
  if (leftButtonBlocked === blocked) return
  leftButtonBlocked = blocked
  notifyLeftButtonPolicyListeners()
}

/** Force-clear LMB block (tool change, pointerup, Escape). */
export function clearViewportLeftButtonBlocked(): void {
  setViewportLeftButtonBlocked(false)
}

export function isViewportLeftButtonBlocked(): boolean {
  return leftButtonBlocked
}

export function isSuppressingSyntheticOrbitEvents(): boolean {
  return suppressSyntheticOrbitEvents
}

/** Register a listener; returns an unregister function (safe with multiple viewports). */
export function registerLeftButtonPolicyListener(fn: LeftButtonPolicyListener): () => void {
  leftButtonPolicyListeners.add(fn)
  return () => {
    leftButtonPolicyListeners.delete(fn)
  }
}

export function registerDeferredOrbitArmer(
  slotIndex: ViewportSlotIndex,
  fn: ArmDeferredOrbit | null
): void {
  if (fn) armDeferredOrbitBySlot.set(slotIndex, fn)
  else armDeferredOrbitBySlot.delete(slotIndex)
}

export function registerCameraNavigationReset(
  slotIndex: ViewportSlotIndex,
  fn: ResetCameraNavigation | null
): void {
  if (fn) resetCameraNavigationBySlot.set(slotIndex, fn)
  else resetCameraNavigationBySlot.delete(slotIndex)
}

export function requestDeferredOrbitArm(
  slotIndex: ViewportSlotIndex,
  event: DeferredOrbitArmEvent
): void {
  if (leftButtonBlocked) return
  armDeferredOrbitBySlot.get(slotIndex)?.(event)
}

export function requestCameraNavigationReset(
  slotIndex: ViewportSlotIndex,
  event?: DeferredOrbitArmEvent
): void {
  resetCameraNavigationBySlot.get(slotIndex)?.(event)
}

export function runWithSyntheticOrbitEvents<T>(fn: () => T): T {
  suppressSyntheticOrbitEvents = true
  try {
    return fn()
  } finally {
    suppressSyntheticOrbitEvents = false
  }
}

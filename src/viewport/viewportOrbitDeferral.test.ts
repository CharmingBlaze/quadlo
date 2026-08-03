import { describe, expect, it } from 'vitest'
import {
  clearViewportLeftButtonBlocked,
  isSuppressingSyntheticOrbitEvents,
  isViewportLeftButtonBlocked,
  registerLeftButtonPolicyListener,
  runWithSyntheticOrbitEvents,
  setViewportLeftButtonBlocked,
  suppressSyntheticOrbitEvents,
} from './viewportOrbitDeferral'

describe('viewportOrbitDeferral', () => {
  it('toggles left-button block and notifies per-listener unregister safely', () => {
    clearViewportLeftButtonBlocked()
    const seen: boolean[] = []
    const unregisterA = registerLeftButtonPolicyListener(() => {
      seen.push(isViewportLeftButtonBlocked())
    })
    const unregisterB = registerLeftButtonPolicyListener(() => {
      seen.push(isViewportLeftButtonBlocked())
    })

    setViewportLeftButtonBlocked(true)
    expect(seen).toEqual([true, true])

    unregisterA()
    seen.length = 0
    setViewportLeftButtonBlocked(false)
    expect(seen).toEqual([false])

    unregisterB()
    seen.length = 0
    setViewportLeftButtonBlocked(true)
    expect(seen).toEqual([])
    clearViewportLeftButtonBlocked()
  })

  it('scopes synthetic-orbit suppression to the callback', () => {
    expect(isSuppressingSyntheticOrbitEvents()).toBe(false)
    expect(suppressSyntheticOrbitEvents).toBe(false)

    const inside = runWithSyntheticOrbitEvents(() => {
      expect(isSuppressingSyntheticOrbitEvents()).toBe(true)
      expect(suppressSyntheticOrbitEvents).toBe(true)
      return 7
    })

    expect(inside).toBe(7)
    expect(isSuppressingSyntheticOrbitEvents()).toBe(false)
    expect(suppressSyntheticOrbitEvents).toBe(false)
  })
})

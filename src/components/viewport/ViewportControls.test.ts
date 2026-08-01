import { describe, expect, it } from 'vitest'
import {
  defaultViewportNavigation,
  isExplicitViewportNavigation,
  leftMouseAction,
  resolveIdleLeftNavigation,
  resolveLightWaveNavTarget,
  resolveOrbitLeftNavigation,
  resolvePrimaryNavigation,
  resolveStickyNavigation,
} from './ViewportControls'
import { MOUSE } from 'three'

describe('ViewportControls navigation', () => {
  it('maps default LMB to orbit in perspective and pan in ortho', () => {
    expect(defaultViewportNavigation(true)).toBe('orbit')
    expect(defaultViewportNavigation(false)).toBe('pan')
    expect(leftMouseAction('orbit', true)).toBe(MOUSE.ROTATE)
    expect(leftMouseAction('pan', false)).toBe(MOUSE.PAN)
    expect(resolveIdleLeftNavigation('select-object', true, null, 'object')).toBe('orbit')
    expect(resolveIdleLeftNavigation('select-object', false, null, 'object')).toBe('pan')
  })

  it('leaves CAD plain LMB idle (no OrbitControls action)', () => {
    expect(leftMouseAction(null, true)).toBe(-1)
    expect(resolveIdleLeftNavigation('primitive-box', true, null)).toBe(null)
  })

  it('maps explicit modifier navigation', () => {
    expect(resolvePrimaryNavigation({ shiftKey: false, altKey: true, ctrlKey: false, metaKey: false }, true)).toBe(
      'orbit'
    )
    expect(resolvePrimaryNavigation({ shiftKey: false, altKey: false, ctrlKey: true, metaKey: false }, false)).toBe(
      null
    )
    expect(
      resolvePrimaryNavigation({ shiftKey: true, altKey: true, ctrlKey: false, metaKey: false }, false)
    ).toBe('pan')
  })

  it('keeps CAD draw tools on plain LMB even in perspective', () => {
    const event = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
    expect(resolveOrbitLeftNavigation(event, null, true, 'primitive-box')).toBe(null)
    expect(leftMouseAction(resolveOrbitLeftNavigation(event, null, true, 'primitive-box'), true)).toBe(-1)
  })

  it('defaults select tools to orbit/pan like other navigation tools', () => {
    const event = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
    expect(resolveOrbitLeftNavigation(event, null, true, 'select-object', null, 'object')).toBe(
      'orbit'
    )
    expect(
      leftMouseAction(resolveOrbitLeftNavigation(event, null, true, 'select-object', null, 'object'), true)
    ).toBe(MOUSE.ROTATE)
    expect(resolveOrbitLeftNavigation(event, null, false, 'select-object', null, 'object')).toBe(
      'pan'
    )
  })

  it('keeps draw tools on plain LMB and blocks Alt from stealing orbit', () => {
    const plain = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
    expect(resolveIdleLeftNavigation('draw', true, null)).toBe(null)
    expect(resolveIdleLeftNavigation('vector-pen', true, null)).toBe(null)
    expect(resolveOrbitLeftNavigation(plain, null, true, 'draw')).toBe(null)
    expect(
      resolveOrbitLeftNavigation(
        { shiftKey: false, altKey: true, ctrlKey: false, metaKey: false },
        null,
        true,
        'draw'
      )
    ).toBe(null)
    expect(
      resolveOrbitLeftNavigation(
        { shiftKey: false, altKey: true, ctrlKey: false, metaKey: false },
        null,
        true,
        'primitive-box'
      )
    ).toBe(null)
  })

  it('still allows sticky nav and gadgets over draw tools', () => {
    const event = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
    expect(resolveOrbitLeftNavigation(event, null, true, 'primitive-box', 'pan')).toBe('pan')
  })

  it('blocks Ctrl+LMB camera drag while draw tools are active', () => {
    expect(
      resolveOrbitLeftNavigation(
        { shiftKey: false, altKey: false, ctrlKey: true, metaKey: false },
        null,
        true,
        'draw'
      )
    ).toBe(null)
    expect(
      leftMouseAction(
        resolveOrbitLeftNavigation(
          { shiftKey: false, altKey: false, ctrlKey: true, metaKey: false },
          null,
          true,
          'select-object'
        ),
        true
      )
    ).toBe(-1)
  })

  it('reads LightWave gadget targets when DOM is available', () => {
    if (typeof document === 'undefined') return
    const panBtn = document.createElement('button')
    panBtn.setAttribute('data-lw-nav', 'pan')
    expect(resolveLightWaveNavTarget(panBtn, true)).toBe('pan')
    expect(
      resolveOrbitLeftNavigation(
        { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        panBtn,
        true,
        'primitive-box'
      )
    ).toBe('pan')
  })

  it('arms sticky pan over CAD draw tools', () => {
    const event = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
    expect(resolveOrbitLeftNavigation(event, null, true, 'primitive-box', 'pan')).toBe('pan')
    expect(leftMouseAction(resolveOrbitLeftNavigation(event, null, true, 'primitive-box', 'pan'), true)).toBe(
      MOUSE.PAN
    )
  })

  it('ignores sticky orbit in orthographic views', () => {
    expect(resolveStickyNavigation('orbit', false)).toBe(null)
    const event = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }
    expect(resolveOrbitLeftNavigation(event, null, false, 'select-object', 'orbit')).toBe('pan')
    expect(resolveOrbitLeftNavigation(event, null, false, 'select-object', 'pan')).toBe('pan')
  })

  it('prefers modifiers and gadgets over sticky nav', () => {
    const event = { shiftKey: false, altKey: true, ctrlKey: false, metaKey: false }
    expect(resolveOrbitLeftNavigation(event, null, true, 'select-object', 'pan')).toBe('orbit')
  })

  it('treats MMB and RMB perspective as explicit camera pan gestures', () => {
    expect(
      isExplicitViewportNavigation(
        { button: 1, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        null,
        true,
        null
      )
    ).toBe(true)
    expect(
      isExplicitViewportNavigation(
        { button: 1, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        null,
        false,
        null
      )
    ).toBe(true)
    expect(
      isExplicitViewportNavigation(
        { button: 1, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        null,
        true,
        null,
        undefined,
        undefined,
        true
      )
    ).toBe(false)
  })

  it('treats RMB perspective and sticky nav as explicit camera gestures; Ctrl+LMB never is', () => {
    expect(
      isExplicitViewportNavigation(
        { button: 2, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        null,
        true,
        null
      )
    ).toBe(true)
    expect(
      isExplicitViewportNavigation(
        { button: 0, shiftKey: false, altKey: false, ctrlKey: true, metaKey: false },
        null,
        true,
        null,
        'object',
        'select-object'
      )
    ).toBe(false)
    expect(
      isExplicitViewportNavigation(
        { button: 0, shiftKey: false, altKey: false, ctrlKey: true, metaKey: false },
        null,
        false,
        null,
        'object',
        'draw'
      )
    ).toBe(false)
    expect(
      isExplicitViewportNavigation(
        { button: 0, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        null,
        true,
        'orbit'
      )
    ).toBe(true)
    expect(
      isExplicitViewportNavigation(
        { button: 0, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
        null,
        true,
        null
      )
    ).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { evaluateEasing } from './animationEasing'

describe('animationEasing', () => {
  it('evaluates linear easing correctly', () => {
    expect(evaluateEasing(0, 'linear')).toBe(0)
    expect(evaluateEasing(0.5, 'linear')).toBe(0.5)
    expect(evaluateEasing(1, 'linear')).toBe(1)
  })

  it('evaluates ease-in correctly', () => {
    expect(evaluateEasing(0.5, 'ease-in')).toBe(0.25)
  })

  it('evaluates ease-out correctly', () => {
    expect(evaluateEasing(0.5, 'ease-out')).toBe(0.75)
  })

  it('evaluates bounce and elastic endpoints correctly', () => {
    expect(evaluateEasing(0, 'bounce')).toBe(0)
    expect(evaluateEasing(1, 'bounce')).toBe(1)
    expect(evaluateEasing(0, 'elastic')).toBe(0)
    expect(evaluateEasing(1, 'elastic')).toBe(1)
  })
})

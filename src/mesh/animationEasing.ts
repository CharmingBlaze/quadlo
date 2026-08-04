export type KeyframeEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'

/** Evaluates normalized time t (0 to 1) based on the chosen easing curve. */
export function evaluateEasing(t: number, easing: KeyframeEasing = 'linear'): number {
  const clampT = Math.max(0, Math.min(1, t))

  switch (easing) {
    case 'ease-in':
      return clampT * clampT
    case 'ease-out':
      return clampT * (2 - clampT)
    case 'ease-in-out':
      return clampT < 0.5 ? 2 * clampT * clampT : -1 + (4 - 2 * clampT) * clampT
    case 'bounce':
      return evaluateBounce(clampT)
    case 'elastic':
      return evaluateElastic(clampT)
    case 'linear':
    default:
      return clampT
  }
}

function evaluateBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75

  if (t < 1 / d1) {
    return n1 * t * t
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
}

function evaluateElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

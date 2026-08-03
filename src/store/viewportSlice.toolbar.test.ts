import { describe, expect, it } from 'vitest'
import {
  computeBottomToolbarPositions,
  syncBottomToolbarCluster,
  TOOLBAR_LAYOUT,
} from './viewportSlice'

describe('computeBottomToolbarPositions', () => {
  it('centers transform bar in main viewport area (window minus right side panel)', () => {
    const windowWidth = 1600
    const sidePanelWidth = 280
    const transformWidth = 420

    const { transformBarPosition } = computeBottomToolbarPositions({
      viewportWidth: windowWidth,
      viewportHeight: 900,
      sidePanelWidth,
      showSidePanel: true,
      showTransformBar: true,
      showPrimitivesBar: false,
      transformWidth,
    })

    const mainAreaWidth = windowWidth - sidePanelWidth
    const expectedLeft = Math.round((mainAreaWidth - transformWidth) / 2)
    expect(transformBarPosition.x).toBe(expectedLeft)
  })

  it('uses mainAreaWidth directly without subtracting the side panel again', () => {
    const mainAreaWidth = 1320
    const transformWidth = 400

    const { transformBarPosition } = computeBottomToolbarPositions({
      mainAreaWidth,
      viewportHeight: 900,
      sidePanelWidth: 280,
      showSidePanel: true,
      showTransformBar: true,
      showPrimitivesBar: false,
      transformWidth,
    })

    expect(transformBarPosition.x).toBe(Math.round((mainAreaWidth - transformWidth) / 2))
  })

  it('centers the combined cluster when both bars are visible', () => {
    const windowWidth = 1600
    const sidePanelWidth = 280
    const transformWidth = 420
    const primitivesWidth = 360
    const gap = TOOLBAR_LAYOUT.gap

    const { primitivesBarPosition, transformBarPosition } = computeBottomToolbarPositions({
      viewportWidth: windowWidth,
      viewportHeight: 900,
      sidePanelWidth,
      showSidePanel: true,
      showTransformBar: true,
      showPrimitivesBar: true,
      transformWidth,
      primitivesWidth,
    })

    const clusterWidth = primitivesWidth + gap + transformWidth
    const expectedLeft = Math.round(((windowWidth - sidePanelWidth) - clusterWidth) / 2)
    expect(primitivesBarPosition.x).toBe(expectedLeft)
    expect(transformBarPosition.x).toBe(expectedLeft + primitivesWidth + gap)
  })
})

describe('syncBottomToolbarCluster', () => {
  const baseState = {
    transformBarPosition: { x: 20, y: 20 },
    primitivesBarPosition: { x: 20, y: 72 },
    sidePanelWidth: 280,
    showSidePanel: true,
    showTransformBar: true,
    showPrimitivesBar: false,
    toolbarClusterAutoCenter: true,
  }

  it('recenters when auto-center is enabled', () => {
    const synced = syncBottomToolbarCluster(baseState, { force: true })
    expect(synced).not.toBeNull()
    expect(synced!.transformBarPosition!.y).toBeGreaterThan(baseState.transformBarPosition.y)
    expect(synced!.toolbarClusterAutoCenter).toBe(true)
  })

  it('skips recentering after the user moved the cluster', () => {
    const synced = syncBottomToolbarCluster(
      { ...baseState, toolbarClusterAutoCenter: false },
      { force: false }
    )
    expect(synced).toBeNull()
  })

  it('forces recenter on maximize even after user moved the cluster', () => {
    const synced = syncBottomToolbarCluster(
      { ...baseState, toolbarClusterAutoCenter: false },
      { force: true }
    )
    expect(synced).not.toBeNull()
    expect(synced!.toolbarClusterAutoCenter).toBe(true)
  })
})

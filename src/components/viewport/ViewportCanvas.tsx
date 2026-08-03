import { Canvas } from '@react-three/fiber'
import { NoToneMapping, PCFSoftShadowMap, PMREMGenerator, SRGBColorSpace } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type * as THREE from 'three'
import { getCameraSetup } from '../../scene/viewTypes'
import type { ViewType } from '../../store/appStore'
import { applyOrthoCamera } from './ViewportCamera'
import { useViewportRuntime } from './ViewportRuntimeContext'
import { ViewportScene } from './ViewportScene'
import type { SceneObject } from '../../mesh/HalfEdgeMesh'
import type { MeshComponentSelection } from '../../mesh/meshSelection'
import type { ActiveTool, SelectionMode } from '../../store/appStore'
import type { ViewportDisplayMode } from '../../rendering/viewportDisplay'

export function ViewportCanvas({
  containerRef,
  cameraRef,
  canvasPointerEvents,
  enableZoom,
  disableMiddlePan,
  isActiveViewport,
  showToolPreviews,
  objects,
  selectedObjectSet,
  selectedObjectId,
  gizmoTargetId,
  facetExaggeration,
  showDensityHeatmap,
  selectionMode,
  viewportDisplayMode,
  viewportXRay,
  showGrid,
  defaultDepth,
  themeId,
  meshSelection,
  selectionObjectIds,
  activeTool,
  cadPreviewSignal,
  primitiveBoxDraft,
  multiObjectGizmoActive,
  componentGizmoActive,
  componentGizmoObject,
  billboardImagesLength,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  cameraRef: React.MutableRefObject<THREE.Camera | null>
  canvasPointerEvents: boolean
  enableZoom: boolean
  disableMiddlePan: boolean
  isActiveViewport: boolean
  showToolPreviews: boolean
  objects: SceneObject[]
  selectedObjectSet: Set<string>
  selectedObjectId: string | null
  gizmoTargetId: string | null
  facetExaggeration: number
  showDensityHeatmap: boolean
  selectionMode: SelectionMode
  viewportDisplayMode: ViewportDisplayMode
  viewportXRay: boolean
  showGrid: boolean
  defaultDepth: number
  themeId: unknown
  meshSelection: MeshComponentSelection | null
  selectionObjectIds: string[]
  activeTool: ActiveTool
  cadPreviewSignal: unknown
  primitiveBoxDraft: unknown
  multiObjectGizmoActive: boolean
  componentGizmoActive: boolean
  componentGizmoObject: SceneObject | null | undefined
  billboardImagesLength: number
}) {
  const {
    view,
    slotIndex,
    continuousFrames,
  } = useViewportRuntime()
  const setup = getCameraSetup(view)
  const isOrtho = setup.orthographic

  return (
    <Canvas
      key={isOrtho ? 'ortho' : 'perspective'}
      className="viewport-canvas-root"
      frameloop={continuousFrames ? 'always' : 'demand'}
      dpr={[1, 2]}
      orthographic={isOrtho}
      eventSource={containerRef as React.RefObject<HTMLElement>}
      camera={{
        position: setup.position,
        zoom: setup.zoom,
        near: 0.1,
        far: 4000,
        up: setup.up,
      }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{
        pointerEvents: canvasPointerEvents ? 'auto' : 'none',
        touchAction: canvasPointerEvents ? 'none' : undefined,
      }}
      onCreated={({ camera, gl, invalidate, scene }) => {
        gl.outputColorSpace = SRGBColorSpace
        gl.toneMapping = NoToneMapping
        gl.setClearColor(0x1c1e22, 1)
        gl.shadowMap.type = PCFSoftShadowMap
        gl.shadowMap.enabled = true
        gl.shadowMap.autoUpdate = false

        // Generate procedural studio environment maps for high-quality PBR surface reflections
        const pmremGenerator = new PMREMGenerator(gl)
        const roomEnv = new RoomEnvironment()
        const envTexture = pmremGenerator.fromScene(roomEnv).texture
        scene.environment = envTexture
        roomEnv.dispose()
        pmremGenerator.dispose()

        cameraRef.current = camera
        applyOrthoCamera(view as ViewType, camera)
        // Demand frameloop: guarantee a first paint after mount / HMR remount.
        invalidate()
      }}
    >
      <ViewportScene
        view={view}
        slotIndex={slotIndex}
        isActiveViewport={isActiveViewport}
        showToolPreviews={showToolPreviews}
        containerRef={containerRef}
        enableZoom={enableZoom}
        disableMiddlePan={disableMiddlePan}
        canvasPointerEvents={canvasPointerEvents}
        objects={objects}
        selectedObjectSet={selectedObjectSet}
        selectedObjectId={selectedObjectId}
        gizmoTargetId={gizmoTargetId}
        facetExaggeration={facetExaggeration}
        showDensityHeatmap={showDensityHeatmap}
        selectionMode={selectionMode}
        viewportDisplayMode={viewportDisplayMode}
        viewportXRay={viewportXRay}
        showGrid={showGrid}
        defaultDepth={defaultDepth}
        themeId={themeId}
        meshSelection={meshSelection}
        selectionObjectIds={selectionObjectIds}
        activeTool={activeTool}
        cadPreviewSignal={cadPreviewSignal}
        primitiveBoxDraft={primitiveBoxDraft}
        multiObjectGizmoActive={multiObjectGizmoActive}
        componentGizmoActive={componentGizmoActive}
        componentGizmoObject={componentGizmoObject}
        billboardImagesLength={billboardImagesLength}
      />
    </Canvas>
  )
}

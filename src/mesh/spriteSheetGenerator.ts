export interface SpriteSheetOptions {
  frameResolution: number // e.g. 32, 64, 128
  columns: number // e.g. 6 or 8
  directionsCount: number // 1, 4, 8 directions
  fps: number
}

export interface SpriteSheetExportResult {
  dataUrl: string
  width: number
  height: number
  totalFrames: number
}

/**
 * Composites rendered animation frame data into a single 2D PNG sprite sheet
 */
export function generateSpriteSheetFromCanvasFrames(
  frameCanvasList: HTMLCanvasElement[],
  options: SpriteSheetOptions
): SpriteSheetExportResult | null {
  if (typeof document === 'undefined' || frameCanvasList.length === 0) return null

  const { frameResolution, columns } = options
  const totalFrames = frameCanvasList.length
  const rows = Math.ceil(totalFrames / columns)

  const outputWidth = columns * frameResolution
  const outputHeight = rows * frameResolution

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, outputWidth, outputHeight)

  frameCanvasList.forEach((frameCanvas, idx) => {
    const col = idx % columns
    const row = Math.floor(idx / columns)
    const x = col * frameResolution
    const y = row * frameResolution

    ctx.drawImage(frameCanvas, 0, 0, frameCanvas.width, frameCanvas.height, x, y, frameResolution, frameResolution)
  })

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: outputWidth,
    height: outputHeight,
    totalFrames,
  }
}

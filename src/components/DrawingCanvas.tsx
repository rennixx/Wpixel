'use client'

/**
 * DrawingCanvas - 2D canvas for drawing on selected regions
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Bounds, DrawingState } from '@/types/drawing'

interface DrawingCanvasProps {
  bounds: Bounds
  onComplete: (imageData: string) => void
  onCancel: () => void
}

export default function DrawingCanvas({
  bounds,
  onComplete,
  onCancel,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingState, setDrawingState] = useState<DrawingState>({
    tool: 'pencil',
    color: '#000000',
    brushSize: 5,
    isDrawing: false,
  })
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null)

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fill with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Get canvas coordinates from mouse/touch event
  const getCanvasCoordinates = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      let clientX: number, clientY: number

      if ('touches' in event) {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
      } else {
        clientX = event.clientX
        clientY = event.clientY
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    []
  )

  // Draw function
  const draw = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineWidth = drawingState.brushSize
      ctx.strokeStyle = drawingState.tool === 'eraser' ? '#ffffff' : drawingState.color
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (lastPosition) {
        ctx.beginPath()
        ctx.moveTo(lastPosition.x, lastPosition.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      setLastPosition({ x, y })
    },
    [drawingState, lastPosition]
  )

  // Mouse/Touch event handlers
  const handleStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault()
      setIsDrawing(true)
      const coords = getCanvasCoordinates(event)
      setLastPosition(coords)
      draw(coords.x, coords.y)
    },
    [getCanvasCoordinates, draw]
  )

  const handleMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault()
      if (!isDrawing) return
      const coords = getCanvasCoordinates(event)
      draw(coords.x, coords.y)
    },
    [isDrawing, getCanvasCoordinates, draw]
  )

  const handleEnd = useCallback(() => {
    setIsDrawing(false)
    setLastPosition(null)
  }, [])

  // Export drawing as base64 PNG
  const exportDrawing = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    return canvas.toDataURL('image/png')
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Handle stamp (save drawing)
  const handleStamp = useCallback(() => {
    const imageData = exportDrawing()
    if (imageData) {
      onComplete(imageData)
    }
  }, [exportDrawing, onComplete])

  // Update drawing state
  const updateDrawingState = useCallback((updates: Partial<DrawingState>) => {
    setDrawingState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Tool buttons
  const tools: Array<{ id: DrawingState['tool']; icon: string; label: string }> = [
    { id: 'pencil', icon: '✏️', label: 'Pencil' },
    { id: 'brush', icon: '🖌️', label: 'Brush' },
    { id: 'eraser', icon: '🧹', label: 'Eraser' },
  ]

  // Color presets
  const colors = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-space-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-space-900 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Draw on Earth
              </h2>
              <p className="text-gray-400 text-sm">
                Location: {bounds.center.lat.toFixed(4)}°, {bounds.center.long.toFixed(4)}°
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Canvas container */}
        <div className="p-6">
          <div className="bg-white rounded-lg overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={1024}
              height={1024}
              className="w-full h-auto cursor-crosshair touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          </div>
        </div>

        {/* Tools */}
        <div className="bg-space-900 px-6 py-4 border-t border-gray-700">
          <div className="flex flex-wrap items-center gap-6">
            {/* Tool selection */}
            <div className="flex gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => updateDrawingState({ tool: tool.id })}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    drawingState.tool === tool.id
                      ? 'bg-neon-cyan text-black font-semibold'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  title={tool.label}
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={drawingState.color}
                onChange={(e) => updateDrawingState({ color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border-2 border-gray-600"
              />
              <div className="flex gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateDrawingState({ color })}
                    className="w-8 h-8 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Brush size */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Size:</span>
              <input
                type="range"
                min="1"
                max="50"
                value={drawingState.brushSize}
                onChange={(e) => updateDrawingState({ brushSize: Number(e.target.value) })}
                className="w-24 accent-neon-cyan"
              />
              <span className="text-white text-sm w-8">{drawingState.brushSize}</span>
            </div>

            {/* Actions */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                🗑️ Clear
              </button>
              <button
                onClick={handleStamp}
                className="px-6 py-2 bg-neon-cyan hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors neon-glow"
              >
                🎨 Stamp to Globe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

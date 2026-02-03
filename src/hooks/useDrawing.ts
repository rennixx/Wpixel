'use client'

/**
 * useDrawing - Custom hook for drawing state and operations
 */

import { useState, useCallback, useRef } from 'react'
import type { DrawingState, Bounds } from '@/types/drawing'

interface UseDrawingOptions {
  onStamp?: (imageData: string, bounds: Bounds) => Promise<void>
}

export function useDrawing(options: UseDrawingOptions = {}) {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    tool: 'pencil',
    color: '#000000',
    brushSize: 5,
    isDrawing: false,
  })

  const [isStamping, setIsStamping] = useState(false)
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Update drawing state
  const updateTool = useCallback((tool: DrawingState['tool']) => {
    setDrawingState((prev) => ({ ...prev, tool }))
  }, [])

  const updateColor = useCallback((color: string) => {
    setDrawingState((prev) => ({ ...prev, color }))
  }, [])

  const updateBrushSize = useCallback((brushSize: number) => {
    setDrawingState((prev) => ({ ...prev, brushSize }))
  }, [])

  const startDrawing = useCallback(() => {
    setDrawingState((prev) => ({ ...prev, isDrawing: true }))
  }, [])

  const stopDrawing = useCallback(() => {
    setDrawingState((prev) => ({ ...prev, isDrawing: false }))
  }, [])

  // Stamp drawing to globe
  const stampDrawing = useCallback(
    async (imageData: string, bounds: Bounds) => {
      if (!options.onStamp) return

      setIsStamping(true)
      try {
        await options.onStamp(imageData, bounds)
      } finally {
        setIsStamping(false)
      }
    },
    [options.onStamp]
  )

  // Export canvas as base64
  const exportCanvas = useCallback((): string | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

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

  return {
    // State
    drawingState,
    isStamping,
    currentBounds,
    canvasRef,

    // Actions
    updateTool,
    updateColor,
    updateBrushSize,
    startDrawing,
    stopDrawing,
    stampDrawing,
    exportCanvas,
    clearCanvas,
    setCurrentBounds,
  }
}

'use client'

/**
 * StampButton - Button to finalize and stamp drawing to the globe
 */

import { useState, useCallback } from 'react'
import type { Bounds } from '@/types/drawing'

interface StampButtonProps {
  imageData: string
  bounds: Bounds
  onStamp: (imageData: string, bounds: Bounds) => Promise<void>
  disabled?: boolean
}

export default function StampButton({
  imageData,
  bounds,
  onStamp,
  disabled = false,
}: StampButtonProps) {
  const [isStamping, setIsStamping] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleStampClick = useCallback(() => {
    if (showConfirm) {
      // Proceed with stamping
      setIsStamping(true)
      onStamp(imageData, bounds)
        .finally(() => {
          setIsStamping(false)
          setShowConfirm(false)
        })
    } else {
      // Show confirmation
      setShowConfirm(true)
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }, [imageData, bounds, onStamp, showConfirm])

  return (
    <button
      onClick={handleStampClick}
      disabled={disabled || isStamping}
      className={`
        relative px-6 py-3 rounded-lg font-semibold transition-all
        ${
          disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-neon-cyan text-black hover:bg-cyan-400 neon-glow'
        }
        ${isStamping ? 'animate-pulse' : ''}
      `}
    >
      {isStamping ? (
        <>
          <span className="inline-block animate-spin mr-2">🌀</span>
          Stamping...
        </>
      ) : showConfirm ? (
        <>
          <span className="mr-2">📌</span>
          Confirm Stamp?
        </>
      ) : (
        <>
          <span className="mr-2">🎨</span>
          Stamp to Globe
        </>
      )}

      {showConfirm && !isStamping && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Click again to confirm
        </span>
      )}
    </button>
  )
}

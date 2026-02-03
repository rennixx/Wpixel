'use client'

/**
 * AIEnhanceButton - AI enhancement feature for drawings
 * Uses OpenAI API to enhance user artwork
 */

import { useState, useCallback, useEffect } from 'react'
import type { DrawingState } from '@/types/drawing'

interface AIEnhanceButtonProps {
  imageData: string
  onEnhanced: (enhancedImageData: string) => void
  disabled?: boolean
  remainingEnhancements?: number
  maxEnhancements?: number
}

export default function AIEnhanceButton({
  imageData,
  onEnhanced,
  disabled = false,
  remainingEnhancements = 3,
  maxEnhancements = 3,
}: AIEnhanceButtonProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string>('none')

  const styles = [
    { id: 'none', name: 'Natural Enhancement', icon: '✨', description: 'Refine and polish' },
    { id: 'watercolor', name: 'Watercolor', icon: '🎨', description: 'Artistic watercolor style' },
    { id: 'pixelart', name: 'Pixel Art', icon: '👾', description: 'Retro pixel aesthetics' },
    { id: 'sketch', name: 'Sketch', icon: '✏️', description: 'Professional pencil sketch' },
    { id: 'vibrant', name: 'Vibrant', icon: '🌈', description: 'Bold, saturated colors' },
  ]

  const handleEnhance = useCallback(
    async (styleId: string) => {
      if (remainingEnhancements <= 0) {
        alert('You have reached your daily enhancement limit. Upgrade to premium for more!')
        return
      }

      setIsEnhancing(true)
      setShowStylePicker(false)

      try {
        const response = await fetch('/api/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData,
            style: styleId === 'none' ? undefined : styleId,
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Fetch enhanced image and convert to base64
          const enhancedImage = await fetchImageAsBase64(data.enhancedImageUrl)
          onEnhanced(enhancedImage)
        } else {
          throw new Error(data.error || 'Enhancement failed')
        }
      } catch (error) {
        console.error('Enhancement failed:', error)
        alert('Failed to enhance image. Please try again.')
      } finally {
        setIsEnhancing(false)
      }
    },
    [imageData, onEnhanced, remainingEnhancements]
  )

  // Fetch image as base64
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={() => setShowStylePicker(!showStylePicker)}
        disabled={disabled || isEnhancing || remainingEnhancements <= 0}
        className={`
          relative px-6 py-3 rounded-lg font-semibold transition-all
          ${
            disabled || remainingEnhancements <= 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-neon-magenta text-white hover:bg-fuchsia-500 neon-glow-magenta'
          }
          ${isEnhancing ? 'animate-pulse' : ''}
        `}
      >
        {isEnhancing ? (
          <>
            <span className="inline-block animate-spin mr-2">🪄</span>
            Enhancing...
          </>
        ) : remainingEnhancements <= 0 ? (
          <>
            <span className="mr-2">🔒</span>
            Limit Reached
          </>
        ) : (
          <>
            <span className="mr-2">✨</span>
            AI Enhance
            <span className="ml-2 text-sm opacity-75">({remainingEnhancements}/{maxEnhancements})</span>
          </>
        )}
      </button>

      {/* Style picker modal */}
      {showStylePicker && !isEnhancing && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowStylePicker(false)}
          />

          {/* Modal */}
          <div className="absolute bottom-full left-0 mb-2 w-80 glass rounded-xl p-4 z-50">
            <h3 className="text-white font-bold mb-3">Choose Enhancement Style</h3>
            <div className="grid grid-cols-1 gap-2">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleEnhance(style.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition-all
                    ${
                      selectedStyle === style.id
                        ? 'bg-neon-magenta text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }
                  `}
                >
                  <span className="text-2xl">{style.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{style.name}</p>
                    <p className="text-xs opacity-75">{style.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3 text-center">
              {remainingEnhancements} enhancements remaining today
            </p>
          </div>
        </>
      )}
    </div>
  )
}

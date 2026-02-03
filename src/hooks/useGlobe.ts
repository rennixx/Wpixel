'use client'

/**
 * useGlobe - Custom hook for globe state and controls
 */

import { useState, useCallback, useRef } from 'react'
import type { CoordinateLatLong, GlobeState } from '@/types/globe'

interface UseGlobeOptions {
  onRegionSelect?: (lat: number, long: number) => void
}

export function useGlobe(options: UseGlobeOptions = {}) {
  const [globeState, setGlobeState] = useState<GlobeState>({
    isRotating: false,
    autoRotate: false,
    zoomLevel: 10,
    selectedRegion: null,
  })

  const cameraRef = useRef<THREE.Camera | null>(null)

  // Select a region on the globe
  const selectRegion = useCallback(
    (lat: number, long: number) => {
      const region: CoordinateLatLong = { lat, long }
      setGlobeState((prev) => ({ ...prev, selectedRegion: region }))
      options.onRegionSelect?.(lat, long)
    },
    [options.onRegionSelect]
  )

  // Toggle auto-rotation
  const toggleAutoRotate = useCallback(() => {
    setGlobeState((prev) => ({ ...prev, autoRotate: !prev.autoRotate }))
  }, [])

  // Set zoom level
  const setZoomLevel = useCallback((zoom: number) => {
    setGlobeState((prev) => ({ ...prev, zoomLevel: Math.max(1, Math.min(20, zoom)) }))
  }, [])

  // Clear selected region
  const clearSelection = useCallback(() => {
    setGlobeState((prev) => ({ ...prev, selectedRegion: null }))
  }, [])

  // Focus on a specific location (fly to)
  const flyTo = useCallback(
    (lat: number, long: number, zoom: number = 12) => {
      selectRegion(lat, long)
      setZoomLevel(zoom)
    },
    [selectRegion, setZoomLevel]
  )

  return {
    // State
    globeState,
    cameraRef,

    // Actions
    selectRegion,
    toggleAutoRotate,
    setZoomLevel,
    clearSelection,
    flyTo,
  }
}

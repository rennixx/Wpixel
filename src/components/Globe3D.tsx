'use client'

/**
 * Globe3D - Interactive 3D Earth Globe Component
 * Features: rotation, zoom, click detection, smooth controls
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sphere, Stars } from '@react-three/drei'
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Globe3DProps } from '@/types/globe'
import { cartesianToLatLong } from '@/lib/globe-utils'

// Earth sphere component
function EarthSphere({
  onRegionSelect,
  drawingsTexture,
}: {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { camera, raycaster, pointer } = useThree()

  // Load earth texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return loader.load('/textures/earth-8k.jpg')
  }, [])

  // Create material with optional drawings overlay
  const material = useMemo(() => {
    if (drawingsTexture) {
      // Blend earth texture with drawings
      return new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        roughness: 0.6,
        metalness: 0.1,
      })
    }
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
    })
  }, [texture, drawingsTexture])

  // Handle mouse move for hover effect
  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      setHovered(true)
    },
    []
  )

  const handlePointerOut = useCallback(() => {
    setHovered(false)
  }, [])

  // Handle click to select region
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()

      if (!meshRef.current || !onRegionSelect) return

      // Get intersection point
      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects.length > 0) {
        const point = intersects[0].point
        const { lat, long } = cartesianToLatLong(point.x, point.y, point.z, 5)
        onRegionSelect(lat, long)
      }
    },
    [onRegionSelect, raycaster]
  )

  return (
    <Sphere
      ref={meshRef}
      args={[5, 64, 64]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive object={material} attach="material" />
    </Sphere>
  )
}

// Atmosphere glow effect
function Atmosphere() {
  return (
    <Sphere args={[5.1, 64, 64]}>
      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={0.05}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  )
}

// Scene component
function Scene({
  onRegionSelect,
  drawingsTexture,
}: {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
      />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#ff00ff" />

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Earth */}
      <EarthSphere
        onRegionSelect={onRegionSelect}
        drawingsTexture={drawingsTexture}
      />

      {/* Atmosphere glow */}
      <Atmosphere />
    </>
  )
}

// Main Globe3D component
export default function Globe3D({
  onRegionSelect,
  drawingsTexture,
}: Globe3DProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    long: number
  } | null>(null)

  const handleRegionSelect = useCallback(
    (lat: number, long: number) => {
      setSelectedLocation({ lat, long })
      console.log(`Selected region: ${lat.toFixed(4)}, ${long.toFixed(4)}`)
      onRegionSelect?.(lat, long)
    },
    [onRegionSelect]
  )

  return (
    <div className="relative w-full h-screen bg-space-900">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Scene
          onRegionSelect={handleRegionSelect}
          drawingsTexture={drawingsTexture}
        />

        {/* Camera controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enablePan={false}
          minDistance={6}
          maxDistance={20}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>

      {/* Selected location indicator */}
      {selectedLocation && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-lg">
          <p className="text-neon-cyan text-sm">
            Selected: {selectedLocation.lat.toFixed(4)}°, {selectedLocation.long.toFixed(4)}°
          </p>
        </div>
      )}

      {/* Click hint */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 border-2 border-neon-cyan rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}

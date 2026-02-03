'use client'

/**
 * Globe3D - Interactive 3D Earth Globe Component
 * Google Earth-style with map/satellite/hybrid views
 * Features: rotation, zoom, click detection, smooth controls
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei'
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Globe3DProps, GlobeViewStyle, CityMarker } from '@/types/globe'
import { cartesianToLatLong, latLongToCartesian } from '@/lib/globe-utils'

// Major world cities for markers
const MAJOR_CITIES: CityMarker[] = [
  { name: 'New York', lat: 40.7128, long: -74.0060 },
  { name: 'London', lat: 51.5074, long: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, long: 139.6503 },
  { name: 'Paris', lat: 48.8566, long: 2.3522 },
  { name: 'Sydney', lat: -33.8688, long: 151.2093 },
  { name: 'Moscow', lat: 55.7558, long: 37.6173 },
  { name: 'Beijing', lat: 39.9042, long: 116.4074 },
  { name: 'Dubai', lat: 25.2048, long: 55.2708 },
  { name: 'São Paulo', lat: -23.5505, long: -46.6333 },
  { name: 'Mumbai', lat: 19.0760, long: 72.8777 },
]

// Get texture path based on view style
function getTexturePaths(viewStyle: GlobeViewStyle) {
  switch (viewStyle) {
    case 'map':
      return {
        map: '/textures/earth-map-8k.jpg',        // Three.js satellite view
        normal: '/textures/earth-normal-8k.jpg',
        specular: '/textures/earth-specular-8k.jpg',
      }
    case 'satellite':
      return {
        map: '/textures/earth-daymap-8k.jpg',     // NASA Apollo 17 Blue Marble (Google Earth style)
        normal: '/textures/earth-normal-8k.jpg',
        specular: '/textures/earth-specular-8k.jpg',
      }
    case 'hybrid':
      return {
        map: '/textures/earth-daymap-8k.jpg',     // Apollo 17 with labels
        normal: '/textures/earth-normal-8k.jpg',
        specular: '/textures/earth-specular-8k.jpg',
      }
    default:
      return {
        map: '/textures/earth-daymap-8k.jpg',
        normal: '/textures/earth-normal-8k.jpg',
        specular: '/textures/earth-specular-8k.jpg',
      }
  }
}

// Get material colors for map style
function getMapStyleColors(viewStyle: GlobeViewStyle) {
  switch (viewStyle) {
    case 'map':
      return {
        ocean: 0x1a237e,      // Deep blue ocean
        land: 0xf5f5dc,       // Beige/light land
        border: 0x424242,     // Dark gray borders
        atmosphere: 0x4fc3f7, // Light blue atmosphere
        background: 0x0a0e1a, // Dark space background
      }
    case 'satellite':
      return {
        ocean: 0x0d47a1,
        land: 0x2e7d32,
        border: 0x1b5e20,
        atmosphere: 0x00bcd4,
        background: 0x000000,
      }
    case 'hybrid':
      return {
        ocean: 0x1565c0,
        land: 0x4caf50,
        border: 0x212121,
        atmosphere: 0x29b6f6,
        background: 0x0a0e1a,
      }
    default:
      return {
        ocean: 0x1a237e,
        land: 0xf5f5dc,
        border: 0x424242,
        atmosphere: 0x4fc3f7,
        background: 0x0a0e1a,
      }
  }
}

// City marker component
function CityMarker({ city, radius }: { city: CityMarker; radius: number }) {
  const position = useMemo(() => {
    const pos = latLongToCartesian(city.lat, city.long, radius + 0.05)
    return [pos.x, pos.y, pos.z] as [number, number, number]
  }, [city.lat, city.long, radius])

  return (
    <Html position={position} center distanceFactor={10}>
      <div className="city-marker">
        <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-lg shadow-neon-cyan/50"></div>
        <div className="text-xs text-white mt-1 opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap bg-black/70 px-2 py-1 rounded">
          {city.name}
        </div>
      </div>
    </Html>
  )
}

// Earth sphere component with proper async texture loading
function EarthSphere({
  onRegionSelect,
  drawingsTexture,
  viewStyle = 'map',
  showCityMarkers = true,
}: {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
  viewStyle?: GlobeViewStyle
  showCityMarkers?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [mapTexture, setMapTexture] = useState<THREE.Texture | null>(null)
  const [normalTexture, setNormalTexture] = useState<THREE.Texture | null>(null)
  const [specularTexture, setSpecularTexture] = useState<THREE.Texture | null>(null)
  const { camera, raycaster, pointer } = useThree()

  const colors = getMapStyleColors(viewStyle)
  const radius = 5

  // Load textures when viewStyle changes
  useEffect(() => {
    const texturePaths = getTexturePaths(viewStyle)
    const loader = new THREE.TextureLoader()
    let isMounted = true

    // Load main map texture
    loader.load(
      texturePaths.map,
      (texture) => {
        if (isMounted) {
          texture.colorSpace = THREE.SRGBColorSpace
          setMapTexture(texture)
        }
      },
      undefined,
      (error) => {
        console.warn(`Failed to load map texture: ${texturePaths.map}`, error)
        // Create procedural fallback
        if (isMounted) {
          const canvas = document.createElement('canvas')
          canvas.width = 2048
          canvas.height = 1024
          const ctx = canvas.getContext('2d')!

          const oceanColor = viewStyle === 'map' ? '#1a237e' : viewStyle === 'satellite' ? '#0d47a1' : '#1565c0'
          const landColor = viewStyle === 'map' ? '#e8d5b7' : viewStyle === 'satellite' ? '#2e7d32' : '#4caf50'

          ctx.fillStyle = oceanColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const continents: Array<{ points: Array<[number, number]> }> = [
            { points: [[0.05, 0.15], [0.15, 0.12], [0.22, 0.15], [0.28, 0.20], [0.30, 0.28], [0.25, 0.35], [0.20, 0.42], [0.15, 0.45], [0.10, 0.42], [0.05, 0.35]] },
            { points: [[0.22, 0.55], [0.25, 0.58], [0.28, 0.65], [0.27, 0.75], [0.24, 0.82], [0.20, 0.85], [0.17, 0.80], [0.16, 0.70], [0.17, 0.60]] },
            { points: [[0.45, 0.18], [0.50, 0.15], [0.55, 0.18], [0.52, 0.25], [0.48, 0.28], [0.45, 0.25]] },
            { points: [[0.45, 0.35], [0.52, 0.32], [0.58, 0.38], [0.60, 0.48], [0.58, 0.62], [0.52, 0.68], [0.47, 0.65], [0.44, 0.55], [0.43, 0.45]] },
            { points: [[0.55, 0.12], [0.70, 0.10], [0.85, 0.12], [0.90, 0.20], [0.88, 0.35], [0.80, 0.42], [0.70, 0.45], [0.60, 0.40], [0.55, 0.35]] },
            { points: [[0.68, 0.45], [0.72, 0.48], [0.75, 0.55], [0.72, 0.62], [0.68, 0.58]] },
            { points: [[0.80, 0.62], [0.88, 0.60], [0.92, 0.65], [0.90, 0.72], [0.85, 0.75], [0.80, 0.72]] },
            { points: [[0.88, 0.25], [0.91, 0.28], [0.90, 0.32], [0.87, 0.30]] },
            { points: [[0.46, 0.15], [0.48, 0.14], [0.49, 0.17], [0.47, 0.18]] },
          ]

          ctx.fillStyle = landColor
          continents.forEach((continent) => {
            ctx.beginPath()
            continent.points.forEach(([x, y], i) => {
              const canvasX = x * canvas.width
              const canvasY = y * canvas.height
              if (i === 0) ctx.moveTo(canvasX, canvasY)
              else ctx.lineTo(canvasX, canvasY)
            })
            ctx.closePath()
            ctx.fill()
          })

          if (viewStyle === 'map') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.lineWidth = 1
            for (let lat = -60; lat <= 60; lat += 30) {
              const y = ((lat + 90) / 180) * canvas.height
              ctx.beginPath()
              ctx.moveTo(0, y)
              ctx.lineTo(canvas.width, y)
              ctx.stroke()
            }
            for (let long = -180; long <= 180; long += 30) {
              const x = ((long + 180) / 360) * canvas.width
              ctx.beginPath()
              ctx.moveTo(x, 0)
              ctx.lineTo(x, canvas.height)
              ctx.stroke()
            }
          }

          const fallbackTexture = new THREE.CanvasTexture(canvas)
          fallbackTexture.colorSpace = THREE.SRGBColorSpace
          setMapTexture(fallbackTexture)
        }
      }
    )

    // Load normal map (optional)
    loader.load(
      texturePaths.normal,
      (texture) => {
        if (isMounted) setNormalTexture(texture)
      },
      undefined,
      () => {
        // Silently fail for normal map
      }
    )

    // Load specular map (optional)
    loader.load(
      texturePaths.specular,
      (texture) => {
        if (isMounted) setSpecularTexture(texture)
      },
      undefined,
      () => {
        // Silently fail for specular map
      }
    )

    return () => {
      isMounted = false
    }
  }, [viewStyle])

  // Create material based on view style
  const material = useMemo(() => {
    if (!mapTexture) return null

    const baseConfig = {
      roughness: viewStyle === 'map' ? 0.8 : 0.6,
      metalness: 0.0,
    }

    if (drawingsTexture) {
      return new THREE.MeshStandardMaterial({
        ...baseConfig,
        map: mapTexture,
        normalMap: normalTexture || undefined,
        normalScale: new THREE.Vector2(0.5, 0.5),
        transparent: true,
        opacity: 0.95,
      })
    }

    if (viewStyle === 'map') {
      return new THREE.MeshStandardMaterial({
        ...baseConfig,
        map: mapTexture,
        normalMap: normalTexture || undefined,
        normalScale: new THREE.Vector2(0.3, 0.3),
        color: 0xffffff,
      })
    }

    return new THREE.MeshStandardMaterial({
      ...baseConfig,
      map: mapTexture,
      normalMap: normalTexture || undefined,
      normalScale: new THREE.Vector2(0.5, 0.5),
    })
  }, [mapTexture, normalTexture, specularTexture, drawingsTexture, viewStyle])

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
        const { lat, long } = cartesianToLatLong(point.x, point.y, point.z, radius)
        onRegionSelect(lat, long)
      }
    },
    [onRegionSelect, raycaster, radius]
  )

  if (!material) {
    // Show nothing while texture loads
    return null
  }

  return (
    <group>
      <Sphere
        ref={meshRef}
        args={[radius, 64, 64]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <primitive object={material} attach="material" />
      </Sphere>

      {/* City markers for map view */}
      {showCityMarkers && viewStyle === 'map' && (
        <>
          {MAJOR_CITIES.map((city) => (
            <CityMarker key={`${city.lat}-${city.long}`} city={city} radius={radius} />
          ))}
        </>
      )}
    </group>
  )
}

// Ocean/sphere base layer (for depth)
function OceanSphere({ radius = 5, color = 0x1a237e }: { radius?: number; color?: number }) {
  return (
    <Sphere args={[radius - 0.01, 64, 64]}>
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.1}
      />
    </Sphere>
  )
}

// Atmosphere glow effect
function Atmosphere({ color = 0x4fc3f7, opacity = 0.15 }: { color?: number; opacity?: number }) {
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (innerRef.current) {
      innerRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <group>
      {/* Outer glow */}
      <Sphere args={[5.15, 64, 64]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.5}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Inner atmosphere */}
      <Sphere ref={innerRef} args={[5.05, 64, 64]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  )
}

// Grid/latitude lines (for map style)
function GridLines({ radius = 5 }: { radius?: number }) {
  const lines = useMemo(() => {
    const group: JSX.Element[] = []

    // Latitude lines every 30 degrees
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180)
      const y = radius * Math.cos(phi)
      const r = radius * Math.sin(phi)

      const points: THREE.Vector3[] = []
      for (let lng = 0; lng <= 360; lng += 5) {
        const theta = (lng * Math.PI) / 180
        const x = r * Math.sin(theta)
        const z = r * Math.cos(theta)
        points.push(new THREE.Vector3(x, y, z))
      }

      group.push(
        <line key={`lat-${lat}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" opacity={0.1} transparent />
        </line>
      )
    }

    return group
  }, [radius])

  return <group>{lines}</group>
}

// Scene component
function Scene({
  onRegionSelect,
  drawingsTexture,
  viewStyle = 'map',
  showAtmosphere = true,
  showStars = false,
}: {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
  viewStyle?: GlobeViewStyle
  showAtmosphere?: boolean
  showStars?: boolean
}) {
  const colors = getMapStyleColors(viewStyle)

  return (
    <>
      {/* Lighting - map style needs more even lighting */}
      <ambientLight intensity={viewStyle === 'map' ? 0.8 : 0.5} />

      {viewStyle === 'map' ? (
        // Map style: multiple lights for even illumination
        <>
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          <directionalLight position={[0, -5, 0]} intensity={0.2} />
        </>
      ) : (
        // Satellite style: dramatic single light
        <>
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            castShadow
          />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#ff00ff" />
        </>
      )}

      {/* Stars (only for satellite view or when enabled) */}
      {(showStars || viewStyle !== 'map') && (
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={2}
          saturation={0}
          fade
          speed={0.5}
        />
      )}

      {/* Earth */}
      {viewStyle === 'map' && <OceanSphere color={colors.ocean} />}
      <EarthSphere
        onRegionSelect={onRegionSelect}
        drawingsTexture={drawingsTexture}
        viewStyle={viewStyle}
        showCityMarkers={viewStyle === 'map'}
      />

      {/* Grid lines for map view */}
      {viewStyle === 'map' && <GridLines />}

      {/* Atmosphere glow */}
      {showAtmosphere && <Atmosphere color={colors.atmosphere} />}
    </>
  )
}

// View style toggle button component
function ViewToggle({
  currentStyle,
  onStyleChange,
}: {
  currentStyle: GlobeViewStyle
  onStyleChange: (style: GlobeViewStyle) => void
}) {
  const styles: Array<{ id: GlobeViewStyle; label: string; icon: string }> = [
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' },
    { id: 'hybrid', label: 'Hybrid', icon: '🌍' },
  ]

  return (
    <div className="absolute top-24 right-6 glass rounded-xl p-2 flex gap-1 z-20">
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => onStyleChange(style.id)}
          className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
            currentStyle === style.id
              ? 'bg-neon-cyan text-black'
              : 'text-gray-300 hover:bg-white/10'
          }`}
          title={style.label}
        >
          {style.icon} <span className="hidden sm:inline">{style.label}</span>
        </button>
      ))}
    </div>
  )
}

// Main Globe3D component
export default function Globe3D({
  onRegionSelect,
  drawingsTexture,
  viewStyle: initialViewStyle = 'map',
  showAtmosphere = true,
  showStars = false,
  autoRotate = false,
}: Globe3DProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    long: number
  } | null>(null)

  const [viewStyle, setViewStyle] = useState<GlobeViewStyle>(initialViewStyle)

  const handleRegionSelect = useCallback(
    (lat: number, long: number) => {
      setSelectedLocation({ lat, long })
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
          viewStyle={viewStyle}
          showAtmosphere={showAtmosphere}
          showStars={showStars}
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
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* View style toggle */}
      <ViewToggle currentStyle={viewStyle} onStyleChange={setViewStyle} />

      {/* Selected location indicator */}
      {selectedLocation && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-lg">
          <p className="text-neon-cyan text-sm">
            Selected: {selectedLocation.lat.toFixed(4)}°, {selectedLocation.long.toFixed(4)}°
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-gray-500 text-xs">
          Click anywhere on the globe to start drawing • Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  )
}

/**
 * Globe and 3D related types for PlanetCanvas 3D
 */

import * as THREE from 'three'

export interface Globe3DProps {
  onRegionSelect?: (lat: number, long: number) => void
  drawingsTexture?: THREE.Texture
}

export interface CoordinateUV {
  u: number
  v: number
}

export interface CoordinateLatLong {
  lat: number
  long: number
}

export interface GlobeState {
  isRotating: boolean
  autoRotate: boolean
  zoomLevel: number
  selectedRegion: CoordinateLatLong | null
}

export interface RaycastResult {
  point: THREE.Vector3
  uv: CoordinateUV
  latLong: CoordinateLatLong
}

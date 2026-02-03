/**
 * Globe utility functions for coordinate conversions and calculations
 */

import type { Bounds } from '@/types/drawing'
import type { CoordinateUV, CoordinateLatLong } from '@/types/globe'

/**
 * Convert geographic coordinates to texture UV coordinates
 * @param lat - Latitude (-90 to 90)
 * @param long - Longitude (-180 to 180)
 * @returns UV coordinates (0-1 range)
 */
export function latLongToUV(lat: number, long: number): CoordinateUV {
  const u = (long + 180) / 360
  const v = 1 - (lat + 90) / 180
  return { u, v }
}

/**
 * Convert texture UV coordinates to geographic coordinates
 * @param u - U coordinate (0-1)
 * @param v - V coordinate (0-1)
 * @returns Latitude and longitude
 */
export function uvToLatLong(u: number, v: number): CoordinateLatLong {
  const long = u * 360 - 180
  const lat = (1 - v) * 180 - 90
  return { lat, long }
}

/**
 * Convert 3D Cartesian coordinates on a sphere to latitude/longitude
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @param radius - Sphere radius (default: 5)
 * @returns Latitude and longitude
 */
export function cartesianToLatLong(
  x: number,
  y: number,
  z: number,
  radius: number = 5
): CoordinateLatLong {
  // Normalize to unit sphere
  const nx = x / radius
  const ny = y / radius
  const nz = z / radius

  // Calculate latitude using arcsin of normalized Y
  const lat = Math.asin(ny) * (180 / Math.PI)

  // Calculate longitude using atan2 of normalized X and Z
  const long = Math.atan2(nx, nz) * (180 / Math.PI)

  return { lat, long }
}

/**
 * Convert latitude/longitude to 3D Cartesian coordinates on a sphere
 * @param lat - Latitude (-90 to 90)
 * @param long - Longitude (-180 to 180)
 * @param radius - Sphere radius (default: 5)
 * @returns X, Y, Z coordinates
 */
export function latLongToCartesian(
  lat: number,
  long: number,
  radius: number = 5
): { x: number; y: number; z: number } {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (long + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return { x, y, z }
}

/**
 * Calculate bounding box for a drawing region
 * @param centerLat - Center latitude
 * @param centerLong - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box coordinates
 */
export function calculateRegionBounds(
  centerLat: number,
  centerLong: number,
  radiusKm: number
): Bounds {
  // Approximate: 1 degree of latitude = 111 km
  // 1 degree of longitude = 111 km * cos(latitude)
  const latKmPerDegree = 111
  const longKmPerDegree = 111 * Math.cos(centerLat * Math.PI / 180)

  const latDelta = radiusKm / latKmPerDegree
  const longDelta = radiusKm / longKmPerDegree

  return {
    north: Math.min(90, centerLat + latDelta),
    south: Math.max(-90, centerLat - latDelta),
    east: Math.min(180, centerLong + longDelta),
    west: Math.max(-180, centerLong - longDelta),
    center: {
      lat: centerLat,
      long: centerLong,
    },
  }
}

/**
 * Calculate distance between two points on Earth using Haversine formula
 * @param lat1 - First point latitude
 * @param long1 - First point longitude
 * @param lat2 - Second point latitude
 * @param long2 - Second point longitude
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  long1: number,
  lat2: number,
  long2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLong = toRad(long2 - long1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Convert zoom level to drawing area radius in kilometers
 * @param zoomLevel - Zoom level (1-20)
 * @returns Radius in kilometers
 */
export function zoomLevelToRadius(zoomLevel: number): number {
  const maxRadius = 500 // km at zoom level 1
  const minRadius = 10 // km at zoom level 20
  return maxRadius / Math.pow(2, zoomLevel - 1)
}

/**
 * Calculate zoom level from camera distance
 * @param distance - Camera distance from globe center
 * @param globeRadius - Globe radius
 * @returns Zoom level (1-20)
 */
export function distanceToZoomLevel(distance: number, globeRadius: number = 5): number {
  const minDistance = globeRadius + 2 // Closest zoom
  const maxDistance = globeRadius + 20 // Farthest zoom

  const normalized = (distance - minDistance) / (maxDistance - minDistance)
  return Math.max(1, Math.min(20, Math.floor(20 * (1 - normalized))))
}

/**
 * Get location name from coordinates using reverse geocoding
 * @param lat - Latitude
 * @param long - Longitude
 * @returns Promise with location name string
 */
export async function getLocationName(lat: number, long: number): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&accept-language=en`,
      {
        headers: {
          'User-Agent': 'PlanetCanvas3D',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    // Try to get city/region/country info
    const addr = data.address || {}
    const parts = []

    if (addr.city) parts.push(addr.city)
    else if (addr.town) parts.push(addr.town)
    else if (addr.village) parts.push(addr.village)
    else if (addr.county) parts.push(addr.county)

    if (addr.country) parts.push(addr.country)

    return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(2)}, ${long.toFixed(2)}`
  } catch (error) {
    console.error('Geocoding error:', error)
    return `${lat.toFixed(2)}, ${long.toFixed(2)}`
  }
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

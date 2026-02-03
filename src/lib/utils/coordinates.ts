// Coordinate conversion utilities for PlanetCanvas 3D
// Converts between geographic coordinates (lat/long) and 3D/UV coordinates

import type { Point3D, UVCoordinate, LatLong, DrawingBounds } from "../types/drawing";

/**
 * Converts latitude/longitude to 3D Cartesian coordinates
 * @param lat Latitude in degrees (-90 to +90)
 * @param long Longitude in degrees (-180 to +180)
 * @param radius Sphere radius
 * @returns 3D coordinates {x, y, z}
 */
export function latLongToXYZ(lat: number, long: number, radius: number): Point3D {
  // Convert degrees to radians
  const latRad = (lat * Math.PI) / 180;
  const longRad = (long * Math.PI) / 180;

  // Spherical to Cartesian conversion
  // Note: In Three.js, Y is up, so we adjust accordingly
  const x = radius * Math.cos(latRad) * Math.sin(longRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(longRad);

  return { x, y, z };
}

/**
 * Converts latitude/longitude to UV texture coordinates
 * @param lat Latitude in degrees (-90 to +90)
 * @param long Longitude in degrees (-180 to +180)
 * @returns UV coordinates (0-1 range), (0,0) = top-left, (1,1) = bottom-right
 */
export function latLongToUV(lat: number, long: number): UVCoordinate {
  // Normalize longitude to 0-1 range (0 = -180°, 1 = +180°)
  const u = (long + 180) / 360;

  // Normalize latitude to 0-1 range (0 = +90°, 1 = -90°)
  // Note: UV y-axis is inverted (0 = top = north pole)
  const v = (90 - lat) / 180;

  return { u, v };
}

/**
 * Converts 3D Cartesian coordinates back to latitude/longitude
 * @param x X coordinate
 * @param y Y coordinate
 * @param z Z coordinate
 * @param radius Sphere radius
 * @returns Latitude and longitude in degrees
 */
export function xyzToLatLong(x: number, y: number, z: number, radius: number): LatLong {
  // Normalize coordinates
  const nx = x / radius;
  const ny = y / radius;
  const nz = z / radius;

  // Calculate latitude (elevation angle from XZ plane)
  const lat = Math.asin(Math.max(-1, Math.min(1, ny))) * (180 / Math.PI);

  // Calculate longitude (azimuth angle from Z axis)
  const long = Math.atan2(nx, nz) * (180 / Math.PI);

  return { lat, long };
}

/**
 * Calculates the geographic bounds for a drawing canvas based on zoom level
 * @param lat Center latitude
 * @param long Center longitude
 * @param zoomLevel Zoom level (1 = far, 10 = close)
 * @returns Geographic bounds of the drawing canvas
 */
export function calculateDrawingBounds(
  lat: number,
  long: number,
  zoomLevel: number
): DrawingBounds {
  // At zoom level 1 (far), canvas covers ~30 degrees
  // At zoom level 10 (close), canvas covers ~3 degrees
  const baseDegrees = 30;
  const degreesSpan = baseDegrees / zoomLevel;

  // Adjust for latitude (longitude degrees are smaller near poles)
  const latSpan = degreesSpan;
  const longSpan = degreesSpan / Math.cos((lat * Math.PI) / 180);

  // Calculate bounds with clamping
  const latMin = Math.max(-90, lat - latSpan / 2);
  const latMax = Math.min(90, lat + latSpan / 2);

  // Handle longitude wraparound
  let longMin = long - longSpan / 2;
  let longMax = long + longSpan / 2;

  // Normalize to -180 to 180 range
  longMin = normalizeAngle(longMin);
  longMax = normalizeAngle(longMax);

  return { latMin, latMax, longMin, longMax };
}

/**
 * Calculates the great-circle distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param long1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param long2 Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  long1: number,
  lat2: number,
  long2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLong = ((long2 - long1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Normalizes an angle to the -180 to +180 range
 * @param angle Angle in degrees
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/**
 * Converts UV coordinates back to lat/long
 * @param u U coordinate (0-1)
 * @param v V coordinate (0-1)
 * @returns Latitude and longitude
 */
export function uvToLatLong(u: number, v: number): LatLong {
  const long = u * 360 - 180;
  const lat = 90 - v * 180;
  return { lat, long };
}

/**
 * Calculates which texture tile(s) a drawing affects
 * @param bounds Drawing bounds
 * @param tilesX Number of tiles horizontally
 * @param tilesY Number of tiles vertically
 * @returns Array of affected tile coordinates
 */
export function getAffectedTiles(
  bounds: DrawingBounds,
  tilesX: number = 8,
  tilesY: number = 4
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];

  // Convert bounds to UV
  const uvMin = latLongToUV(bounds.latMax, bounds.longMin);
  const uvMax = latLongToUV(bounds.latMin, bounds.longMax);

  // Calculate tile ranges
  const tileXMin = Math.floor(uvMin.u * tilesX);
  const tileXMax = Math.floor(uvMax.u * tilesX);
  const tileYMin = Math.floor(uvMin.v * tilesY);
  const tileYMax = Math.floor(uvMax.v * tilesY);

  // Add all affected tiles
  for (let x = tileXMin; x <= tileXMax; x++) {
    for (let y = tileYMin; y <= tileYMax; y++) {
      // Handle wraparound for x
      const normalizedX = ((x % tilesX) + tilesX) % tilesX;
      const normalizedY = Math.max(0, Math.min(tilesY - 1, y));
      tiles.push({ x: normalizedX, y: normalizedY });
    }
  }

  return tiles;
}

/**
 * Gets the pixel position on a tile for given UV coordinates
 * @param u U coordinate
 * @param v V coordinate
 * @param tileWidth Tile width in pixels
 * @param tileHeight Tile height in pixels
 * @param tilesX Number of tiles horizontally
 * @param tilesY Number of tiles vertically
 * @returns Pixel position and tile coordinates
 */
export function uvToTilePixel(
  u: number,
  v: number,
  tileWidth: number = 2048,
  tileHeight: number = 2048,
  tilesX: number = 8,
  tilesY: number = 4
): { tileX: number; tileY: number; pixelX: number; pixelY: number } {
  // Calculate which tile
  const tileX = Math.floor(u * tilesX);
  const tileY = Math.floor(v * tilesY);

  // Calculate position within tile
  const localU = (u * tilesX) % 1;
  const localV = (v * tilesY) % 1;

  const pixelX = Math.floor(localU * tileWidth);
  const pixelY = Math.floor(localV * tileHeight);

  return { tileX, tileY, pixelX, pixelY };
}

// Example usage verification
if (typeof window === "undefined") {
  // Server-side verification
  console.log("Coordinate conversion tests:");
  console.log("(0°, 0°) -> XYZ:", latLongToXYZ(0, 0, 1));
  console.log("(0°, 0°) -> UV:", latLongToUV(0, 0));
  console.log("(90°, 0°) -> XYZ:", latLongToXYZ(90, 0, 1));
  console.log("Roundtrip test:", xyzToLatLong(...Object.values(latLongToXYZ(45, 90, 1)) as [number, number, number], 1));
}

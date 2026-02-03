// Texture manager for handling Earth texture tiles
// Handles loading, caching, and compositing drawings onto tiles

import type { DrawingBounds, TileInfo } from "../types/drawing";
import { latLongToUV, getAffectedTiles } from "./coordinates";

// Tile configuration
export const TILE_CONFIG = {
  tilesX: 8,
  tilesY: 4,
  tileWidth: 2048,
  tileHeight: 2048,
  totalWidth: 16384, // 8 * 2048
  totalHeight: 8192, // 4 * 2048
};

// LRU Cache for loaded tiles
class TileCache {
  private cache: Map<string, ImageData> = new Map();
  private maxSize: number;
  private accessOrder: string[] = [];

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  get(key: string): ImageData | undefined {
    const data = this.cache.get(key);
    if (data) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.accessOrder.push(key);
    }
    return data;
  }

  set(key: string, data: ImageData): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, data);
    this.accessOrder.push(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

// Singleton tile cache
const tileCache = new TileCache(10);

/**
 * Gets the tile path for given tile coordinates
 */
export function getTilePath(tileX: number, tileY: number): string {
  return `/textures/tiles/earth-tile-${tileX}-${tileY}.png`;
}

/**
 * Calculates the pixel bounds for a drawing on a tile
 */
export function calculatePixelBounds(
  bounds: DrawingBounds,
  tileX: number,
  tileY: number
): { x: number; y: number; width: number; height: number } {
  const { tileWidth, tileHeight, tilesX, tilesY } = TILE_CONFIG;

  // Calculate UV bounds
  const uvTopLeft = latLongToUV(bounds.latMax, bounds.longMin);
  const uvBottomRight = latLongToUV(bounds.latMin, bounds.longMax);

  // Calculate global pixel positions
  const globalX1 = uvTopLeft.u * (tileWidth * tilesX);
  const globalY1 = uvTopLeft.v * (tileHeight * tilesY);
  const globalX2 = uvBottomRight.u * (tileWidth * tilesX);
  const globalY2 = uvBottomRight.v * (tileHeight * tilesY);

  // Convert to tile-local coordinates
  const tileStartX = tileX * tileWidth;
  const tileStartY = tileY * tileHeight;

  const localX = Math.max(0, globalX1 - tileStartX);
  const localY = Math.max(0, globalY1 - tileStartY);
  const localWidth = Math.min(tileWidth - localX, globalX2 - globalX1);
  const localHeight = Math.min(tileHeight - localY, globalY2 - globalY1);

  return {
    x: Math.floor(localX),
    y: Math.floor(localY),
    width: Math.ceil(localWidth),
    height: Math.ceil(localHeight),
  };
}

/**
 * Calculates drawing size based on zoom level
 */
export function getDrawingSize(zoomLevel: number): number {
  // Zoom 1 (far): 256px, Zoom 10 (close): 1024px
  const baseSize = 256;
  const maxSize = 1024;
  const size = baseSize + ((maxSize - baseSize) * (zoomLevel - 1)) / 9;
  return Math.round(Math.min(maxSize, Math.max(baseSize, size)));
}

/**
 * Gets information about tiles that need updating
 */
export function getTileUpdateInfo(
  lat: number,
  long: number,
  zoomLevel: number
): TileInfo[] {
  const bounds = {
    latMin: lat - 15 / zoomLevel,
    latMax: lat + 15 / zoomLevel,
    longMin: long - 15 / zoomLevel,
    longMax: long + 15 / zoomLevel,
  };

  const affectedTiles = getAffectedTiles(
    bounds,
    TILE_CONFIG.tilesX,
    TILE_CONFIG.tilesY
  );

  return affectedTiles.map((tile) => ({
    x: tile.x,
    y: tile.y,
    path: getTilePath(tile.x, tile.y),
  }));
}

/**
 * Client-side: Loads a texture tile
 */
export async function loadTile(
  tileX: number,
  tileY: number
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = getTilePath(tileX, tileY);
  });
}

/**
 * Clears the tile cache
 */
export function clearTileCache(): void {
  tileCache.clear();
}

/**
 * Gets the current texture version (for cache invalidation)
 */
export async function getTextureVersion(): Promise<number> {
  try {
    const response = await fetch("/api/stamp");
    const data = await response.json();
    return data.currentTextureVersion || 1;
  } catch {
    return 1;
  }
}

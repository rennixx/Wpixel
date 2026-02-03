import { NextRequest, NextResponse } from "next/server";
import type { StampRequest, StampResponse } from "@/lib/types/drawing";
import {
  latLongToUV,
  calculateDrawingBounds,
  getAffectedTiles,
} from "@/lib/utils/coordinates";

// In-memory store for MVP (replace with database in production)
const stamps: Map<string, any> = new Map();
let textureVersion = 1;

// Mutex for handling concurrent stamps
let isProcessing = false;

export async function POST(request: NextRequest) {
  try {
    const body: StampRequest = await request.json();
    const { image, lat, long, zoom, userId } = body;

    // Validate input
    if (!image || lat === undefined || long === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { success: false, error: "Invalid latitude" },
        { status: 400 }
      );
    }

    if (long < -180 || long > 180) {
      return NextResponse.json(
        { success: false, error: "Invalid longitude" },
        { status: 400 }
      );
    }

    // Wait if another stamp is being processed
    while (isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    isProcessing = true;

    try {
      // Calculate affected tiles
      const bounds = calculateDrawingBounds(lat, long, zoom || 5);
      const affectedTiles = getAffectedTiles(bounds);

      // Generate stamp ID
      const stampId = `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Increment texture version
      textureVersion++;

      // Process the image and update tiles
      // In MVP, we store the stamp data for reference
      // In production, this would composite onto actual tile images
      const stampData = {
        id: stampId,
        image: image.substring(0, 100) + "...", // Store truncated for MVP
        lat,
        long,
        zoom: zoom || 5,
        userId: userId || "anonymous",
        timestamp: new Date().toISOString(),
        textureVersion,
        tilesAffected: affectedTiles.map((t) => `${t.x}-${t.y}`),
        uvPosition: latLongToUV(lat, long),
        bounds,
      };

      stamps.set(stampId, stampData);

      // Keep only last 100 stamps
      if (stamps.size > 100) {
        const oldest = stamps.keys().next().value;
        if (oldest) stamps.delete(oldest);
      }

      // Log stamp info
      console.log(`[Stamp] ID: ${stampId}, Location: ${lat.toFixed(2)}, ${long.toFixed(2)}, Tiles: ${stampData.tilesAffected.join(", ")}`);

      const response: StampResponse = {
        success: true,
        stampId,
        textureVersion,
      };

      return NextResponse.json(response);
    } finally {
      isProcessing = false;
    }
  } catch (error) {
    console.error("[Stamp Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return recent stamps for activity feed
  const recentStamps = Array.from(stamps.values())
    .slice(-50)
    .reverse()
    .map((stamp) => ({
      id: stamp.id,
      lat: stamp.lat,
      long: stamp.long,
      zoom: stamp.zoom,
      userId: stamp.userId,
      timestamp: stamp.timestamp,
      textureVersion: stamp.textureVersion,
      tileAffected: stamp.tilesAffected,
    }));

  return NextResponse.json({
    stamps: recentStamps,
    currentTextureVersion: textureVersion,
  });
}

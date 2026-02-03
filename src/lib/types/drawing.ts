// Drawing types for PlanetCanvas 3D

export interface Stamp {
  id: string;
  lat: number;
  long: number;
  zoom: number;
  userId: string;
  timestamp: Date;
  textureVersion: number;
  tileAffected: string[];
  thumbnail?: string;
  enhanced?: boolean;
}

export interface DrawingTool {
  type: "brush" | "eraser";
  size: number;
  color: string;
}

export interface Region {
  lat: number;
  long: number;
  zoom: number;
}

export interface DrawingBounds {
  latMin: number;
  latMax: number;
  longMin: number;
  longMax: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface UVCoordinate {
  u: number;
  v: number;
}

export interface LatLong {
  lat: number;
  long: number;
}

export interface ActivityItem {
  id: string;
  type: "drawing" | "enhanced" | "joined";
  lat: number;
  long: number;
  locationName?: string;
  timestamp: Date;
  userId: string;
  thumbnail?: string;
}

export interface EnhanceStyle {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}

export interface StampRequest {
  image: string; // base64
  lat: number;
  long: number;
  zoom: number;
  userId: string;
}

export interface StampResponse {
  success: boolean;
  stampId: string;
  textureVersion: number;
  error?: string;
}

export interface EnhanceRequest {
  image: string; // base64
  style: string;
}

export interface EnhanceResponse {
  success: boolean;
  enhancedImage?: string; // base64
  cost?: number;
  error?: string;
}

export interface UserState {
  id: string;
  enhancementsRemaining: number;
  stampsToday: number;
}

export interface TileInfo {
  x: number;
  y: number;
  path: string;
}

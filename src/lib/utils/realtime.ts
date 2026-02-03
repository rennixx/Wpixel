// Real-time utilities for PlanetCanvas 3D
// Handles WebSocket/Supabase connections for live updates

import type { Stamp, ActivityItem } from "../types/drawing";

// Event types for real-time updates
export type RealtimeEventType = "stamp" | "connect" | "disconnect" | "error";

export interface RealtimeEvent {
  type: RealtimeEventType;
  data?: Stamp | ActivityItem;
  error?: string;
}

export type RealtimeCallback = (event: RealtimeEvent) => void;

// Check if WebSocket server is available (set via env or defaults to disabled in dev)
const WS_ENABLED = process.env.NEXT_PUBLIC_WS_ENABLED === "true";

// Simple event emitter for real-time updates
class RealtimeManager {
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private isConnected = false;
  private connectionFailed = false;

  constructor() {
    this.listeners.set("stamp", new Set());
    this.listeners.set("connect", new Set());
    this.listeners.set("disconnect", new Set());
    this.listeners.set("error", new Set());
  }

  connect(url?: string): void {
    if (typeof window === "undefined") return;
    
    // Skip WebSocket connection if disabled or already failed permanently
    if (!WS_ENABLED || this.connectionFailed) {
      // Emit a silent disconnect for components that depend on connection status
      this.emit("disconnect", { type: "disconnect" });
      return;
    }
    
    const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionFailed = false;
        this.emit("connect", { type: "connect" });
        console.log("WebSocket connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "stamp") {
            this.emit("stamp", { type: "stamp", data: data.payload });
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit("disconnect", { type: "disconnect" });
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        // Silently handle error - will trigger onclose which handles reconnect
        this.emit("error", { type: "error", error: "WebSocket connection unavailable" });
      };
    } catch (e) {
      // Silently fail - WebSocket server not available
      this.connectionFailed = true;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      // Stop trying after max attempts - server is not available
      this.connectionFailed = true;
      console.info("WebSocket server unavailable - running in offline mode");
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  subscribe(event: RealtimeEventType, callback: RealtimeCallback): () => void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
    
    // Return unsubscribe function
    return () => {
      listeners?.delete(callback);
    };
  }

  private emit(event: RealtimeEventType, payload: RealtimeEvent): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(payload));
    }
  }

  send(type: string, data: unknown): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let realtimeManager: RealtimeManager | null = null;

export function getRealtimeManager(): RealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager();
  }
  return realtimeManager;
}

// React hook for real-time stamps
import { useEffect, useState, useCallback } from "react";

export function useRealtimeStamps(onNewStamp?: (stamp: Stamp) => void) {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const manager = getRealtimeManager();
    manager.connect();

    const unsubConnect = manager.subscribe("connect", () => {
      setIsConnected(true);
    });

    const unsubDisconnect = manager.subscribe("disconnect", () => {
      setIsConnected(false);
    });

    const unsubStamp = manager.subscribe("stamp", (event) => {
      if (event.data && "lat" in event.data) {
        const stamp = event.data as Stamp;
        setStamps((prev) => [stamp, ...prev].slice(0, 50));
        onNewStamp?.(stamp);
      }
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubStamp();
    };
  }, [onNewStamp]);

  const broadcastStamp = useCallback((stamp: Stamp) => {
    const manager = getRealtimeManager();
    manager.send("stamp", stamp);
  }, []);

  return { stamps, isConnected, broadcastStamp };
}

// Activity feed hook
export function useActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const { stamps, isConnected } = useRealtimeStamps((stamp) => {
    const activity: ActivityItem = {
      id: stamp.id,
      type: stamp.enhanced ? "enhanced" : "drawing",
      lat: stamp.lat,
      long: stamp.long,
      timestamp: stamp.timestamp,
      userId: stamp.userId,
      thumbnail: stamp.thumbnail,
    };
    setActivities((prev) => [activity, ...prev].slice(0, 50));
  });

  return { activities, isConnected, stamps };
}

// Utility function to format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// Mock data for development
export function getMockStamps(): Stamp[] {
  return [
    {
      id: "1",
      lat: 35.6762,
      long: 139.6503,
      zoom: 5,
      userId: "user1",
      timestamp: new Date(Date.now() - 2000),
      textureVersion: 1,
      tileAffected: ["5-1"],
    },
    {
      id: "2",
      lat: 48.8566,
      long: 2.3522,
      zoom: 5,
      userId: "user2",
      timestamp: new Date(Date.now() - 45000),
      textureVersion: 2,
      tileAffected: ["4-1"],
    },
    {
      id: "3",
      lat: 40.7128,
      long: -74.006,
      zoom: 5,
      userId: "user3",
      timestamp: new Date(Date.now() - 120000),
      textureVersion: 3,
      tileAffected: ["2-1"],
      enhanced: true,
    },
  ];
}

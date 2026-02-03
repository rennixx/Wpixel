"use client";

import { useState, useEffect } from "react";
import { Activity, MapPin, Sparkles, ChevronRight, X, Users } from "lucide-react";
import type { Stamp, ActivityItem } from "@/lib/types/drawing";
import { useActivityFeed, formatRelativeTime, getMockStamps } from "@/lib/utils/realtime";

interface SidebarFeedProps {
  isVisible: boolean;
  onActivityClick: (stamp: Stamp) => void;
  onClose: () => void;
}

// Location names for common coordinates (simplified reverse geocoding)
const locationNames: Record<string, string> = {
  "35.68,139.65": "Tokyo",
  "48.86,2.35": "Paris",
  "40.71,-74.01": "New York",
  "51.51,-0.13": "London",
  "-33.87,151.21": "Sydney",
  "55.76,37.62": "Moscow",
  "-22.91,-43.17": "Rio de Janeiro",
  "28.61,77.21": "New Delhi",
  "39.90,116.41": "Beijing",
  "37.57,126.98": "Seoul",
};

function getLocationName(lat: number, long: number): string {
  const key = `${lat.toFixed(2)},${long.toFixed(2)}`;
  return locationNames[key] || `${lat.toFixed(1)}°, ${long.toFixed(1)}°`;
}

export function SidebarFeed({ isVisible, onActivityClick, onClose }: SidebarFeedProps) {
  const { activities, isConnected } = useActivityFeed();
  const [mockActivities, setMockActivities] = useState<ActivityItem[]>([]);

  // Load mock data for demo
  useEffect(() => {
    const mockStamps = getMockStamps();
    const mockItems: ActivityItem[] = mockStamps.map((stamp) => ({
      id: stamp.id,
      type: stamp.enhanced ? "enhanced" : "drawing",
      lat: stamp.lat,
      long: stamp.long,
      timestamp: stamp.timestamp,
      userId: stamp.userId,
      thumbnail: stamp.thumbnail,
    }));
    setMockActivities(mockItems);
  }, []);

  // Combine real and mock activities
  const allActivities = activities.length > 0 ? activities : mockActivities;

  if (!isVisible) return null;

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-80 glass animate-slide-in z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-neon-blue" size={20} />
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-yellow-400"
              }`}
            />
            <span className="text-xs text-white/60">
              {isConnected ? "Live" : "Demo"}
            </span>
          </div>
          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-2">
        {allActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2">
            <Users size={32} />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs">Be the first to draw!</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {allActivities.map((activity, index) => (
              <li
                key={activity.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() =>
                    onActivityClick({
                      id: activity.id,
                      lat: activity.lat,
                      long: activity.long,
                      zoom: 5,
                      userId: activity.userId,
                      timestamp: activity.timestamp,
                      textureVersion: 1,
                      tileAffected: [],
                    })
                  }
                  className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 text-left group"
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "enhanced"
                        ? "bg-purple-500/20"
                        : "bg-neon-blue/20"
                    }`}
                  >
                    {activity.type === "enhanced" ? (
                      <Sparkles size={18} className="text-purple-400" />
                    ) : (
                      <MapPin size={18} className="text-neon-blue" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.type === "enhanced" ? "✨ Enhanced" : "🎨 Drawing"} in{" "}
                      {getLocationName(activity.lat, activity.long)}
                    </p>
                    <p className="text-xs text-white/50">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    className="text-white/30 group-hover:text-neon-blue transition-colors"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-4 border-t border-white/10">
        <div className="flex justify-between text-sm text-white/60">
          <span>{allActivities.length} recent stamps</span>
          <span className="text-neon-blue">View all →</span>
        </div>
      </div>
    </aside>
  );
}

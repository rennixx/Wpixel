'use client'

/**
 * ActivityFeed - Real-time activity feed sidebar
 * Shows recent drawing activity from around the world
 */

import { useEffect, useState, useRef } from 'react'
import { useActivityFeed } from '@/hooks/useRealtime'
import { formatDistance } from 'date-fns'
import type { Activity } from '@/types/drawing'
import { getLocationName } from '@/lib/globe-utils'

interface ActivityFeedProps {
  onActivityClick?: (lat: number, long: number) => void
  maxItems?: number
}

export default function ActivityFeed({
  onActivityClick,
  maxItems = 50,
}: ActivityFeedProps) {
  const { activities, isConnected } = useActivityFeed({ limit: maxItems })
  const [locationCache, setLocationCache] = useState<Map<string, string>>(new Map())
  const [autoScroll, setAutoScroll] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)

  // Disable auto-scroll when user manually scrolls
  const handleScroll = () => {
    if (feedRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current
      const isAtTop = scrollTop < 100
      setAutoScroll(isAtTop)
    }
  }

  // Auto-scroll to top when new activity arrives
  useEffect(() => {
    if (autoScroll && feedRef.current && activities.length > 0) {
      feedRef.current.scrollTop = 0
    }
  }, [activities.length, autoScroll])

  // Get location name from bounds (with caching)
  const getLocationNameCached = async (bounds?: { center: { lat: number; long: number } }): Promise<string> => {
    if (!bounds) return 'Unknown Location'

    const cacheKey = `${bounds.center.lat.toFixed(2)},${bounds.center.long.toFixed(2)}`
    if (locationCache.has(cacheKey)) {
      return locationCache.get(cacheKey)!
    }

    // Start async fetch without waiting
    getLocationName(bounds.center.lat, bounds.center.long).then((name) => {
      setLocationCache((prev) => new Map(prev).set(cacheKey, name))
    })

    return cacheKey
  }

  // Format activity message
  const formatActivityMessage = (activity: Activity): string => {
    switch (activity.action) {
      case 'drawing_created':
        return 'New drawing created'
      case 'drawing_enhanced':
        return 'AI-enhanced artwork'
      case 'drawing_deleted':
        return 'Drawing removed'
      default:
        return 'Activity update'
    }
  }

  // Get activity icon
  const getActivityIcon = (action: Activity['action']): string => {
    switch (action) {
      case 'drawing_created':
        return '🎨'
      case 'drawing_enhanced':
        return '✨'
      case 'drawing_deleted':
        return '🗑️'
      default:
        return '📌'
    }
  }

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    if (onActivityClick && activity.metadata?.location) {
      const { lat, long } = activity.metadata.location.center
      onActivityClick(lat, long)
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 glass border-l border-gray-700 flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-space-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="relative">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-neon-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan"></span>
              </span>
              Live Activity
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              Real-time updates from around the world
            </p>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </div>

      {/* Activity list */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-4xl mb-2">🌍</p>
            <p>No activity yet</p>
            <p className="text-xs mt-1">Be the first to draw!</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              icon={getActivityIcon(activity.action)}
              message={formatActivityMessage(activity)}
              isNew={index === 0}
              onClick={() => handleActivityClick(activity)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 bg-space-900">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
            autoScroll
              ? 'bg-neon-cyan text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {autoScroll ? '🔼 Auto-scroll On' : '⏸️ Auto-scroll Off'}
        </button>
      </div>
    </div>
  )
}

// Individual activity item component
interface ActivityItemProps {
  activity: Activity
  icon: string
  message: string
  isNew?: boolean
  onClick?: () => void
}

function ActivityItem({ activity, icon, message, isNew = false, onClick }: ActivityItemProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    const updateTimeAgo = () => {
      const date = new Date(activity.created_at)
      setTimeAgo(formatDistance(date, new Date(), { addSuffix: true }))
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [activity.created_at])

  return (
    <div
      onClick={onClick}
      className={`glass p-3 rounded-lg transition-all cursor-pointer hover:bg-gray-700/50 ${
        isNew ? 'ring-2 ring-neon-cyan animate-pulse-slow' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{message}</p>
          <p className="text-gray-400 text-xs mt-1">{timeAgo}</p>
          {activity.metadata?.location && (
            <p className="text-neon-cyan text-xs mt-1 truncate">
              {activity.metadata.location.center.lat.toFixed(2)}°,{' '}
              {activity.metadata.location.center.long.toFixed(2)}°
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

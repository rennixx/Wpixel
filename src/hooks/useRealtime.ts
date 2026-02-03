'use client'

/**
 * useRealtime - Custom hook for Supabase realtime subscriptions
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Drawing, Activity, Bounds } from '@/types/drawing'

interface UseRealtimeDrawingsOptions {
  enabled?: boolean
}

/**
 * Subscribe to realtime drawing updates
 */
export function useRealtimeDrawings(options: UseRealtimeDrawingsOptions = {}) {
  const { enabled = true } = options
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [latestDrawing, setLatestDrawing] = useState<Drawing | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Subscribe to new drawings
    const channel = supabase
      .channel('drawings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawings',
        },
        (payload) => {
          const newDrawing = payload.new as Drawing
          setDrawings((prev) => [newDrawing, ...prev])
          setLatestDrawing(newDrawing)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    // Fetch existing drawings on mount
    fetchDrawings()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [enabled])

  const fetchDrawings = useCallback(async () => {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setDrawings(data as Drawing[])
    }
  }, [])

  return { drawings, latestDrawing, isConnected, fetchDrawings }
}

/**
 * Subscribe to activity feed updates
 */
interface UseActivityFeedOptions {
  limit?: number
  enabled?: boolean
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { limit = 50, enabled = true } = options
  const [activities, setActivities] = useState<Activity[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return

    // Subscribe to new activities
    const channel = supabase
      .channel('activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity',
        },
        (payload) => {
          const newActivity = payload.new as Activity
          setActivities((prev) => [newActivity, ...prev].slice(0, limit))
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Fetch existing activities on mount
    fetchActivities()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, limit])

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && data) {
      setActivities(data as Activity[])
    }
  }, [limit])

  return { activities, isConnected, fetchActivities }
}

/**
 * Subscribe to regional drawings (drawings within a specific area)
 */
export function useRegionalDrawings(bounds: Bounds | null, options: UseRealtimeDrawingsOptions = {}) {
  const { enabled = true } = options
  const [regionalDrawings, setRegionalDrawings] = useState<Drawing[]>([])

  useEffect(() => {
    if (!enabled || !bounds) return

    // Fetch drawings within the bounding box
    const fetchRegionalDrawings = async () => {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRegionalDrawings(data as Drawing[])
      }
    }

    fetchRegionalDrawings()

    // Subscribe to new drawings in this region
    const channel = supabase
      .channel(`regional_drawings_${bounds.center.lat}_${bounds.center.long}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawings',
        },
        (payload) => {
          const newDrawing = payload.new as Drawing
          // Check if within bounds
          if (
            newDrawing.latitude >= bounds.south &&
            newDrawing.latitude <= bounds.north &&
            newDrawing.longitude >= bounds.west &&
            newDrawing.longitude <= bounds.east
          ) {
            setRegionalDrawings((prev) => [newDrawing, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, bounds])

  return regionalDrawings
}

/**
 * Monitor realtime connection status
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')

  useEffect(() => {
    // Check connection status periodically
    const checkConnection = () => {
      const channel = supabase
        .channel('connection_check')
        .subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            setStatus('connected')
          } else if (subStatus === 'SUBSCRIPTION_RETRY') {
            setStatus('connecting')
          } else {
            setStatus('disconnected')
          }
        })

      return channel
    }

    const channel = checkConnection()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return status
}

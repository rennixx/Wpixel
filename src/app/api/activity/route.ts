/**
 * API Route: /api/activity
 * Handles fetching and logging activity for the real-time feed
 * - GET: Fetch recent activity
 * - POST: Log new activity (usually done server-side)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const drawingId = searchParams.get('drawing_id') // Filter by specific drawing

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    let query = supabase
      .from('activity')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by drawing if specified
    if (drawingId) {
      query = query.eq('drawing_id', drawingId)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Activity fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activities: activities || [],
      count: activities?.length || 0,
    })

  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to manually log activity
export async function POST(request: NextRequest) {
  try {
    const { drawing_id, user_id, action, metadata } = await request.json()

    // Validate input
    if (!drawing_id || !user_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: drawing_id, user_id, action' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions = ['drawing_created', 'drawing_enhanced', 'drawing_deleted']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: activity, error } = await supabase
      .from('activity')
      .insert({
        drawing_id,
        user_id,
        action,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Activity creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activity,
    })

  } catch (error) {
    console.error('Activity POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

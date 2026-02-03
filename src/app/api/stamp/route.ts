/**
 * API Route: /api/stamp
 * Handles stamping drawings onto the globe
 * - Uploads image to Supabase Storage
 * - Saves metadata to Supabase database
 * - Logs activity for real-time updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserId } from '@/lib/supabase'
import type { Bounds } from '@/types/drawing'

// Rate limiting store (in production, use Redis)
const stampRateLimit = new Map<string, { count: number; resetTime: number }>()

// Helper: Check rate limit
function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const hourInMs = 60 * 60 * 1000
  const maxStampsPerHour = 10

  const userLimit = stampRateLimit.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    stampRateLimit.set(userId, {
      count: 1,
      resetTime: now + hourInMs,
    })
    return { allowed: true, remaining: maxStampsPerHour - 1 }
  }

  if (userLimit.count >= maxStampsPerHour) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: maxStampsPerHour - userLimit.count }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { imageData, bounds, userId: clientUserId } = await request.json()

    // Validate input
    if (!imageData || !bounds) {
      return NextResponse.json(
        { error: 'Missing required fields: imageData and bounds' },
        { status: 400 }
      )
    }

    // Get or create user ID
    const userId = clientUserId || (await getUserId())

    // Check rate limit
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You can stamp up to 10 drawings per hour',
          resetTime: stampRateLimit.get(userId)?.resetTime,
        },
        { status: 429 }
      )
    }

    // Validate image data
    if (!imageData.startsWith('data:image/png;base64,')) {
      return NextResponse.json(
        { error: 'Invalid image format. Only PNG images are supported' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Check image size (max 5MB)
    const sizeInMB = buffer.length / (1024 * 1024)
    if (sizeInMB > 5) {
      return NextResponse.json(
        { error: 'Image size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Initialize Supabase client with service role key for storage operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = `${userId}/${timestamp}-${randomString}.png`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(filename, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('drawings')
      .getPublicUrl(filename)

    // Save to database
    const { data: drawing, error: dbError } = await supabase
      .from('drawings')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        latitude: bounds.center.lat,
        longitude: bounds.center.long,
        bounds: bounds,
        enhanced: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save drawing', details: dbError.message },
        { status: 500 }
      )
    }

    // Log activity for real-time updates
    await supabase.from('activity').insert({
      drawing_id: drawing.id,
      user_id: userId,
      action: 'drawing_created',
      metadata: { location: bounds },
    })

    // Return success response
    return NextResponse.json({
      success: true,
      drawing,
      remainingStamps: rateLimit.remaining,
    })

  } catch (error) {
    console.error('Stamp API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to stamp drawing' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch drawings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Optional location filter
    const latMin = searchParams.get('lat_min')
    latMax = searchParams.get('lat_max')
    longMin = searchParams.get('long_min')
    longMax = searchParams.get('long_max')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    let query = supabase
      .from('drawings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply location filter if provided
    if (latMin !== null) query = query.gte('latitude', parseFloat(latMin))
    if (latMax !== null) query = query.lte('latitude', parseFloat(latMax))
    if (longMin !== null) query = query.gte('longitude', parseFloat(longMin))
    if (longMax !== null) query = query.lte('longitude', parseFloat(longMax))

    const { data: drawings, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch drawings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      drawings: drawings || [],
      count: drawings?.length || 0,
    })

  } catch (error) {
    console.error('Fetch drawings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Type declarations for searchParams
declare var latMax: string | null

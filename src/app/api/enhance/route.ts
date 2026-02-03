/**
 * API Route: /api/enhance
 * Handles AI enhancement of user drawings using OpenAI DALL-E API
 * - Accepts base64 image data
 * - Calls DALL-E for enhancement
 * - Returns enhanced image URL
 * - Tracks usage for rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Rate limiting store (in production, use Redis or database)
const enhanceRateLimit = new Map<string, { count: number; resetTime: number }>()

// Style-specific prompts
const stylePrompts: Record<string, string> = {
  none: 'Enhance this drawing to make it more artistic and visually appealing while maintaining the original content and intent.',
  watercolor: 'Transform this drawing into a beautiful watercolor painting with soft edges and flowing colors.',
  pixelart: 'Convert this drawing to a high-quality pixel art style with clean, blocky pixels.',
  sketch: 'Refine this drawing into a professional pencil sketch with careful shading and detail.',
  vibrant: 'Enhance this drawing with vibrant, saturated colors and bold, dramatic lines.',
}

// Helper: Check rate limit
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetTime?: number } {
  const now = Date.now()
  const dayInMs = 24 * 60 * 60 * 1000
  const maxEnhancementsPerDay = 3

  const userLimit = enhanceRateLimit.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    enhanceRateLimit.set(userId, {
      count: 1,
      resetTime: now + dayInMs,
    })
    return { allowed: true, remaining: maxEnhancementsPerDay - 1 }
  }

  if (userLimit.count >= maxEnhancementsPerDay) {
    return { allowed: false, remaining: 0, resetTime: userLimit.resetTime }
  }

  userLimit.count++
  return { allowed: true, remaining: maxEnhancementsPerDay - userLimit.count }
}

// Helper: Generate a simple guest ID
function getGuestId(): string {
  return `guest_${Math.random().toString(36).substring(2, 15)}`
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI enhancement is not configured' },
        { status: 503 }
      )
    }

    // Parse request body
    const { imageData, style, userId: clientUserId } = await request.json()

    // Validate input
    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing required field: imageData' },
        { status: 400 }
      )
    }

    // Validate image format
    if (!imageData.startsWith('data:image/png;base64,')) {
      return NextResponse.json(
        { error: 'Invalid image format. Only PNG images are supported' },
        { status: 400 }
      )
    }

    // Get user ID
    const userId = clientUserId || getGuestId()

    // Check rate limit
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You can enhance up to 3 drawings per day',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      )
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Build enhancement prompt
    const basePrompt = stylePrompts[style || 'none'] || stylePrompts.none
    const prompt = `${basePrompt} Maintain the original subject matter and composition.`

    // For MVP, we'll use DALL-E 2 image variations with prompt editing
    // This is simpler than the edit API which requires a mask
    try {
      // Upload the image to a temporary location for OpenAI to access
      // First, save to Supabase storage
      const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const timestamp = Date.now()
      const filename = `temp/${userId}/${timestamp}.png`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(filename, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Continue with base64 approach
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drawings')
        .getPublicUrl(filename)

      // Use OpenAI's image generation with the image as reference
      // Note: DALL-E 2 Edits API requires both image and mask
      // For MVP, we'll use a simpler approach with image variations
      // In production, you would create a proper transparent mask

      // Since DALL-E 2 edits require a mask file, we'll create a simple approach
      // Use the image as input with prompt for variations
      const response = await openai.images.edit({
        image: Buffer.from(base64Data, 'base64') as unknown as File,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No enhanced image returned')
      }

      const enhancedImageUrl = response.data[0].url

      if (!enhancedImageUrl) {
        throw new Error('No enhanced image URL returned')
      }

      return NextResponse.json({
        success: true,
        enhancedImageUrl,
        remainingEnhancements: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      })

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)

      // Return detailed error
      return NextResponse.json(
        {
          error: 'AI enhancement temporarily unavailable',
          message: openaiError.message || 'Please try again later',
        },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Enhance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to enhance image' },
      { status: 500 }
    )
  }
}

// GET endpoint to check enhancement quota
export async function GET(request: NextRequest) {
  try {
    // Get user ID from query or generate guest ID
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || getGuestId()

    const userLimit = enhanceRateLimit.get(userId)
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000
    const maxEnhancementsPerDay = 3

    let remaining = maxEnhancementsPerDay
    let resetTime = now + dayInMs

    if (userLimit && now < userLimit.resetTime) {
      remaining = Math.max(0, maxEnhancementsPerDay - userLimit.count)
      resetTime = userLimit.resetTime
    }

    return NextResponse.json({
      success: true,
      remaining,
      resetTime,
      maxPerDay: maxEnhancementsPerDay,
    })

  } catch (error) {
    console.error('Enhancement quota check error:', error)
    return NextResponse.json(
      { error: 'Failed to check enhancement quota' },
      { status: 500 }
    )
  }
}

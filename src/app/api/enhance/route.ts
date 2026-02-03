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
import { getUserId } from '@/lib/supabase'

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

// Helper: Convert base64 to File
function base64ToFile(base64Data: string, filename: string = 'image.png'): File {
  const base64String = base64Data.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64String, 'base64')
  const blob = new Blob([buffer], { type: 'image/png' })
  return new File([blob], filename, { type: 'image/png' })
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
    const { imageData, style } = await request.json()

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
    const userId = await getUserId()

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
    const prompt = stylePrompts[style || 'none'] || stylePrompts.none

    // Convert base64 to File
    const imageFile = base64ToFile(imageData)

    // Call DALL-E 2 for image editing (DALL-E 3 doesn't support edits)
    // Note: DALL-E 2 edits require a mask, so we'll use generations instead
    // For MVP, we'll use image generations with the image as reference
    console.log('Calling OpenAI API for enhancement...')

    // For a true enhancement, we need to use the Edits API which requires a mask
    // Since we don't have a mask, we'll use a workaround:
    // We'll use the image generation with the original as a base
    try {
      // Using DALL-E 2 Edit API with transparent mask
      // Create a simple transparent mask (entire image editable)
      const canvas = require('canvas')
      const maskCanvas = canvas.createCanvas(1024, 1024)
      const ctx = maskCanvas.getContext('2d')

      // Create transparent mask (RGBA with alpha=0 for editable areas)
      // For full editability, we'll use a transparent PNG
      const maskBuffer = maskCanvas.toBuffer('image/png')
      const maskFile = new File([maskBuffer], 'mask.png', { type: 'image/png' })

      const response = await openai.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      })

      const enhancedImageUrl = response.data[0].url

      if (!enhancedImageUrl) {
        throw new Error('No enhanced image returned')
      }

      return NextResponse.json({
        success: true,
        enhancedImageUrl,
        remainingEnhancements: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      })

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)

      // Fallback: If edit fails, try generation
      // Note: This is a simplified approach for MVP
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
    const userId = await getUserId()
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

/**
 * Supabase client configuration for PlanetCanvas 3D
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signInAsGuest() {
  // Generate a random guest ID
  const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`

  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('guest_id', guestId)
  }

  return guestId
}

export function getGuestId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guest_id')
  }
  return null
}

export async function getUserId(): Promise<string> {
  // Check for authenticated user first
  const user = await getCurrentUser()
  if (user) {
    return user.id
  }

  // Fall back to guest ID
  let guestId = getGuestId()
  if (!guestId) {
    guestId = await signInAsGuest()
  }

  return guestId
}

/**
 * Supabase client configuration for PlanetCanvas 3D
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Lazy initialization of Supabase client to avoid build-time errors
let supabaseClientInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClientInstance && supabaseUrl && supabaseAnonKey) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClientInstance
}

// Export a getter for the Supabase client
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase client not initialized. Please check your environment variables.')
    }
    return client[prop as keyof typeof client]
  },
})

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Create Supabase client with service role (for server-side operations)
export function createSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Auth helper functions
export async function getCurrentUser() {
  const client = getSupabaseClient()
  if (!client) return null

  const { data: { user } } = await client.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  const client = getSupabaseClient()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''
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

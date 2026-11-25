import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The browser's Supabase client, configured from environment variables
 * (see .env.example). Only the public URL and the publishable (anon) key are
 * used here: both are safe in the browser. The service-role / secret key must
 * never be added to this app.
 *
 * Without these variables the app falls back to demo sign-in (no network).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/**
 * The URL hash as the page first loaded, before Supabase reads and clears it.
 * Email links land with either tokens or an error (for example an expired link) in it.
 */
export const initialAuthHash = typeof window === 'undefined' ? '' : window.location.hash

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          // Keep the session in this browser and refresh it before it expires.
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'cubeverse-auth',
          // Read the session from confirmation and reset links.
          detectSessionInUrl: true,
          // Implicit flow: email links work even when opened in another browser or device.
          flowType: 'implicit',
        },
      })
    : null

export const supabaseConfigured = supabase !== null

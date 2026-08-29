import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

if (!supabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[ReferralFlow] Supabase env vars are missing. Copy .env.example to .env.local and fill in your project URL/anon key.',
  )
}

export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage adapter using sessionStorage
// This prevents localStorage corruption issues and clears automatically on tab close
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage,
  }
})

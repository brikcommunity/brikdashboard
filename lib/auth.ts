import { supabase } from './supabase'

// Profile type for auth
export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar: string | null
  track: string | null
  cohort: string | null
  xp: number
  badges: number
  role: 'member' | 'admin' | 'mentor'
  status: 'active' | 'inactive' | 'suspended'
  bio: string | null
  skills: string[] | null
  college: string | null
  location: string | null
  socials: any
  created_at: string
  updated_at: string
}

/**
 * Sign in with username and password
 * Uses @brik.com email format internally
 */
export async function signInWithUsername(username: string, password: string) {
  try {
    // Validate username exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (profileError || !profile) {
      return { data: null, error: 'Invalid username or password' }
    }

    // Construct email format: username@brik.com
    const email = `${username.toLowerCase().trim()}@brik.com`

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { data: null, error: 'Invalid username or password' }
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Invalid username or password' }
  }
}

/**
 * Sign up with username and password
 * Creates user with @brik.com email format
 */
export async function signUpWithUsername(
  username: string,
  password: string,
  fullName: string
) {
  try {
    // Validate username format
    const usernameLower = username.toLowerCase().trim()
    if (!/^[a-z0-9_]+$/.test(usernameLower)) {
      return { data: null, error: 'Username can only contain lowercase letters, numbers, and underscores' }
    }

    if (usernameLower.length < 3 || usernameLower.length > 30) {
      return { data: null, error: 'Username must be between 3 and 30 characters' }
    }

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameLower)
      .single()

    if (existingProfile) {
      return { data: null, error: 'Username already taken' }
    }

    // Generate email: username@brik.com
    const email = `${usernameLower}@brik.com`

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: usernameLower,
          full_name: fullName,
        },
      },
    })

    if (authError) {
      return { data: null, error: authError.message }
    }

    if (!authData.user) {
      return { data: null, error: 'Failed to create user' }
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username: usernameLower,
      full_name: fullName,
      role: 'member',
      status: 'active',
    })

    if (profileError) {
      return { data: null, error: profileError.message }
    }

    return { data: authData, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create account' }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get current user from Supabase auth
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Get current user's profile from database
 */
export async function getCurrentProfile() {
  const { user, error: authError } = await getCurrentUser()
  
  if (authError || !user) {
    return { profile: null, error: authError }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { profile, error: profileError }
}

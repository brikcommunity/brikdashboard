import { supabase } from './supabase'
import type { Profile } from './auth'

/**
 * Verify current user is an admin
 */
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return { isAdmin: false, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { isAdmin: false, error: 'Profile not found' }
  }

  if (profile.role !== 'admin') {
    return { isAdmin: false, error: 'Admin access required' }
  }

  return { isAdmin: true, userId: session.user.id }
}

// ============================================
// MEMBER MANAGEMENT
// ============================================

export async function createMemberByAdmin(
  username: string,
  password: string,
  fullName: string,
  role: 'member' | 'admin' | 'mentor' = 'member',
  additionalData?: {
    track?: string
    cohort?: string
    bio?: string
    skills?: string[]
    status?: 'active' | 'inactive' | 'suspended'
  }
) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) {
      return { data: null, error: adminError || 'Admin access required' }
    }

    const usernameLower = username.toLowerCase().trim()
    if (!/^[a-z0-9_]+$/.test(usernameLower)) {
      return { data: null, error: 'Username can only contain lowercase letters, numbers, and underscores' }
    }

    if (usernameLower.length < 3 || usernameLower.length > 30) {
      return { data: null, error: 'Username must be between 3 and 30 characters' }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameLower)
      .single()

    if (existingProfile) {
      return { data: null, error: 'Username already taken' }
    }

    const email = `${usernameLower}@brik.com`
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: usernameLower, full_name: fullName },
      },
    })

    if (authError) return { data: null, error: authError.message }
    if (!authData.user) return { data: null, error: 'Failed to create user' }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username: usernameLower,
        full_name: fullName,
        role,
        status: additionalData?.status || 'active',
        track: additionalData?.track || null,
        cohort: additionalData?.cohort || null,
        bio: additionalData?.bio || null,
        skills: additionalData?.skills || null,
      }, { onConflict: 'id' })

    if (profileError) return { data: null, error: profileError.message }
    return { data: authData, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create member' }
  }
}

export async function updateMemberByAdmin(memberId: string, updates: Partial<Profile>) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: { message: adminError || 'Admin access required' } }

    const cleanUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) cleanUpdates[key] = value
    })

    const { data, error } = await supabase
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', memberId)
      .select()
      .single()

    return { data, error }
  } catch (error: any) {
    return { data: null, error: { message: error.message || 'Failed to update member' } }
  }
}

export async function updatePasswordByAdmin(memberId: string, newPassword: string) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (!newPassword || newPassword.length < 6) {
      return { data: null, error: 'Password must be at least 6 characters' }
    }

    // Get current session token for authorization
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { data: null, error: 'Not authenticated' }
    }

    // Call API route to update password
    const response = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ memberId, newPassword }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to update password' }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update password' }
  }
}

export async function deleteMemberByAdmin(memberId: string) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: { message: adminError || 'Admin access required' } }

    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', memberId)
      .select()
      .single()

    return { data, error }
  } catch (error: any) {
    return { data: null, error: { message: error.message || 'Failed to delete member' } }
  }
}

// ============================================
// ANNOUNCEMENT MANAGEMENT
// ============================================

export async function createAnnouncementByAdmin(
  title: string,
  content: string,
  tag?: string,
  imageUrl?: string
) {
  try {
    const { isAdmin, userId, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (!title?.trim()) return { data: null, error: 'Title is required' }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content?.trim() || null,
        tag: tag || null,
        image_url: imageUrl || null,
        created_by: userId,
      })
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create announcement' }
  }
}

export async function updateAnnouncementByAdmin(announcementId: string, updates: {
  title?: string
  content?: string
  tag?: string
  imageUrl?: string
}) {
  try {
    // Verify admin access
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) {
      return { data: null, error: adminError || 'Admin access required' }
    }

    // Validate announcement ID
    if (!announcementId) {
      return { data: null, error: 'Announcement ID is required' }
    }

    // Clean updates - remove undefined values
    const cleanUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        // Map imageUrl to image_url for database
        if (key === 'imageUrl') {
          cleanUpdates['image_url'] = value
        } else {
          cleanUpdates[key] = value
        }
      }
    })

    if (Object.keys(cleanUpdates).length === 0) {
      return { data: null, error: 'No updates provided' }
    }

    // Get session for API call
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    // Call API route that uses service role key to bypass RLS
    const response = await fetch('/api/admin/update-announcement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ announcementId, updates: cleanUpdates }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to update announcement' }
    }

    // Success
    return { data: result.data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update announcement' }
  }
}

export async function deleteAnnouncementByAdmin(announcementId: string) {
  try {
    // Verify admin access
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) {
      return { data: null, error: adminError || 'Admin access required' }
    }

    // Validate announcement ID
    if (!announcementId) {
      return { data: null, error: 'Announcement ID is required' }
    }

    // Get session for API call
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    // Call API route that uses service role key to bypass RLS
    const response = await fetch('/api/admin/delete-announcement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ announcementId }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to delete announcement' }
    }

    // Success
    return { data: result.data || { id: announcementId, deleted: true }, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to delete announcement' }
  }
}

// ============================================
// CALENDAR EVENT MANAGEMENT
// ============================================

export async function createEventByAdmin(
  title: string,
  date: string,
  time?: string,
  description?: string,
  type?: string,
  imageUrl?: string
) {
  try {
    const { isAdmin, userId, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (!title?.trim()) return { data: null, error: 'Title is required' }
    if (!date) return { data: null, error: 'Date is required' }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        title: title.trim(),
        date,
        time: time || null,
        description: description?.trim() || null,
        type: type || null,
        image_url: imageUrl || null,
        created_by: userId,
      })
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create event' }
  }
}

export async function updateEventByAdmin(eventId: string, updates: {
  title?: string
  date?: string
  time?: string
  description?: string
  type?: string
  image_url?: string
}) {
  try {
    // Verify admin access
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) {
      return { data: null, error: adminError || 'Admin access required' }
    }

    // Validate event ID
    if (!eventId) {
      return { data: null, error: 'Event ID is required' }
    }

    // Clean updates - remove undefined values
    const cleanUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) cleanUpdates[key] = value
    })

    if (Object.keys(cleanUpdates).length === 0) {
      return { data: null, error: 'No updates provided' }
    }

    // Get session for API call
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    // Call API route that uses service role key to bypass RLS
    const response = await fetch('/api/admin/update-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ eventId, updates: cleanUpdates }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to update event' }
    }

    // Success
    return { data: result.data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update event' }
  }
}

export async function deleteEventByAdmin(eventId: string) {
  try {
    // Verify admin access
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) {
      return { data: null, error: adminError || 'Admin access required' }
    }

    // Validate event ID
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      return { data: null, error: 'Event ID is required' }
    }

    // Get session for API call
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    // Call API route that uses service role key to bypass RLS
    const response = await fetch('/api/admin/delete-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ eventId }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to delete event' }
    }

    // Success
    return { data: result.data || { id: eventId, deleted: true }, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to delete event' }
  }
}

// ============================================
// OPPORTUNITY MANAGEMENT
// ============================================

export async function createOpportunityByAdmin(
  title: string,
  category: string,
  organization?: string,
  deadline?: string,
  location?: string,
  description?: string,
  applyLink?: string
) {
  try {
    const { isAdmin, userId, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (!title?.trim()) return { data: null, error: 'Title is required' }

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        title: title.trim(),
        category,
        organization: organization?.trim() || null,
        deadline: deadline || null,
        location: location?.trim() || null,
        description: description?.trim() || null,
        apply_link: applyLink || null,
        created_by: userId,
      })
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create opportunity' }
  }
}

export async function updateOpportunityByAdmin(opportunityId: string, updates: {
  title?: string
  category?: string
  organization?: string
  deadline?: string
  location?: string
  description?: string
  apply_link?: string
}) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    const cleanUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) cleanUpdates[key] = value
    })

    const { data, error } = await supabase
      .from('opportunities')
      .update(cleanUpdates)
      .eq('id', opportunityId)
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update opportunity' }
  }
}

export async function deleteOpportunityByAdmin(opportunityId: string) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { error: adminError || 'Admin access required' }

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', opportunityId)

    return { error: error ? error.message : null }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete opportunity' }
  }
}

// ============================================
// RESOURCE MANAGEMENT
// ============================================

export async function createResourceByAdmin(
  title: string,
  category: string,
  description?: string,
  linkUrl?: string
) {
  try {
    const { isAdmin, userId, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (!title?.trim()) return { data: null, error: 'Title is required' }

    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: title.trim(),
        category,
        description: description?.trim() || null,
        link_url: linkUrl || null,
        created_by: userId,
      })
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create resource' }
  }
}

export async function updateResourceByAdmin(resourceId: string, updates: {
  title?: string
  category?: string
  description?: string
  link_url?: string
}) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    const cleanUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) cleanUpdates[key] = value
    })

    const { data, error } = await supabase
      .from('resources')
      .update(cleanUpdates)
      .eq('id', resourceId)
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update resource' }
  }
}

export async function deleteResourceByAdmin(resourceId: string) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { error: adminError || 'Admin access required' }

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId)

    return { error: error ? error.message : null }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete resource' }
  }
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

export async function createProjectByAdmin(
  name: string,
  description?: string,
  teamName?: string,
  track?: string,
  stage?: string,
  progress: number = 0,
  featured: boolean = false
) {
  try {
    const { isAdmin, userId, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (!name?.trim()) return { data: null, error: 'Project name is required' }
    if (progress < 0 || progress > 100) return { data: null, error: 'Progress must be between 0 and 100' }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        team_name: teamName?.trim() || null,
        track: track || null,
        stage: stage || null,
        progress,
        featured,
        created_by: userId,
      })
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create project' }
  }
}

export async function updateProjectByAdmin(projectId: string, updates: {
  name?: string
  description?: string
  team_name?: string
  track?: string
  stage?: string
  progress?: number
  featured?: boolean
}) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
      return { data: null, error: 'Progress must be between 0 and 100' }
    }

    const cleanUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) cleanUpdates[key] = value
    })

    const { data, error } = await supabase
      .from('projects')
      .update(cleanUpdates)
      .eq('id', projectId)
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update project' }
  }
}

export async function deleteProjectByAdmin(projectId: string) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { error: adminError || 'Admin access required' }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    return { error: error ? error.message : null }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete project' }
  }
}

// ============================================
// LEADERBOARD MANAGEMENT
// ============================================

export async function awardXPByAdmin(userId: string, xpAmount: number) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    if (xpAmount < 0) return { data: null, error: 'XP amount must be positive' }

    // Get current XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single()

    if (!profile) return { data: null, error: 'User not found' }

    // Update XP
    const { data, error } = await supabase
      .from('profiles')
      .update({ xp: profile.xp + xpAmount })
      .eq('id', userId)
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to award XP' }
  }
}

export async function awardBadgeByAdmin(userId: string) {
  try {
    const { isAdmin, error: adminError } = await verifyAdmin()
    if (!isAdmin) return { data: null, error: adminError || 'Admin access required' }

    // Get current badges
    const { data: profile } = await supabase
      .from('profiles')
      .select('badges')
      .eq('id', userId)
      .single()

    if (!profile) return { data: null, error: 'User not found' }

    // Increment badges
    const { data, error } = await supabase
      .from('profiles')
      .update({ badges: profile.badges + 1 })
      .eq('id', userId)
      .select()
      .single()

    return { data, error: error ? error.message : null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to award badge' }
  }
}

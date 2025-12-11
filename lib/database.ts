import { supabase } from './supabase'
import { getCurrentUser } from './auth'

// Re-export Profile type from auth
export type { Profile } from './auth'

// Project types
export interface Project {
  id: string
  name: string
  team_name: string | null
  track: string | null
  stage: string | null
  description: string | null
  progress: number
  featured: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  project_id: string
  member_id: string
  role: string
  joined_at: string
}

export interface ProjectUpdate {
  id: string
  project_id: string
  author_id: string | null
  title: string
  content: string | null
  link_url: string | null
  link_text: string | null
  created_at: string
}

// Announcement types
export interface Announcement {
  id: string
  title: string
  content: string | null
  tag: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
}

// Calendar event types
export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  type: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
}

// Opportunity types
export interface Opportunity {
  id: string
  title: string
  organization: string | null
  category: string | null
  deadline: string | null
  location: string | null
  description: string | null
  apply_link: string | null
  created_by: string | null
  created_at: string
}

// Resource types
export interface Resource {
  id: string
  title: string
  description: string | null
  category: string | null
  link_url: string | null
  created_by: string | null
  created_at: string
}

// Award types
export interface Award {
  id: string
  user_id: string
  title: string
  description: string | null
  awarded_by: string | null
  created_at: string
}

// Profile functions
export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('xp', { ascending: false })
  return { data, error }
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  return { data, error }
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Project functions
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  return { data, error }
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function getProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      profiles:member_id (*)
    `)
    .eq('project_id', projectId)
  return { data, error }
}

export async function getProjectsByMember(memberId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      projects:project_id (*)
    `)
    .eq('member_id', memberId)
  
  if (error) {
    console.error("Error fetching projects by member:", error)
    return { data: null, error }
  }
  
  if (!data || data.length === 0) {
    return { data: [], error: null }
  }
  
  // Extract projects from the result
  // The projects field is nested due to the foreign key relationship
  const projects = data
    .map((pm: any) => {
      // Handle both possible structures: pm.projects (object) or direct project data
      const project = pm.projects || pm
      // Make sure we have a valid project object
      if (project && project.id) {
        return project as Project
      }
      return null
    })
    .filter((p: Project | null): p is Project => p !== null)
  
  return { data: projects, error: null }
}

export async function getProjectUpdates(projectId: string) {
  const { data, error } = await supabase
    .from('project_updates')
    .select(`
      *,
      profiles:author_id (*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createProjectUpdate(
  projectId: string,
  authorId: string,
  update: {
    title: string
    content?: string | null
    link_url?: string | null
    link_text?: string | null
  }
) {
  const { data, error } = await supabase
    .from('project_updates')
    .insert({
      project_id: projectId,
      author_id: authorId,
      title: update.title,
      content: update.content || null,
      link_url: update.link_url || null,
      link_text: update.link_text || null,
    })
    .select(`
      *,
      profiles:author_id (*)
    `)
    .single()
  return { data, error }
}

export async function addProjectMember(projectId: string, memberId: string, role: string = 'member') {
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      member_id: memberId,
      role,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single()
  return { data, error }
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('member_id', memberId)
  return { data, error }
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  return { error }
}

// Announcement functions
export async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles:created_by (*)
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single()
  return { data, error }
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)
  return { error }
}

// Calendar event functions
export async function getCalendarEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('date', { ascending: true })
  return { data, error }
}

export async function createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single()
  return { data, error }
}

export async function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
  return { error }
}

// Opportunity functions
export async function getOpportunities() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('opportunities')
    .insert(opportunity)
    .select()
    .single()
  return { data, error }
}

export async function updateOpportunity(id: string, updates: Partial<Opportunity>) {
  const { data, error } = await supabase
    .from('opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteOpportunity(id: string) {
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)
  return { error }
}

export async function getSavedOpportunities(userId: string) {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select(`
      *,
      opportunities:opportunity_id (*)
    `)
    .eq('user_id', userId)
  return { data, error }
}

export async function saveOpportunity(userId: string, opportunityId: string) {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .insert({ user_id: userId, opportunity_id: opportunityId })
  return { data, error }
}

export async function unsaveOpportunity(userId: string, opportunityId: string) {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
  return { data, error }
}

// Resource functions
export async function getResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createResource(resource: Omit<Resource, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('resources')
    .insert(resource)
    .select()
    .single()
  return { data, error }
}

export async function updateResource(id: string, updates: Partial<Resource>) {
  const { data, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteResource(id: string) {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)
  return { error }
}

// Award functions
export async function getAwards(userId?: string) {
  let query = supabase
    .from('awards')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query
  return { data, error }
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  type: 'announcement' | 'event' | 'award' | 'project' | 'opportunity' | 'system'
  title: string
  description: string | null
  link_url: string | null
  link_text: string | null
  read: boolean
  created_at: string
  metadata: any
}

// Notification functions
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return { data, error }
}

export async function getUnreadNotificationsCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  return { count: count || 0, error }
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single()
  return { data, error }
}

export async function markAllNotificationsAsRead(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .select()
  return { data, error }
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()
  return { data, error }
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
  return { error }
}

export async function createAward(award: Omit<Award, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('awards')
    .insert(award)
    .select()
    .single()
  return { data, error }
}

export async function updateAward(id: string, updates: Partial<Award>) {
  const { data, error } = await supabase
    .from('awards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteAward(id: string) {
  const { error } = await supabase
    .from('awards')
    .delete()
    .eq('id', id)
  return { error }
}


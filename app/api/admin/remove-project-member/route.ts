import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // Verify the user is authenticated with the anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { projectId, memberId } = await request.json()

    if (!projectId || !memberId) {
      return NextResponse.json({ error: 'Project ID and Member ID are required' }, { status: 400 })
    }

    // Use service role key for admin operation
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // First check if the member exists
    const { data: existingMember } = await adminClient
      .from('project_members')
      .select('project_id, member_id')
      .eq('project_id', projectId)
      .eq('member_id', memberId)
      .maybeSingle()

    if (!existingMember) {
      return NextResponse.json({ error: 'Project member not found' }, { status: 404 })
    }

    // Delete the member
    const { error } = await adminClient
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('member_id', memberId)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to remove project member' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { projectId, memberId, removed: true } })
  } catch (error: any) {
    console.error('Error in remove-project-member API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove project member' },
      { status: 500 }
    )
  }
}


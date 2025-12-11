/**
 * Script to create an admin user
 * Run with: npx tsx scripts/create-admin.ts
 */

import { supabase } from '../lib/supabase'
import { signUpWithUsername } from '../lib/auth'

async function createAdmin() {
  const username = 'admin'
  const password = 'admin123' // Change this after first login!
  const fullName = 'BRIK Admin'

  console.log('Creating admin user...')
  console.log(`Username: ${username}`)
  console.log(`Password: ${password}`)
  console.log(`Full Name: ${fullName}`)

  try {
    // Create the user
    const { data, error } = await signUpWithUsername(username, password, fullName)

    if (error) {
      console.error('Error creating user:', error)
      return
    }

    if (!data?.user) {
      console.error('Failed to create user')
      return
    }

    console.log('User created successfully!')
    console.log('User ID:', data.user.id)

    // Update role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('Error updating role:', updateError)
      return
    }

    console.log('\n✅ Admin user created successfully!')
    console.log('\n📋 Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Username: ${username}`)
    console.log(`Password: ${password}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  IMPORTANT: Change the password after first login!')
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createAdmin()


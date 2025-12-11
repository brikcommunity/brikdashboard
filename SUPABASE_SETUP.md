# Supabase Integration Setup

## ✅ Completed Setup

### 1. Database Schema
All necessary tables have been created:
- `profiles` - User profiles with username, XP, badges, etc.
- `projects` - Project information
- `project_members` - Many-to-many relationship for project members
- `project_updates` - Project updates/announcements
- `announcements` - Platform announcements
- `calendar_events` - Calendar events
- `opportunities` - Job/internship opportunities
- `saved_opportunities` - User saved opportunities
- `resources` - Learning resources
- `awards` - User awards/badges

### 2. Authentication
- Custom username/password authentication using `@brik.com` email format internally
- Users sign in with username only (email is hidden)
- Profile auto-creation trigger on user signup

### 3. Row Level Security (RLS)
- All tables have RLS enabled
- Policies configured for:
  - Public read access where appropriate
  - User-specific updates
  - Admin-only operations

### 4. Environment Variables
Created `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required for admin password changes)

**Note**: The service role key should be kept secret and only used server-side. It's required for admin features like changing user passwords.

## 📁 File Structure

```
lib/
  ├── supabase.ts          # Supabase client
  ├── auth.ts              # Authentication utilities
  └── database.ts          # Database query functions

contexts/
  └── auth-context.tsx     # Auth context provider

hooks/
  └── use-data.ts          # Data fetching hooks

components/
  └── auth/
      └── login-content.tsx # Updated login with username auth
```

## 🔐 Authentication Flow

1. **Sign Up**: User provides username, password, and full name
   - Username is validated (lowercase, alphanumeric + underscore)
   - Email created as `username@brik.com` (internal only)
   - Profile automatically created via database trigger

2. **Sign In**: User provides username and password
   - Username looked up in profiles table
   - Email constructed as `username@brik.com`
   - Supabase auth used with constructed email

## 🚀 Next Steps

1. **Test Authentication**:
   - Create a test user account
   - Verify login works
   - Check profile creation

2. **Add Sample Data** (optional):
   - Insert test announcements
   - Create sample projects
   - Add calendar events

3. **Update Remaining Components**:
   - Admin components (members, announcements, etc.)
   - Projects components
   - Profile components
   - Leaderboard components

4. **Add Features**:
   - User registration page
   - Password reset (if needed)
   - Profile editing
   - Project creation/editing

## 📝 Notes

- Email confirmation is disabled (users can sign up immediately)
- All emails use `@brik.com` domain (internal, not real emails)
- Usernames are case-insensitive (stored in lowercase)
- Profile completion is calculated based on filled fields

## 🔧 Configuration

To disable email confirmation in Supabase Dashboard:
1. Go to Authentication > Providers > Email
2. Disable "Confirm email" option

This allows users to sign up and use the platform immediately without email verification.


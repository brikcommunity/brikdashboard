"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProfileContent } from "@/components/profile/profile-content"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function ProfilePage() {
  // /profile shows the current user's editable profile
  return (
    <AuthGuard>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </AuthGuard>
  )
}

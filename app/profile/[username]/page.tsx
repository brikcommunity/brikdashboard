"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PublicProfileContent } from "@/components/profile/public-profile-content"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function ProfileUsernamePage() {
  const router = useRouter()
  const params = useParams()
  const { profile: currentUserProfile, loading } = useAuth()
  const username = params?.username as string

  // If user visits their own profile with username, redirect to /profile for editing
  useEffect(() => {
    if (!loading && currentUserProfile && username === currentUserProfile.username) {
      router.replace("/profile")
    }
  }, [loading, currentUserProfile, username, router])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!username) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Invalid profile URL</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PublicProfileContent username={username} />
    </DashboardLayout>
  )
}


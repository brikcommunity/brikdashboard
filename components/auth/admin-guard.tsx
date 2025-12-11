"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push("/login")
        return
      }

      if (profile?.role !== "admin") {
        // Not an admin, redirect to dashboard
        router.push("/")
        return
      }
    }
  }, [user, profile, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
          <p className="mt-4 text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || profile?.role !== "admin") {
    return null
  }

  // User is admin, show content
  return <>{children}</>
}


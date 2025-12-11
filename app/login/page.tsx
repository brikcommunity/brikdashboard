"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginContent } from "@/components/auth/login-content"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Already logged in, redirect to dashboard
      router.push("/")
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
          <p className="mt-4 text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If logged in, show nothing while redirecting
  if (user) {
    return null
  }

  // Not logged in, show login page
  return <LoginContent />
}

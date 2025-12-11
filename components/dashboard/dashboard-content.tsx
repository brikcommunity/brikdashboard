"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Zap, Award, CheckCircle, Calendar, ArrowRight, Bookmark, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAnnouncements, useCalendarEvents } from "@/hooks/use-data"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function DashboardContent() {
  const { profile, loading: profileLoading } = useAuth()
  const { data: announcements, loading: announcementsLoading } = useAnnouncements()
  const { data: events, loading: eventsLoading } = useCalendarEvents()

  // Get user's name or username
  const userName = profile?.full_name || profile?.username || "there"
  
  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Calculate profile completion
  const profileCompletion = profile
    ? Math.round(
        ((profile.full_name ? 20 : 0) +
          (profile.bio ? 20 : 0) +
          (profile.track ? 15 : 0) +
          (profile.cohort ? 15 : 0) +
          (profile.skills && profile.skills.length > 0 ? 15 : 0) +
          (profile.college ? 10 : 0) +
          (profile.location ? 5 : 0)) /
          100
      ) * 100
    : 0

  // Get upcoming events (next 3)
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  // Get latest announcements (3 most recent)
  const latestAnnouncements = announcements.slice(0, 3)
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
            Hi, {userName.split(" ")[0]} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Welcome back to your builder dashboard</p>
        </div>
        <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:w-auto">
          Quick Actions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#AEC6FF] sm:h-12 sm:w-12">
              <Zap className="h-5 w-5 text-[#3A5FCD] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total XP</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profile?.xp || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#E7B75F]/30 sm:h-12 sm:w-12">
              <Award className="h-5 w-5 text-[#E7B75F] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Badges</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profile?.badges || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#F7F4EB] sm:h-12 sm:w-12">
              <CheckCircle className="h-5 w-5 text-[#3A5FCD] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Profile</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profileCompletion}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#AEC6FF] sm:h-12 sm:w-12">
              <Calendar className="h-5 w-5 text-[#3A5FCD] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Events</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{upcomingEvents.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Announcements */}
        <div className="lg:col-span-2">
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Latest Announcements</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#3A5FCD]" asChild>
                <Link href="/announcements">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="divide-y-2 divide-border p-0">
              {announcementsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading announcements...</div>
              ) : latestAnnouncements.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No announcements yet</div>
              ) : (
                latestAnnouncements.map((announcement) => {
                  const preview = announcement.content
                    ? announcement.content.length > 100
                      ? announcement.content.substring(0, 100) + "..."
                      : announcement.content
                    : ""
                  const timeAgo = formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })

                  return (
                    <div
                      key={announcement.id}
                      className="flex items-start gap-3 p-3 transition-colors hover:bg-[#F7F4EB] sm:gap-4 sm:p-4"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium sm:text-base">{announcement.title}</h3>
                          {announcement.tag && (
                            <Badge
                              variant="outline"
                              className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-xs text-[#3A5FCD]"
                            >
                              {announcement.tag}
                            </Badge>
                          )}
                        </div>
                        {preview && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{preview}</p>}
                        <p className="mt-2 text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                {eventsLoading ? (
                  <div className="text-center text-sm text-muted-foreground">Loading events...</div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground">No upcoming events</div>
                ) : (
                  upcomingEvents.map((event) => {
                    const eventDate = new Date(event.date)
                    const month = eventDate.toLocaleString("default", { month: "short" })
                    const day = eventDate.getDate()

                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 rounded-none border-2 border-border bg-white p-2 shadow-[2px_2px_0px_0px_#1A1A1A] sm:p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border-2 border-border bg-[#3A5FCD] text-white">
                          <span className="text-xs font-bold">{day}</span>
                          <span className="text-[10px]">{month}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{event.title}</p>
                          {event.time && <p className="text-xs text-muted-foreground">{event.time}</p>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saved Opportunities - Placeholder for now */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Saved Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  <Link href="/opportunities" className="text-[#3A5FCD] hover:underline">
                    Browse opportunities
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-mono font-bold">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-3 border-2 border-border" />
                <p className="text-xs text-muted-foreground">Complete your profile to unlock more opportunities</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

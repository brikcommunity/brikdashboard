"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Megaphone,
  Briefcase,
  BookOpen,
  Users,
  Trophy,
  Calendar,
  Settings,
  ArrowRight,
  Plus,
  TrendingUp,
  Eye,
  FolderKanban,
  Loader2,
} from "lucide-react"
import { useProfiles, useAnnouncements, useCalendarEvents, useOpportunities, useResources, useProjects } from "@/hooks/use-data"
import { formatDistanceToNow } from "date-fns"

export function AdminContent() {
  // Fetch all data
  const { data: profiles, loading: profilesLoading } = useProfiles()
  const { data: announcements, loading: announcementsLoading } = useAnnouncements()
  const { data: events, loading: eventsLoading } = useCalendarEvents()
  const { data: opportunities, loading: opportunitiesLoading } = useOpportunities()
  const { data: resources, loading: resourcesLoading } = useResources()
  const { data: projects, loading: projectsLoading } = useProjects()

  const loading = profilesLoading || announcementsLoading || eventsLoading || opportunitiesLoading || resourcesLoading || projectsLoading

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const today = new Date(now.setHours(0, 0, 0, 0))

    // Count recent items (created in last 7 days)
    const recentAnnouncements = announcements.filter(a => new Date(a.created_at) >= weekAgo).length
    const recentEvents = events.filter(e => new Date(e.created_at) >= weekAgo).length
    const recentOpportunities = opportunities.filter(o => new Date(o.created_at) >= weekAgo).length
    const recentResources = resources.filter(r => new Date(r.created_at) >= weekAgo).length
    const recentMembers = profiles.filter(p => new Date(p.created_at) >= weekAgo).length
    const recentProjects = projects.filter(p => new Date(p.created_at) >= weekAgo).length

    // Count upcoming events (date >= today)
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    }).length

    // Count active members (status === 'active')
    const activeMembers = profiles.filter(p => p.status === 'active').length

    return {
      members: {
        total: profiles.length,
        active: activeMembers,
        recent: recentMembers,
      },
      announcements: {
        total: announcements.length,
        recent: recentAnnouncements,
      },
      events: {
        total: events.length,
        recent: recentEvents,
        upcoming: upcomingEvents,
      },
      opportunities: {
        total: opportunities.length,
        recent: recentOpportunities,
      },
      resources: {
        total: resources.length,
        recent: recentResources,
      },
      projects: {
        total: projects.length,
        recent: recentProjects,
      },
    }
  }, [profiles, announcements, events, opportunities, resources, projects])

  // Generate recent activity from actual data
  const recentActivity = useMemo(() => {
    const activities: Array<{
      action: string
      item: string
      user: string
      time: string
      type: "create" | "update" | "delete"
      timestamp: Date
    }> = []

    // Add announcements
    announcements.slice(0, 3).forEach(announcement => {
      activities.push({
        action: "Announcement created",
        item: announcement.title,
        user: (announcement as any).profiles?.full_name || "Admin",
        time: formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true }),
        type: "create",
        timestamp: new Date(announcement.created_at),
      })
    })

    // Add events
    events.slice(0, 2).forEach(event => {
      activities.push({
        action: "Event created",
        item: event.title,
        user: "Admin",
        time: formatDistanceToNow(new Date(event.created_at), { addSuffix: true }),
        type: "create",
        timestamp: new Date(event.created_at),
      })
    })

    // Add opportunities
    opportunities.slice(0, 2).forEach(opportunity => {
      activities.push({
        action: "Opportunity added",
        item: opportunity.title,
        user: "Admin",
        time: formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true }),
        type: "create",
        timestamp: new Date(opportunity.created_at),
      })
    })

    // Add resources
    resources.slice(0, 1).forEach(resource => {
      activities.push({
        action: "Resource added",
        item: resource.title,
        user: "Admin",
        time: formatDistanceToNow(new Date(resource.created_at), { addSuffix: true }),
        type: "create",
        timestamp: new Date(resource.created_at),
      })
    })

    // Add recent members
    const recentMembers = profiles
      .filter(p => new Date(p.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .slice(0, 2)
    recentMembers.forEach(member => {
      activities.push({
        action: "Member joined",
        item: member.full_name || member.username,
        user: "System",
        time: formatDistanceToNow(new Date(member.created_at), { addSuffix: true }),
        type: "create",
        timestamp: new Date(member.created_at),
      })
    })

    // Sort by timestamp (most recent first) and take top 5
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(({ timestamp, ...rest }) => rest)
  }, [announcements, events, opportunities, resources, profiles])

  const adminSections = [
    {
      title: "Announcements",
      description: "Create, edit, and manage announcements for all users",
      icon: Megaphone,
      href: "/admin/announcements",
      stats: { total: stats.announcements.total, recent: stats.announcements.recent },
      color: "bg-[#3A5FCD]",
    },
    {
      title: "Calendar Events",
      description: "Schedule and manage events and deadlines",
      icon: Calendar,
      href: "/admin/calendar",
      stats: { total: stats.events.total, recent: stats.events.recent },
      color: "bg-[#5C7AEA]",
    },
    {
      title: "Opportunities",
      description: "Manage internships, hackathons, grants, and job postings",
      icon: Briefcase,
      href: "/admin/opportunities",
      stats: { total: stats.opportunities.total, recent: stats.opportunities.recent },
      color: "bg-[#E7B75F]",
    },
    {
      title: "Resources",
      description: "Upload and organize resources for the community",
      icon: BookOpen,
      href: "/admin/resources",
      stats: { total: stats.resources.total, recent: stats.resources.recent },
      color: "bg-[#3A5FCD]",
    },
    {
      title: "Members",
      description: "View and manage community members and their profiles",
      icon: Users,
      href: "/admin/members",
      stats: { total: stats.members.total, recent: stats.members.recent },
      color: "bg-[#5C7AEA]",
    },
    {
      title: "Leaderboard",
      description: "Manage XP allocations and leaderboard settings",
      icon: Trophy,
      href: "/admin/leaderboard",
      stats: { total: stats.members.total, recent: 0 },
      color: "bg-[#E7B75F]",
    },
    {
      title: "Projects",
      description: "Create and manage community projects",
      icon: FolderKanban,
      href: "/admin/projects",
      stats: { total: stats.projects.total, recent: stats.projects.recent },
      color: "bg-[#5C7AEA]",
    },
  ]

  // Find next upcoming event
  const nextEvent = useMemo(() => {
    const upcoming = events
      .filter(e => {
        const eventDate = new Date(e.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= new Date(new Date().setHours(0, 0, 0, 0))
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

    if (!upcoming) return null

    const eventDate = new Date(upcoming.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return { ...upcoming, daysUntil }
  }, [events])
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Manage all aspects of the BRIK Portal</p>
        </div>
        <Button variant="outline" className="w-full border-2 shadow-[2px_2px_0px_0px_#1A1A1A] bg-transparent sm:w-auto">
          <Settings className="mr-2 h-4 w-4" />
          System Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Members</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <>
                    <p className="font-mono text-xl sm:text-2xl font-bold">{stats.members.total}</p>
                    {stats.members.recent > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3" /> +{stats.members.recent} this week
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center border-2 border-border bg-[#AEC6FF]">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#3A5FCD]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Opportunities</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <>
                    <p className="font-mono text-xl sm:text-2xl font-bold">{stats.opportunities.total}</p>
                    {stats.opportunities.recent > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3" /> +{stats.opportunities.recent} this week
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center border-2 border-border bg-[#E7B75F]/30">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-[#B8860B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Resources</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <>
                    <p className="font-mono text-xl sm:text-2xl font-bold">{stats.resources.total}</p>
                    {stats.resources.recent > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3" /> +{stats.resources.recent} this week
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center border-2 border-border bg-[#AEC6FF]">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[#3A5FCD]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Upcoming Events</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <>
                    <p className="font-mono text-xl sm:text-2xl font-bold">{stats.events.upcoming}</p>
                    {nextEvent && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Eye className="h-3 w-3" /> Next in {nextEvent.daysUntil} {nextEvent.daysUntil === 1 ? 'day' : 'days'}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center border-2 border-border bg-[#5C7AEA]/20">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#5C7AEA]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections Grid */}
      <div>
        <h2 className="font-mono text-lg font-bold mb-4">Content Management</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => (
            <Card
              key={section.title}
              className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:shadow-[6px_6px_0px_0px_#1A1A1A]"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center border-2 border-border ${section.color}`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <Link href={section.href}>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-2 shadow-[2px_2px_0px_0px_#1A1A1A] bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardTitle className="mt-2 text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          <span className="font-mono font-bold">{section.stats.total}</span>{" "}
                          <span className="text-muted-foreground">total</span>
                        </span>
                        {section.stats.recent > 0 && (
                          <span>
                            <span className="font-mono font-bold text-green-600">+{section.stats.recent}</span>{" "}
                            <span className="text-muted-foreground">new</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <Link
                    href={section.href}
                    className="flex items-center gap-1 text-sm font-medium text-[#3A5FCD] hover:underline"
                  >
                    Manage
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="font-mono">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#3A5FCD]" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {recentActivity.map((activity, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      activity.type === "create"
                        ? "bg-green-500"
                        : activity.type === "update"
                          ? "bg-[#3A5FCD]"
                          : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.item}</p>
                  </div>
                </div>
                <div className="text-right ml-5 sm:ml-0">
                  <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

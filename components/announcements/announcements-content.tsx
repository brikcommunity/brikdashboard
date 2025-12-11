"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAnnouncements } from "@/hooks/use-data"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Plus, Paperclip, ImageIcon, Upload } from "lucide-react"

const filters = ["All", "Events", "Updates", "Reminders"]

export function AnnouncementsContent() {
  const { data: announcements, loading } = useAnnouncements()
  const { profile } = useAuth()
  const [activeFilter, setActiveFilter] = useState("All")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<typeof announcements[0] | null>(null)
  const isAdmin = profile?.role === "admin"

  const filteredAnnouncements = announcements.filter((a) => {
    if (activeFilter === "All") return true
    return a.tag === activeFilter.slice(0, -1)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Stay updated with the latest news and updates
          </p>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono">Create Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter announcement title" className="border-2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">Tag</Label>
                <select id="tag" className="w-full border-2 border-border bg-white p-2">
                  <option>Event</option>
                  <option>Update</option>
                  <option>Reminder</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex h-32 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB] transition-colors hover:bg-[#AEC6FF]/20">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Click to upload image</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" placeholder="Write your announcement..." className="min-h-32 border-2" />
              </div>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]">
                Publish Announcement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            onClick={() => setActiveFilter(filter)}
            className={
              activeFilter === filter
                ? "shrink-0 border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                : "shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
            }
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Announcements Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredAnnouncements.map((announcement) => (
          <Dialog key={announcement.id}>
            <DialogTrigger asChild>
              <Card
                className="cursor-pointer border-2 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:shadow-[6px_6px_0px_0px_#1A1A1A]"
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                {announcement.image_url && (
                  <div className="relative h-40 w-full overflow-hidden border-b-2 border-border">
                    <img
                      src={announcement.image_url || "/placeholder.svg"}
                      alt={announcement.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-2 top-2">
                      <div className="flex h-6 w-6 items-center justify-center border-2 border-border bg-white">
                        <ImageIcon className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">{announcement.title}</CardTitle>
                    {announcement.tag && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]"
                      >
                        {announcement.tag}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {announcement.content
                      ? announcement.content.length > 100
                        ? announcement.content.substring(0, 100) + "..."
                        : announcement.content
                      : ""}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-mono">{announcement.title}</DialogTitle>
                  <Badge variant="outline" className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]">
                    {announcement.tag}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {announcement.image_url && (
                  <div className="overflow-hidden border-2 border-border">
                    <img
                      src={announcement.image_url || "/placeholder.svg"}
                      alt={announcement.title}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}
                {announcement.content && <p className="text-sm leading-relaxed">{announcement.content}</p>}
                <p className="text-xs text-muted-foreground">
                  Posted {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}

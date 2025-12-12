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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAnnouncements.map((announcement) => (
          <Dialog key={announcement.id}>
            <DialogTrigger asChild>
              <Card
                className="cursor-pointer border-2 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:shadow-[6px_6px_0px_0px_#1A1A1A] overflow-hidden"
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                {announcement.image_url ? (
                  <div className="relative aspect-square w-full overflow-hidden border-b-2 border-border">
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
                ) : (
                  <div className="aspect-square w-full border-b-2 border-border bg-[#F7F4EB] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No image</p>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg line-clamp-2">{announcement.title}</CardTitle>
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
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {announcement.content
                      ? announcement.content.length > 150
                        ? announcement.content.substring(0, 150) + "..."
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
            <DialogContent className="max-h-[95vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-2xl">
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
                  <div className="overflow-hidden border-2 border-border rounded-sm">
                    <img
                      src={announcement.image_url || "/placeholder.svg"}
                      alt={announcement.title}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                )}
                {announcement.content && (
                  <div className="space-y-2">
                    {(() => {
                      // Parse and display date/time info separately if it exists
                      let content = announcement.content
                      const dateRangeMatch = content.match(/Announcement runs from (.+?) to (.+?)(\n|$)/i)
                      const singleDateMatch = content.match(/Date: (.+?)(\n|$)/i)
                      const timeMatch = content.match(/Time: (.+?)(\n|$)/i)
                      
                      // Remove date/time metadata from content
                      if (dateRangeMatch) {
                        content = content.replace(/Announcement runs from .+? to .+?(\n|$)/i, '').trim()
                      } else if (singleDateMatch) {
                        content = content.replace(/Date: .+?(\n|$)/i, '').trim()
                      }
                      if (timeMatch) {
                        content = content.replace(/Time: .+?(\n|$)/i, '').trim()
                      }
                      
                      return (
                        <>
                          {(dateRangeMatch || singleDateMatch || timeMatch) && (
                            <div className="rounded-md bg-[#F7F4EB] border-2 border-border p-3 space-y-1">
                              {dateRangeMatch && (
                                <p className="text-sm font-medium">
                                  <span className="text-muted-foreground">Date:</span> {dateRangeMatch[1].trim()} - {dateRangeMatch[2].trim()}
                                </p>
                              )}
                              {singleDateMatch && !dateRangeMatch && (
                                <p className="text-sm font-medium">
                                  <span className="text-muted-foreground">Date:</span> {singleDateMatch[1].trim()}
                                </p>
                              )}
                              {timeMatch && (
                                <p className="text-sm font-medium">
                                  <span className="text-muted-foreground">Time:</span> {timeMatch[1].trim()}
                                </p>
                              )}
                            </div>
                          )}
                          {content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>}
                        </>
                      )
                    })()}
                  </div>
                )}
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

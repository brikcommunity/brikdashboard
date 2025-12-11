"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Pencil, Trash2, Upload, Search, MoreHorizontal, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
} from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"

export function AdminCalendarContent() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    type: "event" as "event" | "deadline",
    description: "",
    image_url: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      setLoading(true)
      const { data, error } = await getCalendarEvents()
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      // Error fetching events
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(
    (e) => e.title.toLowerCase().includes(search.toLowerCase()) || (e.type && e.type.toLowerCase().includes(search.toLowerCase())),
  )

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.date) {
      alert("Title and date are required")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await createCalendarEvent({
        title: formData.title,
        date: formData.date,
        time: formData.time || null,
        type: formData.type,
        description: formData.description || null,
        image_url: formData.image_url || null,
        created_by: profile?.id || null,
      })

      if (error) throw error
      await fetchEvents()
      setIsCreateOpen(false)
      setFormData({ title: "", date: "", time: "", type: "event", description: "", image_url: "" })
    } catch (error: any) {
      alert(error.message || "Failed to create event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingEvent || !formData.title.trim() || !formData.date) {
      alert("Title and date are required")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await updateCalendarEvent(editingEvent.id, {
        title: formData.title,
        date: formData.date,
        time: formData.time || null,
        type: formData.type,
        description: formData.description || null,
        image_url: formData.image_url || null,
      })

      if (error) throw error
      await fetchEvents()
      setEditingEvent(null)
      setFormData({ title: "", date: "", time: "", type: "event", description: "", image_url: "" })
    } catch (error: any) {
      alert(error.message || "Failed to update event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await deleteCalendarEvent(deleteId)
      if (error) throw error
      await fetchEvents()
      setDeleteId(null)
    } catch (error: any) {
      alert(error.message || "Failed to delete event")
    }
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time || "",
      type: (event.type as "event" | "deadline") || "event",
      description: event.description || "",
      image_url: event.image_url || "",
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Calendar Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">Schedule and manage events and deadlines</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Create Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    className="border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="border-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "event" | "deadline" })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option value="event">Event</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex h-32 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB] hover:bg-[#AEC6FF]/20 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Click to upload image</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add event details..."
                    className="min-h-24 border-2"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-2 bg-transparent">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A]"
        />
      </div>

      {/* Table */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-[#F7F4EB]">
                  <TableHead className="font-mono font-bold">Title</TableHead>
                  <TableHead className="font-mono font-bold">Type</TableHead>
                  <TableHead className="font-mono font-bold hidden sm:table-cell">Date</TableHead>
                  <TableHead className="font-mono font-bold hidden md:table-cell">Time</TableHead>
                  <TableHead className="font-mono font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading events...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No events found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id} className="border-b-2 border-border">
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          {event.image_url && <div className="h-2 w-2 bg-[#3A5FCD] rounded-full" />}
                          {event.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-2 ${
                            event.type === "deadline"
                              ? "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]"
                              : "bg-[#3A5FCD]/20 text-[#3A5FCD] border-[#3A5FCD]"
                          }`}
                        >
                          {event.type || "event"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {formatDate(event.date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{event.time || "—"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEditDialog(event)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setDeleteId(event.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <select
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "event" | "deadline" })}
                className="w-full border-2 border-border bg-white p-2"
              >
                <option value="event">Event</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image_url">Image URL</Label>
              <Input
                id="edit-image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-24 border-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEvent(null)} className="border-2 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isSubmitting}
                className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-2 bg-transparent">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

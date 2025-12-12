"use client"

import { useState, useEffect, useRef } from "react"
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
import { ArrowLeft, Plus, Pencil, Trash2, Search, MoreHorizontal, Loader2, Upload, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getCalendarEvents,
  type CalendarEvent,
} from "@/lib/database"
import { createEventByAdmin, updateEventByAdmin, deleteEventByAdmin } from "@/lib/admin"
import { formatDistanceToNow } from "date-fns"

export function AdminCalendarContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    fromDate: "",
    toDate: "",
    fromTime: "",
    toTime: "",
    type: "event" as "event" | "deadline",
    description: "",
    image_url: "",
  })

  // Ensure all form values are always strings (never undefined)
  const safeFormData = {
    title: formData.title || "",
    fromDate: formData.fromDate || "",
    toDate: formData.toDate || "",
    fromTime: formData.fromTime || "",
    toTime: formData.toTime || "",
    type: formData.type || "event",
    description: formData.description || "",
    image_url: formData.image_url || "",
  }

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

  const resetCreateForm = () => {
    setFormData({ 
      title: "", 
      fromDate: "", 
      toDate: "", 
      fromTime: "", 
      toTime: "", 
      type: "event", 
      description: "", 
      image_url: "" 
    })
    setImagePreview(null)
    setCreateError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreate = async () => {
    // Validation
    if (!safeFormData.title.trim()) {
      setCreateError("Title is required")
      return
    }
    if (!safeFormData.fromDate) {
      setCreateError("From Date is required")
      return
    }

    setIsSubmitting(true)
    setCreateError(null)
    
    try {
      // Build description with date and time range
      let description = safeFormData.description.trim()
      const dateTimeParts: string[] = []
      
      // Add date range if multi-day event
      if (safeFormData.toDate && safeFormData.toDate !== safeFormData.fromDate) {
        const fromDateStr = new Date(safeFormData.fromDate).toLocaleDateString()
        const toDateStr = new Date(safeFormData.toDate).toLocaleDateString()
        dateTimeParts.push(`Event runs from ${fromDateStr} to ${toDateStr}`)
      }
      
      // Add time range if provided
      if (safeFormData.fromTime || safeFormData.toTime) {
        if (safeFormData.fromTime && safeFormData.toTime && safeFormData.fromTime !== safeFormData.toTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime} - ${safeFormData.toTime}`)
        } else if (safeFormData.fromTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime}`)
        }
      }
      
      // Combine date/time info with description
      if (dateTimeParts.length > 0) {
        const dateTimeInfo = dateTimeParts.join('\n')
        description = description ? `${dateTimeInfo}\n\n${description}` : dateTimeInfo
      }

      // Create the event
      const { data, error } = await createEventByAdmin(
        safeFormData.title.trim(),
        safeFormData.fromDate,
        safeFormData.fromTime || undefined,
        description || undefined,
        safeFormData.type || undefined,
        safeFormData.image_url || undefined
      )

      if (error) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || "Failed to create event")
        setCreateError(errorMsg)
        setIsSubmitting(false)
        return
      }

      if (!data) {
        setCreateError("Failed to create event - no data returned")
        setIsSubmitting(false)
        return
      }

      // Success - close dialog first, then refresh events
      setIsCreateOpen(false)
      resetCreateForm()
      setIsSubmitting(false)
      
      // Refresh events list
      await fetchEvents()
    } catch (error: any) {
      setCreateError(error?.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingEvent || !safeFormData.title.trim() || !safeFormData.fromDate) {
      setEditError("Title and From Date are required")
      return
    }

    setIsSubmitting(true)
    setEditError(null)
    
    try {
      // Build description with date and time range
      let description = safeFormData.description.trim()
      const dateTimeParts: string[] = []
      
      // Add date range if multi-day event
      if (safeFormData.toDate && safeFormData.toDate !== safeFormData.fromDate) {
        const fromDateStr = new Date(safeFormData.fromDate).toLocaleDateString()
        const toDateStr = new Date(safeFormData.toDate).toLocaleDateString()
        dateTimeParts.push(`Event runs from ${fromDateStr} to ${toDateStr}`)
      }
      
      // Add time range if provided
      if (safeFormData.fromTime || safeFormData.toTime) {
        if (safeFormData.fromTime && safeFormData.toTime && safeFormData.fromTime !== safeFormData.toTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime} - ${safeFormData.toTime}`)
        } else if (safeFormData.fromTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime}`)
        }
      }
      
      if (dateTimeParts.length > 0) {
        const dateTimeInfo = dateTimeParts.join('\n')
        description = description ? `${dateTimeInfo}\n\n${description}` : dateTimeInfo
      }

      const { data, error } = await updateEventByAdmin(editingEvent.id, {
        title: safeFormData.title.trim(),
        date: safeFormData.fromDate,
        time: safeFormData.fromTime || undefined,
        description: description || undefined,
        type: safeFormData.type || undefined,
        image_url: safeFormData.image_url || undefined,
      })

      if (error) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || "Failed to update event")
        setEditError(errorMsg)
        setIsSubmitting(false)
        return
      }

      if (!data) {
        setEditError("Failed to update event - no data returned")
        setIsSubmitting(false)
        return
      }

      // Success - refresh events and close dialog
      await fetchEvents()
      setEditingEvent(null)
      setFormData({ 
        title: "", 
        fromDate: "", 
        toDate: "", 
        fromTime: "", 
        toTime: "", 
        type: "event", 
        description: "", 
        image_url: "" 
      })
      setEditImagePreview(null)
      setEditError(null)
      setIsSubmitting(false)
    } catch (error: any) {
      setEditError(error?.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    // Validate deleteId exists
    if (!deleteId) {
      setDeleteError("No event selected for deletion")
      return
    }

    // Set loading state
    setIsDeleting(true)
    setDeleteError(null)

    try {
      // Call delete function
      const result = await deleteEventByAdmin(deleteId)
      
      // Check for errors
      if (result.error) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || "Failed to delete event")
        setDeleteError(errorMsg)
        setIsDeleting(false)
        return
      }

      // Verify deletion was successful
      if (!result.data) {
        setDeleteError("Failed to delete event - no confirmation received")
        setIsDeleting(false)
        return
      }

      // Success - refresh events list
      await fetchEvents()
      
      // Close dialog and reset state
      setDeleteId(null)
      setDeleteError(null)
      setIsDeleting(false)
    } catch (error: any) {
      // Handle unexpected errors
      const errorMsg = error?.message || error?.toString() || "An unexpected error occurred"
      setDeleteError(errorMsg)
      setIsDeleting(false)
    }
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    
    // Parse date and time range from description if it exists
    let fromDate = event.date
    let toDate = ""
    let fromTime = event.time || ""
    let toTime = ""
    let description = event.description || ""
    
    // Check if description contains date range pattern
    const dateRangeMatch = description.match(/Event runs from (.+?) to (.+?)(\n|$)/)
    if (dateRangeMatch) {
      try {
        fromDate = new Date(dateRangeMatch[1]).toISOString().split('T')[0]
        toDate = new Date(dateRangeMatch[2]).toISOString().split('T')[0]
        description = description.replace(/Event runs from .+? to .+?(\n|$)/, '').trim()
      } catch {
        // If parsing fails, use original date
      }
    }
    
    // Check if description contains time range pattern
    const timeRangeMatch = description.match(/Time: (.+?)(\n|$)/)
    if (timeRangeMatch) {
      const timeStr = timeRangeMatch[1].trim()
      if (timeStr.includes(' - ')) {
        const [start, end] = timeStr.split(' - ')
        fromTime = start.trim()
        toTime = end.trim()
      } else {
        fromTime = timeStr
      }
      description = description.replace(/Time: .+?(\n|$)/, '').trim()
    }
    
    setEditImagePreview(event.image_url || null)
    setFormData({
      title: event.title || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      fromTime: fromTime || "",
      toTime: toTime || "",
      type: (event.type as "event" | "deadline") || "event",
      description: description || "",
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      if (isEdit) {
        setEditImagePreview(reader.result as string)
      } else {
        setImagePreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploadingImage(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in.')
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const { url } = await response.json()
      // Update form data with the uploaded image URL
      setFormData((prev) => ({ ...prev, image_url: url }))
    } catch (error: any) {
      // Reset preview on error
      if (isEdit) {
        setEditImagePreview(null)
      } else {
        setImagePreview(null)
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageRemove = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditImagePreview(null)
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ''
      }
    } else {
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    // Clear image URL from form data
    setFormData((prev) => ({ ...prev, image_url: "" }))
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
          <Dialog 
            open={isCreateOpen} 
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (!open) {
                // Reset form when dialog closes
                resetCreateForm()
                setIsSubmitting(false)
              }
            }}
          >
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={safeFormData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    className="border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date *</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={safeFormData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date (Optional)</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={safeFormData.toDate}
                      min={safeFormData.fromDate || undefined}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      className="border-2"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for single-day events</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromTime">From Time (Optional)</Label>
                    <Input
                      id="fromTime"
                      type="time"
                      value={safeFormData.fromTime}
                      onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toTime">To Time (Optional)</Label>
                    <Input
                      id="toTime"
                      type="time"
                      value={safeFormData.toTime}
                      min={safeFormData.fromTime || undefined}
                      onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                      className="border-2"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for single time</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      value={safeFormData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as "event" | "deadline" })}
                      className="w-full border-2 border-border bg-white p-2"
                    >
                    <option value="event">Event</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="space-y-2">
                    {imagePreview || safeFormData.image_url ? (
                      <div className="relative">
                        <img
                          src={imagePreview || safeFormData.image_url || undefined}
                          alt="Event cover"
                          className="h-48 w-full object-cover border-2 border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(false)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-red-500 text-white shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex h-32 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB] hover:bg-[#AEC6FF]/20 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          {uploadingImage ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-8 w-8" />
                              <span className="text-sm">Click to upload image</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <p className="text-xs text-muted-foreground">Max 5MB • JPEG, PNG, GIF, WebP</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={safeFormData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add event details..."
                    className="min-h-24 border-2"
                  />
                </div>
                {createError && (
                  <div className="rounded-md bg-red-50 border-2 border-red-200 p-3">
                    <p className="text-sm text-red-800">{createError}</p>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      className="border-2 bg-transparent"
                      onClick={() => setCreateError(null)}
                      disabled={isSubmitting}
                    >
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
      <Dialog 
        open={!!editingEvent} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingEvent(null)
            setFormData({ 
              title: "", 
              fromDate: "", 
              toDate: "", 
              fromTime: "", 
              toTime: "", 
              type: "event", 
              description: "", 
              image_url: "" 
            })
            setEditImagePreview(null)
            setIsSubmitting(false)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={safeFormData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fromDate">From Date *</Label>
                <Input
                  id="edit-fromDate"
                  type="date"
                  value={safeFormData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-toDate">To Date (Optional)</Label>
                <Input
                  id="edit-toDate"
                  type="date"
                  value={safeFormData.toDate}
                  min={safeFormData.fromDate || undefined}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="border-2"
                />
                <p className="text-xs text-muted-foreground">Leave empty for single-day events</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fromTime">From Time (Optional)</Label>
                <Input
                  id="edit-fromTime"
                  type="time"
                  value={safeFormData.fromTime}
                  onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-toTime">To Time (Optional)</Label>
                <Input
                  id="edit-toTime"
                  type="time"
                  value={safeFormData.toTime}
                  min={safeFormData.fromTime || undefined}
                  onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                  className="border-2"
                />
                <p className="text-xs text-muted-foreground">Leave empty for single time</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <select
                id="edit-type"
                value={safeFormData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "event" | "deadline" })}
                className="w-full border-2 border-border bg-white p-2"
              >
                <option value="event">Event</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="space-y-2">
                {editImagePreview || safeFormData.image_url ? (
                  <div className="relative">
                    <img
                      src={editImagePreview || safeFormData.image_url || undefined}
                      alt="Event cover"
                      className="h-48 w-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(true)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-red-500 text-white shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex h-32 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB] hover:bg-[#AEC6FF]/20 transition-colors"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {uploadingImage ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8" />
                          <span className="text-sm">Click to upload image</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <p className="text-xs text-muted-foreground">Max 5MB • JPEG, PNG, GIF, WebP</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={safeFormData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-24 border-2"
              />
            </div>
            {editError && (
              <div className="rounded-md bg-red-50 border-2 border-red-200 p-3">
                <p className="text-sm text-red-800">{editError}</p>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingEvent(null)
                  setFormData({ 
                    title: "", 
                    fromDate: "", 
                    toDate: "", 
                    fromTime: "", 
                    toTime: "", 
                    type: "event", 
                    description: "", 
                    image_url: "" 
                  })
                  setEditImagePreview(null)
                  setEditError(null)
                  setIsSubmitting(false)
                }} 
                className="border-2 bg-transparent"
                disabled={isSubmitting}
              >
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
      <Dialog 
        open={!!deleteId} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null)
            setDeleteError(null)
            setIsDeleting(false)
          }
        }}
      >
        <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          {deleteError && (
            <div className="rounded-md bg-red-50 border-2 border-red-200 p-3">
              <p className="text-sm text-red-800">{deleteError}</p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteId(null)
                setDeleteError(null)
                setIsDeleting(false)
              }}
              className="border-2 bg-transparent"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}




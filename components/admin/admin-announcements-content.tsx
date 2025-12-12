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
import { ArrowLeft, Plus, Pencil, Trash2, Upload, Eye, Search, MoreHorizontal, Loader2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAnnouncements, type Announcement } from "@/lib/database"
import { createAnnouncementByAdmin, updateAnnouncementByAdmin, deleteAnnouncementByAdmin } from "@/lib/admin"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"

export function AdminAnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    tag: "Event",
    content: "",
    fromDate: "",
    toDate: "",
    fromTime: "",
    toTime: "",
    image_url: "",
  })

  // Ensure all form values are always strings (never undefined)
  const safeFormData = {
    title: formData.title || "",
    tag: formData.tag || "Event",
    content: formData.content || "",
    fromDate: formData.fromDate || "",
    toDate: formData.toDate || "",
    fromTime: formData.fromTime || "",
    toTime: formData.toTime || "",
    image_url: formData.image_url || "",
  }

  // Fetch announcements from Supabase
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      setLoading(true)
      const { data, error } = await getAnnouncements()
      if (error) throw error
      setAnnouncements(data || [])
    } catch (err) {
      // Error fetching announcements
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.tag && a.tag.toLowerCase().includes(search.toLowerCase())),
  )

  const resetCreateForm = () => {
    setFormData({ 
      title: "", 
      tag: "Event", 
      content: "", 
      fromDate: "", 
      toDate: "", 
      fromTime: "", 
      toTime: "", 
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
    if (!safeFormData.content.trim()) {
      setCreateError("Content is required")
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      // Build content with date and time range
      let content = safeFormData.content.trim()
      const dateTimeParts: string[] = []
      
      // Add date range if multi-day announcement
      if (safeFormData.toDate && safeFormData.toDate !== safeFormData.fromDate) {
        const fromDateStr = new Date(safeFormData.fromDate).toLocaleDateString()
        const toDateStr = new Date(safeFormData.toDate).toLocaleDateString()
        dateTimeParts.push(`Announcement runs from ${fromDateStr} to ${toDateStr}`)
      } else if (safeFormData.fromDate) {
        dateTimeParts.push(`Date: ${new Date(safeFormData.fromDate).toLocaleDateString()}`)
      }
      
      // Add time range if provided
      if (safeFormData.fromTime || safeFormData.toTime) {
        if (safeFormData.fromTime && safeFormData.toTime && safeFormData.fromTime !== safeFormData.toTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime} - ${safeFormData.toTime}`)
        } else if (safeFormData.fromTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime}`)
        }
      }
      
      // Combine date/time info with content
      if (dateTimeParts.length > 0) {
        const dateTimeInfo = dateTimeParts.join('\n')
        content = content ? `${dateTimeInfo}\n\n${content}` : dateTimeInfo
      }

      // Create the announcement
      const { data, error } = await createAnnouncementByAdmin(
        safeFormData.title.trim(),
        content || undefined,
        safeFormData.tag || undefined,
        safeFormData.image_url || undefined
      )

      if (error) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || "Failed to create announcement")
        setCreateError(errorMsg)
        setIsCreating(false)
        return
      }

      if (!data) {
        setCreateError("Failed to create announcement - no data returned")
        setIsCreating(false)
        return
      }

      // Success - refresh announcements and reset form
      await fetchAnnouncements()
      resetCreateForm()
      setIsCreateOpen(false)
      setIsCreating(false)
    } catch (error: any) {
      setCreateError(error?.message || "An unexpected error occurred")
      setIsCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editingAnnouncement || !safeFormData.title.trim() || !safeFormData.content.trim()) {
      setEditError("Title and content are required")
      return
    }

    setIsCreating(true)
    setEditError(null)

    try {
      // Build content with date and time range
      let content = safeFormData.content.trim()
      const dateTimeParts: string[] = []
      
      // Add date range if multi-day announcement
      if (safeFormData.toDate && safeFormData.toDate !== safeFormData.fromDate) {
        const fromDateStr = new Date(safeFormData.fromDate).toLocaleDateString()
        const toDateStr = new Date(safeFormData.toDate).toLocaleDateString()
        dateTimeParts.push(`Announcement runs from ${fromDateStr} to ${toDateStr}`)
      } else if (safeFormData.fromDate) {
        dateTimeParts.push(`Date: ${new Date(safeFormData.fromDate).toLocaleDateString()}`)
      }
      
      // Add time range if provided
      if (safeFormData.fromTime || safeFormData.toTime) {
        if (safeFormData.fromTime && safeFormData.toTime && safeFormData.fromTime !== safeFormData.toTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime} - ${safeFormData.toTime}`)
        } else if (safeFormData.fromTime) {
          dateTimeParts.push(`Time: ${safeFormData.fromTime}`)
        }
      }
      
      // Combine date/time info with content
      if (dateTimeParts.length > 0) {
        const dateTimeInfo = dateTimeParts.join('\n')
        content = content ? `${dateTimeInfo}\n\n${content}` : dateTimeInfo
      }

      const { data, error } = await updateAnnouncementByAdmin(editingAnnouncement.id, {
        title: safeFormData.title.trim(),
        content: content || undefined,
        tag: safeFormData.tag || undefined,
        imageUrl: safeFormData.image_url || undefined,
      })

      if (error) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || "Failed to update announcement")
        setEditError(errorMsg)
        setIsCreating(false)
        return
      }

      if (!data) {
        setEditError("Failed to update announcement - no data returned")
        setIsCreating(false)
        return
      }

      // Success - refresh announcements and close dialog
      await fetchAnnouncements()
      setEditingAnnouncement(null)
      setFormData({ 
        title: "", 
        tag: "Event", 
        content: "", 
        fromDate: "", 
        toDate: "", 
        fromTime: "", 
        toTime: "", 
        image_url: "" 
      })
      setEditImagePreview(null)
      setEditError(null)
      setIsCreating(false)
    } catch (error: any) {
      setEditError(error?.message || "An unexpected error occurred")
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) {
      setDeleteError("No announcement selected for deletion")
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteAnnouncementByAdmin(deleteId)
      
      if (result.error) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || "Failed to delete announcement")
        setDeleteError(errorMsg)
        setIsDeleting(false)
        return
      }

      if (!result.data) {
        setDeleteError("Failed to delete announcement - no confirmation received")
        setIsDeleting(false)
        return
      }

      // Success - refresh announcements list
      await fetchAnnouncements()
      
      // Close dialog and reset state
      setDeleteId(null)
      setDeleteError(null)
      setIsDeleting(false)
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || "An unexpected error occurred"
      setDeleteError(errorMsg)
      setIsDeleting(false)
    }
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

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    
    // Parse date and time range from content if it exists
    let fromDate = ""
    let toDate = ""
    let fromTime = ""
    let toTime = ""
    let content = announcement.content || ""
    
    // Check if content contains date range pattern
    const dateRangeMatch = content.match(/Announcement runs from (.+?) to (.+?)(\n|$)/i)
    if (dateRangeMatch) {
      try {
        fromDate = new Date(dateRangeMatch[1].trim()).toISOString().split('T')[0]
        toDate = new Date(dateRangeMatch[2].trim()).toISOString().split('T')[0]
        content = content.replace(/Announcement runs from .+? to .+?(\n|$)/i, '').trim()
      } catch {
        // If parsing fails, try single date
        const singleDateMatch = content.match(/Date: (.+?)(\n|$)/i)
        if (singleDateMatch) {
          try {
            fromDate = new Date(singleDateMatch[1].trim()).toISOString().split('T')[0]
            content = content.replace(/Date: .+?(\n|$)/i, '').trim()
          } catch {
            // If parsing fails, use empty
          }
        }
      }
    } else {
      // Check for single date
      const singleDateMatch = content.match(/Date: (.+?)(\n|$)/i)
      if (singleDateMatch) {
        try {
          fromDate = new Date(singleDateMatch[1].trim()).toISOString().split('T')[0]
          content = content.replace(/Date: .+?(\n|$)/i, '').trim()
        } catch {
          // If parsing fails, use empty
        }
      }
    }
    
    // Check if content contains time range pattern
    const timeRangeMatch = content.match(/Time: (.+?)(\n|$)/i)
    if (timeRangeMatch) {
      const timeStr = timeRangeMatch[1].trim()
      if (timeStr.includes(' - ')) {
        const [start, end] = timeStr.split(' - ')
        fromTime = start.trim()
        toTime = end.trim()
      } else {
        fromTime = timeStr
      }
      content = content.replace(/Time: .+?(\n|$)/i, '').trim()
    }
    
    setEditImagePreview(announcement.image_url || null)
    setFormData({
      title: announcement.title || "",
      tag: announcement.tag || "Event",
      content: content || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      fromTime: fromTime || "",
      toTime: toTime || "",
      image_url: announcement.image_url || "",
    })
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "Event":
        return "bg-[#3A5FCD] text-white border-[#3A5FCD]"
      case "Update":
        return "bg-[#5C7AEA]/20 text-[#5C7AEA] border-[#5C7AEA]"
      case "Reminder":
        return "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]"
      default:
        return "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]"
    }
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
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Announcements Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create, edit, and manage all announcements</p>
          </div>
          <Dialog 
            open={isCreateOpen} 
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (!open) {
                resetCreateForm()
                setIsCreating(false)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={safeFormData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    className="border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag">Tag</Label>
                    <select
                      id="tag"
                      value={safeFormData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="w-full border-2 border-border bg-white p-2"
                    >
                      <option>Event</option>
                      <option>Update</option>
                      <option>Reminder</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date (Optional)</Label>
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
                    <p className="text-xs text-muted-foreground">Leave empty for single-day</p>
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
                  <Label>Cover Image</Label>
                  <div className="space-y-2">
                    {imagePreview || safeFormData.image_url ? (
                      <div className="relative">
                        <img
                          src={imagePreview || safeFormData.image_url || undefined}
                          alt="Announcement cover"
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
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={safeFormData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your announcement..."
                    className="min-h-32 border-2"
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
                      disabled={isCreating}
                      onClick={() => setCreateError(null)}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Announcement"
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
          placeholder="Search announcements..."
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
                  <TableHead className="font-mono font-bold">Tag</TableHead>
                  <TableHead className="font-mono font-bold hidden sm:table-cell">Status</TableHead>
                  <TableHead className="font-mono font-bold hidden md:table-cell">Created</TableHead>
                  <TableHead className="font-mono font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading announcements...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAnnouncements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No announcements found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnnouncements.map((announcement) => {
                    const timeAgo = formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })
                    return (
                      <TableRow key={announcement.id} className="border-b-2 border-border">
                        <TableCell className="font-medium max-w-[200px] truncate">{announcement.title}</TableCell>
                        <TableCell>
                          {announcement.tag && (
                            <Badge variant="outline" className={`border-2 ${getTagColor(announcement.tag)}`}>
                              {announcement.tag}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="border-2 bg-green-100 text-green-700 border-green-500">
                            Published
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">{timeAgo}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-2">
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => openEditDialog(announcement)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => setDeleteId(announcement.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={!!editingAnnouncement} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingAnnouncement(null)
            setFormData({ 
              title: "", 
              tag: "Event", 
              content: "", 
              fromDate: "", 
              toDate: "", 
              fromTime: "", 
              toTime: "", 
              image_url: "" 
            })
            setEditImagePreview(null)
            setEditError(null)
            setIsCreating(false)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Announcement</DialogTitle>
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
                <Label htmlFor="edit-tag">Tag</Label>
                <select
                  id="edit-tag"
                  value={safeFormData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full border-2 border-border bg-white p-2"
                >
                  <option>Event</option>
                  <option>Update</option>
                  <option>Reminder</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fromDate">From Date (Optional)</Label>
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
                <p className="text-xs text-muted-foreground">Leave empty for single-day</p>
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
              <Label>Cover Image</Label>
              <div className="space-y-2">
                {editImagePreview || safeFormData.image_url ? (
                  <div className="relative">
                    <img
                      src={editImagePreview || safeFormData.image_url || undefined}
                      alt="Announcement cover"
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
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={safeFormData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-32 border-2"
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
                  setEditingAnnouncement(null)
                  setFormData({ 
                    title: "", 
                    tag: "Event", 
                    content: "", 
                    fromDate: "", 
                    toDate: "", 
                    fromTime: "", 
                    toTime: "", 
                    image_url: "" 
                  })
                  setEditImagePreview(null)
                  setEditError(null)
                  setIsCreating(false)
                }} 
                className="border-2 bg-transparent"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isCreating}
                className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
              >
                {isCreating ? (
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
            <DialogTitle className="font-mono">Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this announcement? This action cannot be undone.
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

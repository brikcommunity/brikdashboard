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
import { ArrowLeft, Plus, Pencil, Trash2, Upload, Eye, Search, MoreHorizontal, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, type Announcement } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"

export function AdminAnnouncementsContent() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    tag: "Event",
    content: "",
  })

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

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      setCreateError("Title and content are required")
      return
    }

    if (!profile?.id) {
      setCreateError("You must be logged in to create announcements")
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const { data, error } = await createAnnouncement({
        title: formData.title,
        content: formData.content,
        tag: formData.tag,
        image_url: null,
        created_by: profile.id,
      })

      if (error) {
        setCreateError(error.message || "Failed to create announcement")
        setIsCreating(false)
        return
      }

      // Refresh announcements
      const { data: announcementsData, error: fetchError } = await getAnnouncements()
      if (!fetchError && announcementsData) {
        setAnnouncements(announcementsData)
      }

      // Reset form
      setFormData({ title: "", tag: "Event", content: "" })
      setIsCreateOpen(false)
      setCreateError(null)
    } catch (err: any) {
      setCreateError(err.message || "Failed to create announcement")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editingAnnouncement) return

    setIsCreating(true)
    try {
      const { error } = await updateAnnouncement(editingAnnouncement.id, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        tag: editingAnnouncement.tag,
        image_url: editingAnnouncement.image_url,
      })

      if (error) throw error
      await fetchAnnouncements()
      setEditingAnnouncement(null)
    } catch (err: any) {
      alert(err.message || "Failed to update announcement")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteAnnouncement(id)
      if (error) throw error
      await fetchAnnouncements()
      setDeleteId(null)
    } catch (err: any) {
      alert(err.message || "Failed to delete announcement")
    }
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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
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
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="w-full border-2 border-border bg-white p-2"
                    >
                      <option>Event</option>
                      <option>Update</option>
                      <option>Reminder</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
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
                                onClick={() => setEditingAnnouncement(announcement)}
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
      <Dialog open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Announcement</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tag">Tag</Label>
                  <select
                    id="edit-tag"
                    value={editingAnnouncement.tag}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, tag: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option>Event</option>
                    <option>Update</option>
                    <option>Reminder</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    value={editingAnnouncement.status}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        status: e.target.value as "published" | "draft",
                      })
                    }
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                {editingAnnouncement.image ? (
                  <div className="relative">
                    <img
                      src={editingAnnouncement.image || "/placeholder.svg"}
                      alt="Cover"
                      className="h-32 w-full object-cover border-2 border-border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setEditingAnnouncement({ ...editingAnnouncement, image: null })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-32 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB] hover:bg-[#AEC6FF]/20 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Click to upload image</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-preview">Preview Text</Label>
                <Input
                  id="edit-preview"
                  value={editingAnnouncement.preview}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, preview: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                  className="min-h-32 border-2"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="border-2 bg-transparent">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleEdit}
                  className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-2 bg-transparent">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId.toString())}
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

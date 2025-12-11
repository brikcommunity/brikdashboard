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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  FileText,
  Video,
  LinkIcon,
  FileSpreadsheet,
  Upload,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getResources, createResource, updateResource, deleteResource, type Resource } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"

const types = ["PDF", "Video", "Template", "Link"]

export function AdminResourcesContent() {
  const { profile } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    type: "PDF",
    description: "",
    link: "",
  })

  useEffect(() => {
    fetchResources()
  }, [])

  async function fetchResources() {
    try {
      setLoading(true)
      const { data, error } = await getResources()
      if (error) throw error
      setResources(data || [])
    } catch (error) {
      // Error fetching resources
    } finally {
      setLoading(false)
    }
  }

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(search.toLowerCase())),
  )

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert("Title is required")
      return
    }

    if (!profile?.id) {
      alert("You must be logged in to create resources")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await createResource({
        title: formData.title,
        category: formData.type || null,
        description: formData.description || null,
        link_url: formData.link || null,
        created_by: profile.id,
      })

      if (error) throw error
      await fetchResources()
      setIsCreateOpen(false)
      setFormData({ title: "", type: "PDF", description: "", link: "" })
    } catch (error: any) {
      alert(error.message || "Failed to create resource")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingResource || !formData.title.trim()) {
      alert("Title is required")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await updateResource(editingResource.id, {
        title: formData.title,
        category: formData.type || null,
        description: formData.description || null,
        link_url: formData.link || null,
      })

      if (error) throw error
      await fetchResources()
      setEditingResource(null)
      setFormData({ title: "", type: "PDF", description: "", link: "" })
    } catch (error: any) {
      alert(error.message || "Failed to update resource")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await deleteResource(deleteId)
      if (error) throw error
      await fetchResources()
      setDeleteId(null)
    } catch (error: any) {
      alert(error.message || "Failed to delete resource")
    }
  }

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      type: resource.category || "PDF",
      description: resource.description || "",
      link: resource.link_url || "",
    })
  }

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "PDF":
        return FileText
      case "Video":
        return Video
      case "Template":
        return FileSpreadsheet
      case "Link":
        return LinkIcon
      default:
        return FileText
    }
  }

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case "PDF":
        return "bg-[#AEC6FF]/30 text-[#3A5FCD] border-[#3A5FCD]"
      case "Video":
        return "bg-[#5C7AEA]/20 text-[#5C7AEA] border-[#5C7AEA]"
      case "Template":
        return "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]"
      case "Link":
        return "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]"
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
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Resources Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload and organize resources for the community</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Add Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter resource title"
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    {types.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the resource..."
                    className="min-h-24 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>File or Link</Label>
                  {formData.type === "Link" ? (
                    <Input
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://..."
                      className="border-2"
                    />
                  ) : (
                    <div className="flex h-24 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB] hover:bg-[#AEC6FF]/20 transition-colors">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Click to upload file</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-2 bg-transparent" disabled={isSubmitting}>
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
                      "Add Resource"
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
          placeholder="Search resources..."
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
                  <TableHead className="font-mono font-bold hidden md:table-cell">Description</TableHead>
                  <TableHead className="font-mono font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading resources...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No resources found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => {
                    const TypeIcon = getTypeIcon(resource.category)
                    return (
                      <TableRow key={resource.id} className="border-b-2 border-border">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-[#AEC6FF]/30">
                              <TypeIcon className="h-4 w-4 text-[#3A5FCD]" />
                            </div>
                            <span className="max-w-[150px] truncate">{resource.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {resource.category && (
                            <Badge variant="outline" className={`border-2 ${getTypeColor(resource.category)}`}>
                              {resource.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate hidden md:table-cell">
                          {resource.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-2">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => openEditDialog(resource)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => setDeleteId(resource.id)}
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
      <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Resource</DialogTitle>
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
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <select
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border-2 border-border bg-white p-2"
              >
                {types.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
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
            <div className="space-y-2">
              <Label htmlFor="edit-link">File or Link</Label>
              <Input
                id="edit-link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
                className="border-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingResource(null)} className="border-2 bg-transparent" disabled={isSubmitting}>
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
            <DialogTitle className="font-mono">Delete Resource</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this resource? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-2 bg-transparent">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

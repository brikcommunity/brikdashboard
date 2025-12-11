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
import { ArrowLeft, Plus, Pencil, Trash2, Search, MoreHorizontal, ExternalLink, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, type Opportunity } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"

const categories = ["Internship", "Hackathon", "Grant", "Job", "BRIK Exclusive"]

export function AdminOpportunitiesContent() {
  const { profile } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    category: "Internship",
    deadline: "",
    location: "",
    description: "",
    applyLink: "",
  })

  useEffect(() => {
    fetchOpportunities()
  }, [])

  async function fetchOpportunities() {
    try {
      setLoading(true)
      const { data, error } = await getOpportunities()
      if (error) throw error
      setOpportunities(data || [])
    } catch (error) {
      // Error fetching opportunities
    } finally {
      setLoading(false)
    }
  }

  const filteredOpportunities = opportunities.filter(
    (o) =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.organization && o.organization.toLowerCase().includes(search.toLowerCase())) ||
      (o.category && o.category.toLowerCase().includes(search.toLowerCase())),
  )

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert("Title is required")
      return
    }

    if (!profile?.id) {
      alert("You must be logged in to create opportunities")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await createOpportunity({
        title: formData.title,
        organization: formData.organization || null,
        category: formData.category || null,
        deadline: formData.deadline || null,
        location: formData.location || null,
        description: formData.description || null,
        apply_link: formData.applyLink || null,
        created_by: profile.id,
      })

      if (error) throw error
      await fetchOpportunities()
      setIsCreateOpen(false)
      setFormData({
        title: "",
        organization: "",
        category: "Internship",
        deadline: "",
        location: "",
        description: "",
        applyLink: "",
      })
    } catch (error: any) {
      alert(error.message || "Failed to create opportunity")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingOpportunity || !formData.title.trim()) {
      alert("Title is required")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await updateOpportunity(editingOpportunity.id, {
        title: formData.title,
        organization: formData.organization || null,
        category: formData.category || null,
        deadline: formData.deadline || null,
        location: formData.location || null,
        description: formData.description || null,
        apply_link: formData.applyLink || null,
      })

      if (error) throw error
      await fetchOpportunities()
      setEditingOpportunity(null)
      setFormData({
        title: "",
        organization: "",
        category: "Internship",
        deadline: "",
        location: "",
        description: "",
        applyLink: "",
      })
    } catch (error: any) {
      alert(error.message || "Failed to update opportunity")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await deleteOpportunity(deleteId)
      if (error) throw error
      await fetchOpportunities()
      setDeleteId(null)
    } catch (error: any) {
      alert(error.message || "Failed to delete opportunity")
    }
  }

  const openEditDialog = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setFormData({
      title: opportunity.title,
      organization: opportunity.organization || "",
      category: opportunity.category || "Internship",
      deadline: opportunity.deadline || "",
      location: opportunity.location || "",
      description: opportunity.description || "",
      applyLink: opportunity.apply_link || "",
    })
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "Internship":
        return "bg-[#AEC6FF]/30 text-[#3A5FCD] border-[#3A5FCD]"
      case "Hackathon":
        return "bg-[#5C7AEA]/20 text-[#5C7AEA] border-[#5C7AEA]"
      case "Grant":
        return "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]"
      case "Job":
        return "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]"
      case "BRIK Exclusive":
        return "bg-[#3A5FCD] text-white border-[#3A5FCD]"
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
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Opportunities Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage internships, hackathons, grants, and jobs</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Create Opportunity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter opportunity title"
                    className="border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Company name"
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border-2 border-border bg-white p-2"
                    >
                      {categories.map((cat) => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      placeholder="e.g., Feb 15, 2025"
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City or Remote"
                      className="border-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the opportunity..."
                    className="min-h-24 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applyLink">Apply Link</Label>
                  <Input
                    id="applyLink"
                    value={formData.applyLink}
                    onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })}
                    placeholder="https://..."
                    className="border-2"
                  />
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
                      "Create Opportunity"
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
          placeholder="Search opportunities..."
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
                  <TableHead className="font-mono font-bold hidden sm:table-cell">Organization</TableHead>
                  <TableHead className="font-mono font-bold">Category</TableHead>
                  <TableHead className="font-mono font-bold hidden md:table-cell">Deadline</TableHead>
                  <TableHead className="font-mono font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading opportunities...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No opportunities found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.id} className="border-b-2 border-border">
                      <TableCell className="font-medium max-w-[150px] truncate">{opportunity.title}</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {opportunity.organization || "—"}
                      </TableCell>
                      <TableCell>
                        {opportunity.category && (
                          <Badge variant="outline" className={`border-2 ${getCategoryColor(opportunity.category)}`}>
                            {opportunity.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {opportunity.deadline || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            {opportunity.apply_link && (
                              <DropdownMenuItem className="cursor-pointer" asChild>
                                <a href={opportunity.apply_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Link
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEditDialog(opportunity)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setDeleteId(opportunity.id)}
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
      <Dialog open={!!editingOpportunity} onOpenChange={(open) => !open && setEditingOpportunity(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Opportunity</DialogTitle>
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
                <Label htmlFor="edit-organization">Organization</Label>
                <Input
                  id="edit-organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border-2 border-border bg-white p-2"
                >
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-deadline">Deadline</Label>
                <Input
                  id="edit-deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border-2"
                />
              </div>
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
              <Label htmlFor="edit-applyLink">Apply Link</Label>
              <Input
                id="edit-applyLink"
                value={formData.applyLink}
                onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })}
                className="border-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingOpportunity(null)} className="border-2 bg-transparent" disabled={isSubmitting}>
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
            <DialogTitle className="font-mono">Delete Opportunity</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this opportunity? This action cannot be undone.
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

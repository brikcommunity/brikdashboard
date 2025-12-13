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
  Eye,
  Loader2,
  Users,
  FolderKanban,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getProjects,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProfiles,
  type Project,
  type Profile,
} from "@/lib/database"
import { createProjectByAdmin, updateProjectByAdmin, deleteProjectByAdmin } from "@/lib/admin"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"

const tracks = ["Engineering", "Design", "Product", "Climate", "Health"]
const stages = ["Idea", "Prototype", "MVP", "Beta", "Launched"]

export function AdminProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [allMembers, setAllMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [viewingMembers, setViewingMembers] = useState<any[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    team_name: "",
    track: "Engineering",
    stage: "Idea",
    description: "",
    progress: 0,
    featured: false,
    members: [] as string[],
  })

  useEffect(() => {
    fetchProjects()
    fetchMembers()
  }, [])

  async function fetchProjects() {
    try {
      setLoading(true)
      const { data, error } = await getProjects()
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      // Error fetching projects
    } finally {
      setLoading(false)
    }
  }

  async function fetchMembers() {
    try {
      const { data, error } = await getProfiles()
      if (error) throw error
      setAllMembers(data || [])
    } catch (error) {
      // Error fetching members
    }
  }

  async function fetchProjectMembers(projectId: string) {
    try {
      const { data, error } = await getProjectMembers(projectId)
      if (error) throw error
      setViewingMembers(data || [])
    } catch (error) {
      // Error fetching project members
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const { data: project, error } = await createProjectByAdmin(
        formData.name,
        formData.description || undefined,
        formData.team_name || undefined,
        formData.track || undefined,
        formData.stage || undefined,
        formData.progress,
        formData.featured
      )

      if (error) {
        setIsSubmitting(false)
        return
      }

      // Add members to the project
      if (project && formData.members.length > 0) {
        for (const memberId of formData.members) {
          await addProjectMember(project.id, memberId, "member")
        }
      }

      // Reset form and close dialog immediately
      setFormData({
        name: "",
        team_name: "",
        track: "Engineering",
        stage: "Idea",
        description: "",
        progress: 0,
        featured: false,
        members: [],
      })
      setIsCreateOpen(false)
      setIsSubmitting(false)
      
      // Refresh projects list (non-blocking)
      fetchProjects().catch(() => {
        // Error refreshing projects
      })
    } catch (error: any) {
      setIsSubmitting(false)
      // Don't close dialog on error so user can fix and retry
    }
  }

  const handleEdit = async () => {
    if (!editingProject || !formData.name.trim()) {
      setEditError("Project name is required")
      return
    }

    setIsSubmitting(true)
    setEditError(null)

    try {
      const { data, error } = await updateProjectByAdmin(editingProject.id, {
        name: formData.name,
        team_name: formData.team_name || undefined,
        track: formData.track || undefined,
        stage: formData.stage || undefined,
        description: formData.description || undefined,
        progress: formData.progress,
        featured: formData.featured,
      })

      if (error) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || "Failed to update project")
        setEditError(errorMsg)
        setIsSubmitting(false)
        return
      }

      if (!data) {
        setEditError("Failed to update project - no data returned")
        setIsSubmitting(false)
        return
      }

      // Update members using API routes (bypasses RLS)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Not authenticated')
        }

        const currentMembersResult = await getProjectMembers(editingProject.id)
        if (currentMembersResult.error) {
          throw new Error(`Failed to fetch current members: ${currentMembersResult.error.message || 'Unknown error'}`)
        }
        
        const currentMembers = currentMembersResult.data || []
        const currentMemberIds = currentMembers.map((m: any) => m.member_id)

        // Remove members that are no longer selected
        for (const memberId of currentMemberIds) {
          if (!formData.members.includes(memberId)) {
            const response = await fetch('/api/admin/remove-project-member', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ projectId: editingProject.id, memberId }),
            })

            const result = await response.json()
            if (!response.ok) {
              throw new Error(result.error || `Failed to remove member`)
            }
          }
        }

        // Add new members
        for (const memberId of formData.members) {
          if (!currentMemberIds.includes(memberId)) {
            const response = await fetch('/api/admin/add-project-member', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ projectId: editingProject.id, memberId, role: 'member' }),
            })

            const result = await response.json()
            if (!response.ok) {
              throw new Error(result.error || `Failed to add member`)
            }
          }
        }
      } catch (memberError: any) {
        // Member update error - show error but project update still succeeded
        const memberErrorMsg = memberError?.message || 'Failed to update project members'
        setEditError(`Project updated, but ${memberErrorMsg.toLowerCase()}`)
        // Don't return - let the success flow continue since project was updated
      }

      // Success - refresh projects and close dialog
      await fetchProjects()
      setEditingProject(null)
      setFormData({
        name: "",
        team_name: "",
        track: "Engineering",
        stage: "Idea",
        description: "",
        progress: 0,
        featured: false,
        members: [],
      })
      setEditError(null)
      setIsSubmitting(false)
    } catch (error: any) {
      setEditError(error?.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) {
      setDeleteError("No project selected for deletion")
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteProjectByAdmin(deleteId)
      
      if (result.error) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || "Failed to delete project")
        setDeleteError(errorMsg)
        setIsDeleting(false)
        return
      }

      if (!result.data) {
        setDeleteError("Failed to delete project - no confirmation received")
        setIsDeleting(false)
        return
      }

      // Success - refresh projects list
      await fetchProjects()
      
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

  const handleView = async (project: Project) => {
    setViewingProject(project)
    await fetchProjectMembers(project.id)
  }

  const openEditDialog = async (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      team_name: project.team_name || "",
      track: project.track || "Engineering",
      stage: project.stage || "Idea",
      description: project.description || "",
      progress: project.progress,
      featured: project.featured,
      members: [],
    })

    // Fetch current members
    const { data: members } = await getProjectMembers(project.id)
    if (members) {
      setFormData((prev) => ({
        ...prev,
        members: members.map((m: any) => m.member_id),
      }))
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.team_name && project.team_name.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="h-10 w-10 border-2 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Projects Management</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">Create and manage community projects</p>
          </div>
        </div>
        <Dialog 
          open={isCreateOpen} 
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) {
              // Reset form and state when dialog closes
              setFormData({
                name: "",
                team_name: "",
                track: "Engineering",
                stage: "Idea",
                description: "",
                progress: 0,
                featured: false,
                members: [],
              })
              setIsSubmitting(false)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono">Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EduAI - Smart Learning Platform"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name</Label>
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  placeholder="Team Innovate"
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="track">Track</Label>
                  <select
                    id="track"
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    {tracks.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <select
                    id="stage"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project..."
                  className="min-h-24 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="members">Team Members</Label>
                <div className="max-h-48 overflow-y-auto border-2 border-border p-2 space-y-2">
                  {allMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.members.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, members: [...formData.members, member.id] })
                          } else {
                            setFormData({
                              ...formData,
                              members: formData.members.filter((id) => id !== member.id),
                            })
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        {member.full_name || member.username} {member.track ? `(${member.track})` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured Project
                </Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-2">
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
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A]"
        />
      </div>

      {/* Projects Table */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-[#F7F4EB]">
                  <TableHead className="font-mono font-bold">Project Name</TableHead>
                  <TableHead className="font-mono font-bold">Team</TableHead>
                  <TableHead className="font-mono font-bold">Track</TableHead>
                  <TableHead className="font-mono font-bold">Stage</TableHead>
                  <TableHead className="font-mono font-bold">Progress</TableHead>
                  <TableHead className="font-mono font-bold">Status</TableHead>
                  <TableHead className="text-right font-mono font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading projects...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No projects found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id} className="border-b-2 border-border">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {project.featured && <Badge className="bg-[#E7B75F] text-white">Featured</Badge>}
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell>{project.team_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-2">
                          {project.track || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-2">
                          {project.stage || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 border-2 border-border bg-white">
                            <div
                              className="h-full bg-[#3A5FCD]"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-2 ${
                            project.progress === 100
                              ? "bg-green-100 text-green-700 border-green-500"
                              : project.progress > 50
                                ? "bg-blue-100 text-blue-700 border-blue-500"
                                : "bg-gray-100 text-gray-600 border-gray-400"
                          }`}
                        >
                          {project.progress === 100 ? "Complete" : project.progress > 50 ? "In Progress" : "Early"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleView(project)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEditDialog(project)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setDeleteId(project.id)}
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
      {editingProject && (
        <Dialog 
          open={!!editingProject} 
          onOpenChange={(open) => {
            if (!open) {
              setEditingProject(null)
              setEditError(null)
              setIsSubmitting(false)
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono">Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team_name">Team Name</Label>
                <Input
                  id="edit-team_name"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-track">Track</Label>
                  <select
                    id="edit-track"
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    {tracks.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stage">Stage</Label>
                  <select
                    id="edit-stage"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
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
                <Label htmlFor="edit-progress">Progress (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-members">Team Members</Label>
                <div className="max-h-48 overflow-y-auto border-2 border-border p-2 space-y-2">
                  {allMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.members.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, members: [...formData.members, member.id] })
                          } else {
                            setFormData({
                              ...formData,
                              members: formData.members.filter((id) => id !== member.id),
                            })
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        {member.full_name || member.username} {member.track ? `(${member.track})` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-featured" className="cursor-pointer">
                  Featured Project
                </Label>
              </div>
              {editError && (
                <div className="rounded-md bg-red-50 border-2 border-red-200 p-3">
                  <p className="text-sm text-red-800">{editError}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingProject(null)
                  setEditError(null)
                  setIsSubmitting(false)
                }} 
                className="border-2"
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
                  "Update Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      {viewingProject && (
        <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono">{viewingProject.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Team Name</Label>
                  <p className="font-medium">{viewingProject.team_name || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Track</Label>
                  <p className="font-medium">{viewingProject.track || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stage</Label>
                  <p className="font-medium">{viewingProject.stage || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Progress</Label>
                  <p className="font-medium">{viewingProject.progress}%</p>
                </div>
              </div>
              {viewingProject.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{viewingProject.description}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Team Members</Label>
                <div className="mt-2 space-y-2">
                  {viewingMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members yet</p>
                  ) : (
                    viewingMembers.map((member: any) => (
                      <div key={member.member_id} className="flex items-center gap-2 border-2 border-border p-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {member.profiles?.full_name || member.profiles?.username || "Unknown"} - {member.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-sm">{formatDistanceToNow(new Date(viewingProject.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingProject(null)} className="border-2">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
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
          <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A]">
            <DialogHeader>
              <DialogTitle className="font-mono">Delete Project</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this project? This action cannot be undone.
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
                className="border-2"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="border-2 border-border bg-red-600 text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-red-700"
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
      )}
    </div>
  )
}


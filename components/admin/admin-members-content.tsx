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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
  Mail,
  Zap,
  Award,
  Filter,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getProfiles, updateProfile, type Profile } from "@/lib/database"
import { createMemberByAdmin, updateMemberByAdmin, deleteMemberByAdmin, updatePasswordByAdmin } from "@/lib/admin"
import { format } from "date-fns"

interface Member extends Profile {
  avatar: string
  email: string
  joinedAt: string
}

// Helper function to convert Profile to Member
function profileToMember(profile: Profile): Member {
  return {
    ...profile,
    // Keep the original avatar URL from profile (not initials)
    avatar: profile.avatar || "",
    email: `${profile.username}@brik.com`,
    joinedAt: format(new Date(profile.created_at), "MMM d, yyyy"),
  }
}

const tracks = ["All Tracks", "ai/ml", "web dev", "app dev", "ui/ux", "data science"]
const cohorts = ["All Cohorts", "s25"]
const statuses = ["All Status", "active", "inactive", "suspended"]
const roles = ["All Roles", "member", "mentor", "admin"]

export function AdminMembersContent() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterTrack, setFilterTrack] = useState("All Tracks")
  const [filterCohort, setFilterCohort] = useState("All Cohorts")
  const [filterStatus, setFilterStatus] = useState("All Status")
  const [filterRole, setFilterRole] = useState("All Roles")
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [viewingMember, setViewingMember] = useState<Member | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    track: "ai/ml",
    cohort: "s25",
    role: "member" as "member" | "admin" | "mentor",
    status: "active" as "active" | "inactive" | "suspended",
    bio: "",
    skills: "",
  })

  // Fetch members from Supabase
  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true)
        const { data, error } = await getProfiles()
        if (error) throw error
        const memberData = (data || []).map(profileToMember)
        setMembers(memberData)
      } catch (err) {
        // Error fetching members
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [])

  const filteredMembers = members.filter((m) => {
    const name = m.full_name || m.username || ""
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesTrack = filterTrack === "All Tracks" || m.track === filterTrack
    const matchesCohort = filterCohort === "All Cohorts" || m.cohort === filterCohort
    const matchesStatus = filterStatus === "All Status" || m.status === filterStatus
    const matchesRole = filterRole === "All Roles" || m.role === filterRole
    return matchesSearch && matchesTrack && matchesCohort && matchesStatus && matchesRole
  })

  const handleCreate = async () => {
    // Prevent multiple simultaneous creation attempts
    if (isCreating) {
      return
    }

    if (!formData.username || !formData.password || !formData.name) {
      setCreateError("Username, password, and full name are required")
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const skillsArray = formData.skills
        ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : []

      const { data, error } = await createMemberByAdmin(
        formData.username,
        formData.password,
        formData.name,
        formData.role,
        {
          track: formData.track,
          cohort: formData.cohort,
          bio: formData.bio || undefined,
          skills: skillsArray.length > 0 ? skillsArray : undefined,
          status: formData.status,
        }
      )

      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error?.message || "Failed to create member")
        setCreateError(errorMessage)
        setIsCreating(false)
        return
      }

      if (!data) {
        setCreateError("Failed to create member - no data returned")
        setIsCreating(false)
        return
      }

      // Reset form and close dialog immediately to prevent state issues
      setFormData({
        username: "",
        password: "",
        name: "",
        track: "ai/ml",
        cohort: "s25",
        role: "member",
        status: "active",
        bio: "",
        skills: "",
      })
      setIsCreateOpen(false)
      setCreateError(null)
      setIsCreating(false) // Reset loading state immediately

      // Refresh members list (non-blocking, don't wait for it)
      getProfiles()
        .then(({ data: profilesData, error: fetchError }) => {
          if (!fetchError && profilesData) {
            const memberData = profilesData.map(profileToMember)
            setMembers(memberData)
          }
        })
        .catch((refreshErr) => {
          // Exception refreshing members list
        })
    } catch (err: any) {
      setCreateError(err.message || "Failed to create member")
      setIsCreating(false) // Ensure loading state is reset on error
    }
  }

  const handleEdit = async () => {
    if (!editingMember) return

    try {
      // Update password if provided
      if (showPasswordField && newPassword) {
        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters")
          return
        }

        const { error: passwordError } = await updatePasswordByAdmin(editingMember.id, newPassword)
        if (passwordError) {
          alert(`Failed to update password: ${passwordError}`)
          return
        }
      }

      // Prepare update object - only include fields that have values
      const updates: any = {
        full_name: editingMember.full_name || null,
        track: editingMember.track || null,
        cohort: editingMember.cohort || null,
        role: editingMember.role,
        status: editingMember.status,
        bio: editingMember.bio || null,
        skills: editingMember.skills || null,
      }

      const { data, error } = await updateMemberByAdmin(editingMember.id, updates)

      if (error) {
        const errorMsg = typeof error === 'object' && 'message' in error ? error.message : String(error)
        alert(`Failed to update member: ${errorMsg}`)
        return
      }

      // Refresh members list
      const { data: profilesData, error: fetchError } = await getProfiles()
      if (!fetchError && profilesData) {
        const memberData = profilesData.map(profileToMember)
        setMembers(memberData)
      }

      // Reset password fields
      setNewPassword("")
      setShowPasswordField(false)
      setShowPassword(false)
      setEditingMember(null)
      alert("Member updated successfully!")
    } catch (err: any) {
      alert(`Failed to update member: ${err?.message || "Unknown error"}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteMemberByAdmin(id)
      if (error) {
        return
      }

      // Refresh members list
      const { data: profilesData, error: fetchError } = await getProfiles()
      if (!fetchError && profilesData) {
        const memberData = profilesData.map(profileToMember)
        setMembers(memberData)
      }

      setDeleteId(null)
    } catch (err) {
      // Error deleting member
    }
  }

  const handleStatusChange = async (id: string, newStatus: "active" | "inactive" | "suspended") => {
    try {
      const { error } = await updateMemberByAdmin(id, { status: newStatus })
      if (error) {
        return
      }

      // Refresh members list
      const { data: profilesData, error: fetchError } = await getProfiles()
      if (!fetchError && profilesData) {
        const memberData = profilesData.map(profileToMember)
        setMembers(memberData)
      }
    } catch (err) {
      // Error updating status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-500"
      case "inactive":
        return "bg-gray-100 text-gray-600 border-gray-400"
      case "suspended":
        return "bg-red-100 text-red-700 border-red-500"
      default:
        return "bg-gray-100 text-gray-600 border-gray-400"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]"
      case "mentor":
        return "bg-[#3A5FCD]/20 text-[#3A5FCD] border-[#3A5FCD]"
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
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Members Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage community members ({filteredMembers.length} total)
            </p>
          </div>
          <Dialog 
            open={isCreateOpen} 
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (!open) {
                // Always reset form and loading state when dialog closes
                setFormData({
                  username: "",
                  password: "",
                  name: "",
                  track: "ai/ml",
                  cohort: "s25",
                  role: "member",
                  status: "active",
                  bio: "",
                  skills: "",
                })
                setCreateError(null)
                setIsCreating(false) // Always reset loading state when dialog closes
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Add New Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                      placeholder="johndoe"
                      className="border-2"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="border-2"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="border-2"
                    required
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
                      <option value="ai/ml">AI/ML</option>
                      <option value="web dev">Web Dev</option>
                      <option value="app dev">App Dev</option>
                      <option value="ui/ux">UI/UX</option>
                      <option value="data science">Data Science</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cohort">Cohort</Label>
                    <select
                      id="cohort"
                      value={formData.cohort}
                      onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                      className="w-full border-2 border-border bg-white p-2"
                    >
                      <option value="s25">S25</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value as "member" | "admin" | "mentor" })
                      }
                      className="w-full border-2 border-border bg-white p-2"
                    >
                      <option value="member">Member</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "suspended" })
                      }
                      className="w-full border-2 border-border bg-white p-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about this member..."
                    className="min-h-20 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, TypeScript, Python"
                    className="border-2"
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
                      "Add Member"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A]"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-2 shadow-[2px_2px_0px_0px_#1A1A1A] sm:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select
              value={filterTrack}
              onChange={(e) => setFilterTrack(e.target.value)}
              className="border-2 border-border bg-white px-3 py-1.5 text-sm"
            >
              {tracks.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={filterCohort}
              onChange={(e) => setFilterCohort(e.target.value)}
              className="border-2 border-border bg-white px-3 py-1.5 text-sm"
            >
              {cohorts.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-2 border-border bg-white px-3 py-1.5 text-sm"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border-2 border-border bg-white px-3 py-1.5 text-sm"
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-[#F7F4EB]">
                  <TableHead className="font-mono font-bold">Member</TableHead>
                  <TableHead className="font-mono font-bold hidden sm:table-cell">Track</TableHead>
                  <TableHead className="font-mono font-bold hidden md:table-cell">Role</TableHead>
                  <TableHead className="font-mono font-bold hidden lg:table-cell">XP</TableHead>
                  <TableHead className="font-mono font-bold">Status</TableHead>
                  <TableHead className="font-mono font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading members...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No members found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-b-2 border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-border">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-[#AEC6FF] text-xs font-bold">
                            {member.full_name
                              ? member.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : member.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.full_name || member.username}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {member.track ? (
                        <Badge variant="outline" className="border-2 border-[#3A5FCD] text-[#3A5FCD]">
                          {member.track}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={`border-2 capitalize ${getRoleColor(member.role)}`}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-[#3A5FCD]" />
                        <span className="font-mono text-xs font-bold">{member.xp.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-2 capitalize ${getStatusColor(member.status)}`}>
                        {member.status}
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
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingMember(member)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingMember(member)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          {member.status === "active" ? (
                            <DropdownMenuItem
                              className="cursor-pointer text-yellow-600"
                              onClick={() => handleStatusChange(member.id, "suspended")}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="cursor-pointer text-green-600"
                              onClick={() => handleStatusChange(member.id, "active")}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600"
                            onClick={() => setDeleteId(member.id)}
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

      {/* View Profile Dialog */}
      <Dialog open={!!viewingMember} onOpenChange={(open) => !open && setViewingMember(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Member Profile</DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={viewingMember.avatar || undefined} />
                  <AvatarFallback className="bg-[#AEC6FF] text-lg font-bold">
                    {viewingMember.full_name
                      ? viewingMember.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : viewingMember.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-mono text-lg font-bold">{viewingMember.full_name || viewingMember.username}</h3>
                  <p className="text-sm text-muted-foreground">{viewingMember.email}</p>
                  <p className="text-xs text-muted-foreground">@{viewingMember.username}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className={`border-2 capitalize ${getRoleColor(viewingMember.role)}`}>
                      {viewingMember.role}
                    </Badge>
                    <Badge variant="outline" className={`border-2 capitalize ${getStatusColor(viewingMember.status)}`}>
                      {viewingMember.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-border p-3 bg-[#F7F4EB]">
                  <p className="text-xs text-muted-foreground">Track</p>
                  <p className="font-mono font-bold">{viewingMember.track}</p>
                </div>
                <div className="border-2 border-border p-3 bg-[#F7F4EB]">
                  <p className="text-xs text-muted-foreground">Cohort</p>
                  <p className="font-mono font-bold">{viewingMember.cohort}</p>
                </div>
                <div className="border-2 border-border p-3 bg-[#F7F4EB]">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#3A5FCD]" />
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  <p className="font-mono font-bold">{viewingMember.xp.toLocaleString()}</p>
                </div>
                <div className="border-2 border-border p-3 bg-[#F7F4EB]">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-[#E7B75F]" />
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                  <p className="font-mono font-bold">{viewingMember.badges}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bio</p>
                <p className="text-sm">{viewingMember.bio || "No bio provided"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {viewingMember.skills && viewingMember.skills.length > 0
                    ? viewingMember.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="border-2 border-border">
                          {skill}
                        </Badge>
                      ))
                    : <p className="text-sm text-muted-foreground">No skills listed</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Joined {viewingMember.joinedAt}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => {
        if (!open) {
          setEditingMember(null)
          setNewPassword("")
          setShowPasswordField(false)
          setShowPassword(false)
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editingMember.full_name || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, full_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="border-2"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="change-password"
                    checked={showPasswordField}
                    onChange={(e) => {
                      setShowPasswordField(e.target.checked)
                      if (!e.target.checked) {
                        setNewPassword("")
                        setShowPassword(false)
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="change-password" className="cursor-pointer">Change Password</Label>
                </div>
                {showPasswordField && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        className="border-2 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {newPassword && newPassword.length < 6 && (
                      <p className="text-xs text-red-500">Password must be at least 6 characters</p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-track">Track</Label>
                  <select
                    id="edit-track"
                    value={editingMember.track || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, track: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option value="">Select Track</option>
                    <option value="ai/ml">AI/ML</option>
                    <option value="web dev">Web Dev</option>
                    <option value="app dev">App Dev</option>
                    <option value="ui/ux">UI/UX</option>
                    <option value="data science">Data Science</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cohort">Cohort</Label>
                  <select
                    id="edit-cohort"
                    value={editingMember.cohort || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, cohort: e.target.value })}
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option value="">Select Cohort</option>
                    <option value="s25">S25</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <select
                    id="edit-role"
                    value={editingMember.role}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, role: e.target.value as "member" | "admin" | "mentor" })
                    }
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option value="member">Member</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    value={editingMember.status}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        status: e.target.value as "active" | "inactive" | "suspended",
                      })
                    }
                    className="w-full border-2 border-border bg-white p-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-xp">XP</Label>
                  <Input
                    id="edit-xp"
                    type="number"
                    value={editingMember.xp}
                    onChange={(e) => setEditingMember({ ...editingMember, xp: Number.parseInt(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-badges">Badges</Label>
                  <Input
                    id="edit-badges"
                    type="number"
                    value={editingMember.badges}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, badges: Number.parseInt(e.target.value) || 0 })
                    }
                    className="border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={editingMember.bio || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                  className="min-h-20 border-2"
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
            <DialogTitle className="font-mono">Delete Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this member? This action cannot be undone and will remove all their data.
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

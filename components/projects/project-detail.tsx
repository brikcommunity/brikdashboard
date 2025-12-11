"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit,
  Plus,
  FileText,
  Video,
  Github,
  LinkIcon,
  Upload,
  Star,
  MessageSquare,
  ImageIcon,
  Calendar,
  Users,
  Target,
  CheckCircle2,
  Clock,
  ExternalLink,
  MoreVertical,
  UserPlus,
  UserMinus,
  Sparkles,
  Send,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getProject,
  getProjectMembers,
  getProjectUpdates,
  createProjectUpdate,
  updateProject,
  type Project,
  type ProjectUpdate,
  type Profile,
} from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"

const stageColors: Record<string, string> = {
  Idea: "bg-[#AEC6FF]/30 text-[#3A5FCD] border-[#3A5FCD]",
  Prototype: "bg-[#5C7AEA]/20 text-[#5C7AEA] border-[#5C7AEA]",
  MVP: "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]",
  Beta: "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]",
  Launched: "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]",
}

interface ProjectMemberWithProfile {
  project_id: string
  member_id: string
  role: string
  joined_at: string
  profiles: Profile
}

interface ProjectUpdateWithAuthor extends ProjectUpdate {
  profiles: Profile | null
}

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter()
  const { profile: currentUserProfile } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMemberWithProfile[]>([])
  const [updates, setUpdates] = useState<ProjectUpdateWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newUpdate, setNewUpdate] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  async function fetchProjectData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch project
      const { data: projectData, error: projectError } = await getProject(projectId)
      if (projectError) throw projectError
      if (!projectData) {
        throw new Error("Project not found")
      }
      setProject(projectData)

      // Fetch members
      const { data: membersData, error: membersError } = await getProjectMembers(projectId)
      if (membersError) {
        console.error("Error fetching members:", membersError)
      } else {
        setMembers((membersData as any) || [])
      }

      // Fetch updates
      const { data: updatesData, error: updatesError } = await getProjectUpdates(projectId)
      if (updatesError) {
        console.error("Error fetching updates:", updatesError)
      } else {
        setUpdates((updatesData as any) || [])
      }
    } catch (err: any) {
      console.error("Error fetching project data:", err)
      setError(err.message || "Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  const getAvatarInitials = (name: string | null | undefined, username: string | null | undefined) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (username) {
      return username.slice(0, 2).toUpperCase()
    }
    return "??"
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Error</p>
          <p className="mt-2 text-sm text-muted-foreground">{error || "Project not found"}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isAdmin = currentUserProfile?.role === "admin"
  const isProjectMember = members.some((m) => m.member_id === currentUserProfile?.id)
  const canEdit = isAdmin || isProjectMember

  // Parse description - if it contains problem/solution/vision sections, parse them
  const descriptionText = project.description || ""
  const problemMatch = descriptionText.match(/THE PROBLEM[:\s]*(.*?)(?=OUR SOLUTION|THE VISION|$)/is)
  const solutionMatch = descriptionText.match(/OUR SOLUTION[:\s]*(.*?)(?=THE VISION|$)/is)
  const visionMatch = descriptionText.match(/THE VISION[:\s]*(.*?)$/is)

  const problem = problemMatch ? problemMatch[1].trim() : null
  const solution = solutionMatch ? solutionMatch[1].trim() : null
  const vision = visionMatch ? visionMatch[1].trim() : null

  // If no structured sections found, use the whole description
  const displayDescription = problem || solution || vision ? null : descriptionText

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="border-2 shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Project Header */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {project.featured && (
                  <Badge className="border-2 border-[#E7B75F] bg-[#E7B75F]/20 text-[#B8860B]">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                )}
                {project.stage && (
                  <Badge variant="outline" className={`border-2 ${stageColors[project.stage] || stageColors.Idea}`}>
                    {project.stage}
                  </Badge>
                )}
                {project.track && (
                  <Badge variant="outline" className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]">
                    {project.track}
                  </Badge>
                )}
              </div>
              <div>
                <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">{project.name}</h1>
                {project.team_name && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
                    <Users className="h-4 w-4" />
                    {project.team_name}
                  </p>
                )}
              </div>
              {/* Team Avatars */}
              {members.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map((member) => {
                      const profile = member.profiles
                      const initials = getAvatarInitials(profile?.full_name, profile?.username)
                      return (
                        <Avatar
                          key={member.member_id}
                          className="h-8 w-8 border-2 border-white sm:h-10 sm:w-10"
                          title={profile?.full_name || profile?.username || "Unknown"}
                        >
                          <AvatarImage src={profile?.avatar || undefined} />
                          <AvatarFallback className="bg-[#AEC6FF] text-xs font-medium">{initials}</AvatarFallback>
                        </Avatar>
                      )
                    })}
                  </div>
                  {members.length > 4 && (
                    <span className="text-sm text-muted-foreground">+{members.length - 4} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Admin Controls */}
            {canEdit && (
              <div className="flex gap-2">
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A] bg-transparent"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-mono">Edit Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                          id="project-name"
                          defaultValue={project.name}
                          className="border-2"
                          onChange={(e) => setProject({ ...project, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="team-name">Team Name</Label>
                          <Input
                            id="team-name"
                            defaultValue={project.team_name || ""}
                            className="border-2"
                            onChange={(e) => setProject({ ...project, team_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-stage">Stage</Label>
                          <select
                            id="project-stage"
                            defaultValue={project.stage || "Idea"}
                            className="w-full border-2 border-border bg-white p-2"
                            onChange={(e) => setProject({ ...project, stage: e.target.value })}
                          >
                            <option>Idea</option>
                            <option>Prototype</option>
                            <option>MVP</option>
                            <option>Beta</option>
                            <option>Launched</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          defaultValue={project.description || ""}
                          className="min-h-32 border-2"
                          onChange={(e) => setProject({ ...project, description: e.target.value })}
                          placeholder="You can structure your description with sections like:&#10;THE PROBLEM: ...&#10;OUR SOLUTION: ...&#10;THE VISION: ..."
                        />
                      </div>
                      <Button
                        className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                        onClick={async () => {
                          try {
                            const { error } = await updateProject(project.id, {
                              name: project.name,
                              team_name: project.team_name,
                              stage: project.stage,
                              description: project.description,
                            })
                            if (error) throw error
                            setIsEditing(false)
                            alert("Project updated successfully!")
                          } catch (err: any) {
                            alert(`Failed to update: ${err.message}`)
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] bg-transparent"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Member
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              const { error } = await updateProject(project.id, { featured: !project.featured })
                              if (error) throw error
                              setProject({ ...project, featured: !project.featured })
                              alert(project.featured ? "Project unfeatured" : "Project featured!")
                            } catch (err: any) {
                              alert(`Failed to update: ${err.message}`)
                            }
                          }}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {project.featured ? "Unfeature Project" : "Feature Project"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Project Description */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="flex items-center gap-2 font-mono text-base sm:text-lg">
                <Target className="h-5 w-5 text-[#3A5FCD]" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {displayDescription ? (
                <p className="text-sm leading-relaxed sm:text-base">{displayDescription}</p>
              ) : (
                <>
                  {problem && (
                    <div className="space-y-2">
                      <h3 className="font-mono text-sm font-semibold text-[#3A5FCD]">THE PROBLEM</h3>
                      <p className="text-sm leading-relaxed sm:text-base">{problem}</p>
                    </div>
                  )}
                  {solution && (
                    <div className="space-y-2">
                      <h3 className="font-mono text-sm font-semibold text-[#3A5FCD]">OUR SOLUTION</h3>
                      <p className="text-sm leading-relaxed sm:text-base">{solution}</p>
                    </div>
                  )}
                  {vision && (
                    <div className="space-y-2">
                      <h3 className="font-mono text-sm font-semibold text-[#3A5FCD]">THE VISION</h3>
                      <p className="text-sm leading-relaxed sm:text-base">{vision}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Updates Feed */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="flex items-center gap-2 font-mono text-base sm:text-lg">
                <MessageSquare className="h-5 w-5 text-[#3A5FCD]" />
                Team Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* New Update Input - Only show for members */}
              {canEdit && (
                <div className="mb-6 flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0 border-2 border-border">
                    <AvatarImage src={currentUserProfile?.avatar || undefined} />
                    <AvatarFallback className="bg-[#AEC6FF]">
                      {getAvatarInitials(currentUserProfile?.full_name, currentUserProfile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Share a progress update with your team..."
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                      className="min-h-20 border-2"
                    />
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        className="border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                        onClick={async () => {
                          if (!newUpdate.trim() || !currentUserProfile?.id) return
                          try {
                            const { data, error } = await createProjectUpdate(projectId, currentUserProfile.id, {
                              title: newUpdate.trim().slice(0, 100), // Use first 100 chars as title
                              content: newUpdate.trim(),
                            })
                            if (error) throw error
                            // Refresh updates
                            const { data: updatesData } = await getProjectUpdates(projectId)
                            if (updatesData) {
                              setUpdates(updatesData as any)
                            }
                            setNewUpdate("")
                          } catch (err: any) {
                            alert(`Failed to post update: ${err.message}`)
                          }
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Updates List */}
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">No updates yet.</p>
                ) : (
                  updates.map((update) => {
                    const author = update.profiles
                    const authorName = author?.full_name || author?.username || "Unknown"
                    const authorInitials = getAvatarInitials(author?.full_name, author?.username)
                    return (
                      <div
                        key={update.id}
                        className="border-2 border-border bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0 border-2 border-border">
                            <AvatarImage src={author?.avatar || undefined} />
                            <AvatarFallback className="bg-[#AEC6FF]">{authorInitials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{authorName}</span>
                              <span className="text-xs text-muted-foreground">{formatTimestamp(update.created_at)}</span>
                            </div>
                            <p className="mt-2 text-sm font-semibold">{update.title}</p>
                            {update.content && <p className="mt-1 text-sm leading-relaxed">{update.content}</p>}
                            {update.link_url && (
                              <a
                                href={update.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-sm text-[#3A5FCD] hover:underline"
                              >
                                {update.link_text || update.link_url}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-mono text-base sm:text-lg">
                  <Users className="h-5 w-5 text-[#3A5FCD]" />
                  Team Members
                </CardTitle>
                {canEdit && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-mono">Add Team Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="member-email">Member Username</Label>
                          <Input id="member-email" placeholder="Enter username" className="border-2" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="member-role">Role</Label>
                          <Input id="member-role" placeholder="e.g., Frontend Dev" className="border-2" />
                        </div>
                        <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]">
                          Add Member
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  members.map((member) => {
                    const profile = member.profiles
                    const memberName = profile?.full_name || profile?.username || "Unknown"
                    const memberInitials = getAvatarInitials(profile?.full_name, profile?.username)
                    return (
                      <div
                        key={member.member_id}
                        className="flex items-center gap-3 border-2 border-border bg-white p-3 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
                      >
                        <Avatar className="h-10 w-10 border-2 border-border">
                          <AvatarImage src={profile?.avatar || undefined} />
                          <AvatarFallback className="bg-[#AEC6FF]">{memberInitials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{memberName}</p>
                          <p className="text-xs text-muted-foreground">{member.role || "Member"}</p>
                          {profile?.skills && profile.skills.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {profile.skills.slice(0, 3).map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="border border-[#3A5FCD] bg-[#AEC6FF]/20 px-1.5 py-0 text-[10px] text-[#3A5FCD]"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (profile?.username) {
                              router.push(`/profile/${profile.username}`)
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

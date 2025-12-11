"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Github, Linkedin, Twitter, Globe, Zap, Award, ExternalLink, GraduationCap, MapPin, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { useAuth } from "@/contexts/auth-context"
import { updateProfile, getProjectsByMember, Project } from "@/lib/database"
import { supabase } from "@/lib/supabase"

export function ProfileContent() {
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    location: "",
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
    avatar: "",
  })

  // Fetch user's projects
  useEffect(() => {
    async function fetchUserProjects() {
      if (!profile?.id) {
        setUserProjects([])
        setLoadingProjects(false)
        return
      }

      try {
        setLoadingProjects(true)
        const { data, error } = await getProjectsByMember(profile.id)
        if (error) {
          console.error("Error fetching user projects:", error)
          setUserProjects([])
        } else {
          setUserProjects(data || [])
        }
      } catch (error) {
        console.error("Error fetching user projects:", error)
        setUserProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchUserProjects()
  }, [profile?.id])

  // Generate avatar initials
  const avatarInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile?.username?.slice(0, 2).toUpperCase() || "??"

  const profileData = {
    name: profile?.full_name || profile?.username || "Unknown",
    avatar: avatarInitials,
    track: profile?.track || null, // Don't show "Unknown", show nothing if no track
    college: profile?.college || "Not specified",
    location: profile?.location || "Not specified",
    bio: profile?.bio || "No bio yet.",
    skills: profile?.skills || [],
    socials: {
      github: (profile?.socials as any)?.github || "",
      linkedin: (profile?.socials as any)?.linkedin || "",
      twitter: (profile?.socials as any)?.twitter || "",
      website: (profile?.socials as any)?.website || "",
    },
    stats: {
      xp: profile?.xp || 0,
      badges: profile?.badges || 0,
      projects: userProjects.length,
      rank: 0, // Would need to calculate from leaderboard
    },
  }

  // Initialize form data when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsEditOpen(open)
    // Reset saving state when dialog closes
    if (!open) {
      setIsSaving(false)
    }
    // Initialize form data when dialog opens
    if (open && profile) {
      setFormData({
        name: profile.full_name || profile.username || "",
        college: profile.college || "",
        location: profile.location || "",
        bio: profile.bio || "",
        skills: (profile.skills || []).join(", "),
        github: (profile.socials as any)?.github || "",
        linkedin: (profile.socials as any)?.linkedin || "",
        avatar: profile.avatar || "",
      })
    }
  }

  const handleSave = async () => {
    if (!profile?.id) {
      alert("You must be logged in to update your profile")
      return
    }

    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.warn("Save already in progress, ignoring duplicate request")
      return
    }

    setIsSaving(true)
    try {
      // Verify we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error("No active session. Please log in again.")
      }
      
      console.log("Active session found for user:", session.user.id)
      // Parse skills from comma-separated string
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      // Update socials object - preserve existing socials
      const existingSocials = profile.socials && typeof profile.socials === 'object' ? profile.socials : {}
      const socials: any = {
        ...(existingSocials as any),
      }
      
      // Update socials fields
      const githubValue = formData.github.trim()
      const linkedinValue = formData.linkedin.trim()
      
      if (githubValue) {
        socials.github = githubValue
      } else {
        // Remove github if empty, but keep other socials
        delete socials.github
      }
      
      if (linkedinValue) {
        socials.linkedin = linkedinValue
      } else {
        // Remove linkedin if empty, but keep other socials
        delete socials.linkedin
      }
      
      // If socials object is empty, set to null
      const finalSocials = Object.keys(socials).length > 0 ? socials : null

      // Prepare update object - always include all fields (null if empty)
      const updates: any = {
        full_name: formData.name.trim() || null,
        college: formData.college.trim() || null,
        location: formData.location.trim() || null,
        bio: formData.bio.trim() || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        socials: finalSocials,
        avatar: formData.avatar.trim() || null,
      }

      console.log("Updating profile with:", JSON.stringify(updates, null, 2))
      console.log("Profile ID:", profile.id)
      
      const { data, error } = await updateProfile(profile.id, updates)

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log("Profile updated successfully:", data)

      // Close dialog and reset saving state first
      setIsEditOpen(false)
      setIsSaving(false)
      
      // Refresh profile data in background (don't wait for it)
      refreshProfile().catch((refreshError) => {
        console.warn("Profile refresh warning:", refreshError)
        // Non-critical - update was successful
      })
      
      // Show success message
      alert("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      const errorMessage = error?.message || error?.error_description || error?.details || "Failed to update profile. Please check console for details."
      alert(`Error: ${errorMessage}`)
      setIsSaving(false)
    }
  }
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border-4 border-border sm:h-24 sm:w-24">
                <AvatarImage src={profile?.avatar || undefined} />
                <AvatarFallback className="bg-[#AEC6FF] text-xl font-bold sm:text-2xl">
                  {profileData.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="font-mono text-xl font-bold sm:text-2xl">{profileData.name}</h1>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start sm:text-sm">
                  {profileData.track && (
                    <Badge variant="outline" className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]">
                      {profileData.track}
                    </Badge>
                  )}
                  {profile?.cohort && (
                    <Badge variant="outline" className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]">
                      {profile.cohort}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                    {profileData.college}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    {profileData.location}
                  </span>
                </div>
                {(profileData.socials.github ||
                  profileData.socials.linkedin ||
                  profileData.socials.twitter ||
                  profileData.socials.website) && (
                  <div className="mt-3 flex justify-center gap-2 sm:justify-start">
                    {profileData.socials.github && (
                      <a
                        href={`https://github.com/${profileData.socials.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center border-2 border-border bg-white shadow-[2px_2px_0px_0px_#1A1A1A] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {profileData.socials.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profileData.socials.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center border-2 border-border bg-white shadow-[2px_2px_0px_0px_#1A1A1A] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {profileData.socials.twitter && (
                      <a
                        href={`https://twitter.com/${profileData.socials.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center border-2 border-border bg-white shadow-[2px_2px_0px_0px_#1A1A1A] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {profileData.socials.website && (
                      <a
                        href={`https://${profileData.socials.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center border-2 border-border bg-white shadow-[2px_2px_0px_0px_#1A1A1A] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Dialog open={isEditOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-mono">Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile information including name, bio, skills, and social links.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex justify-center">
                    <ImageUpload
                      currentImage={formData.avatar}
                      onImageUploaded={(url) => setFormData({ ...formData, avatar: url })}
                      onImageRemoved={() => setFormData({ ...formData, avatar: "" })}
                      size="md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-college">College</Label>
                      <Input
                        id="edit-college"
                        value={formData.college}
                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
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
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="min-h-24 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-skills">Skills (comma separated)</Label>
                    <Input
                      id="edit-skills"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-github">GitHub Username</Label>
                      <Input
                        id="edit-github"
                        value={formData.github}
                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-linkedin">LinkedIn Username</Label>
                      <Input
                        id="edit-linkedin"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-2 bg-transparent" disabled={isSaving}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#AEC6FF] sm:h-12 sm:w-12">
              <Zap className="h-5 w-5 text-[#3A5FCD] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total XP</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profileData.stats.xp.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#E7B75F]/30 sm:h-12 sm:w-12">
              <Award className="h-5 w-5 text-[#E7B75F] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Badges</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profileData.stats.badges}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#F7F4EB] sm:h-12 sm:w-12">
              <Globe className="h-5 w-5 text-[#3A5FCD] sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Projects</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profileData.stats.projects}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-[#AEC6FF] sm:h-12 sm:w-12">
              <span className="font-mono text-base font-bold text-[#3A5FCD] sm:text-lg">#</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Rank</p>
              <p className="font-mono text-lg font-bold sm:text-2xl">{profileData.stats.rank}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* About & Skills */}
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <p className="text-sm leading-relaxed sm:text-base">{profileData.bio}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-2 border-border bg-white px-2 py-1 text-xs sm:px-3 sm:text-sm"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Projects / Proof of Work</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loadingProjects ? (
                <div className="text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  <p className="mt-2">Loading projects...</p>
                </div>
              ) : userProjects.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  No projects yet. Start building!
                </div>
              ) : (
                <div className="space-y-4">
                  {userProjects.map((project) => (
                    <Card
                      key={project.id}
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="group cursor-pointer border-2 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all hover:shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Project Icon/Avatar */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-border bg-[#AEC6FF]">
                            <Zap className="h-6 w-6 text-[#3A5FCD]" />
                          </div>
                          {/* Project Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-mono text-base font-bold group-hover:text-[#3A5FCD] sm:text-lg">
                                  {project.name}
                                </h3>
                                {project.description && (
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-[#3A5FCD]" />
                            </div>
                            {project.track && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                <Badge
                                  variant="outline"
                                  className="border border-[#3A5FCD] bg-[#AEC6FF]/20 px-1.5 py-0 text-[10px] text-[#3A5FCD]"
                                >
                                  {project.track}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges & Certificates */}
        <div className="space-y-6">
          {/* Badges */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Badges</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-4 gap-2">
                {profileData.stats.badges === 0 ? (
                  <p className="col-span-4 text-center text-sm text-muted-foreground">No badges yet</p>
                ) : (
                  Array.from({ length: profileData.stats.badges }).map((_, i) => (
                    <div
                      key={i}
                      className="group relative flex h-10 w-10 items-center justify-center border-2 border-border bg-[#E7B75F]/30 sm:h-12 sm:w-12"
                    >
                      <Award className="h-5 w-5 text-[#E7B75F] sm:h-6 sm:w-6" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base sm:text-lg">Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                {profile?.certificates && profile.certificates.length > 0 ? (
                  profile.certificates.map((cert: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-2 border-border bg-white p-2 shadow-[2px_2px_0px_0px_#1A1A1A] sm:p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium sm:text-sm">{cert.name || "Certificate"}</p>
                        {cert.date && <p className="text-xs text-muted-foreground">{cert.date}</p>}
                      </div>
                      <GraduationCap className="h-4 w-4 shrink-0 text-[#3A5FCD] sm:h-5 sm:w-5" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No certificates yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

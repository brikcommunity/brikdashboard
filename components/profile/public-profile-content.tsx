"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, Linkedin, Twitter, Globe, Zap, Award, ExternalLink, GraduationCap, MapPin, Loader2, ArrowLeft } from "lucide-react"
import { getProfileByUsername, getProjectsByMember, Project, Profile } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface PublicProfileContentProps {
  username: string
}

export function PublicProfileContent({ username }: PublicProfileContentProps) {
  const router = useRouter()
  const { profile: currentUserProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile by username
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        setError(null)
        const { data, error: profileError } = await getProfileByUsername(username)
        
        if (profileError) {
          setError("Profile not found")
          setProfile(null)
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile")
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

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

    if (profile) {
      fetchUserProjects()
    }
  }, [profile?.id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">{error || "Profile not found"}</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Generate avatar initials
  const avatarInitials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.username?.slice(0, 2).toUpperCase() || "??"

  const profileData = {
    name: profile.full_name || profile.username || "Unknown",
    avatar: avatarInitials,
    track: profile.track || null, // Don't show "Unknown", show nothing if no track
    college: profile.college || "Not specified",
    location: profile.location || "Not specified",
    bio: profile.bio || "No bio yet.",
    skills: profile.skills || [],
    socials: {
      github: (profile.socials as any)?.github || "",
      linkedin: (profile.socials as any)?.linkedin || "",
      twitter: (profile.socials as any)?.twitter || "",
      website: (profile.socials as any)?.website || "",
    },
    stats: {
      xp: profile.xp || 0,
      badges: profile.badges || 0,
      projects: userProjects.length,
      rank: 0,
    },
  }

  const isOwnProfile = currentUserProfile?.id === profile.id

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

      {/* Profile Header */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border-4 border-border sm:h-24 sm:w-24">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="bg-[#AEC6FF] text-xl font-bold sm:text-2xl">
                  {profileData.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="font-mono text-xl font-bold sm:text-2xl">{profileData.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {profileData.track && (
                    <Badge variant="outline" className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]">
                      {profileData.track}
                    </Badge>
                  )}
                  {profile.cohort && (
                    <Badge variant="outline" className="border-2 border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]">
                      {profile.cohort}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{profileData.college}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{profileData.location}</span>
                  </div>
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
            {isOwnProfile && (
              <Button
                onClick={() => router.push("/profile")}
                className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:w-auto"
              >
                Edit My Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-[#AEC6FF]">
                <Zap className="h-6 w-6 text-[#3A5FCD]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profileData.stats.xp}</p>
                <p className="text-xs text-muted-foreground">XP Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-[#AEC6FF]">
                <Award className="h-6 w-6 text-[#3A5FCD]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profileData.stats.badges}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-[#AEC6FF]">
                <ExternalLink className="h-6 w-6 text-[#3A5FCD]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profileData.stats.projects}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-[#AEC6FF]">
                <Award className="h-6 w-6 text-[#3A5FCD]" />
              </div>
              <div>
                <p className="text-2xl font-bold">#{profileData.stats.rank || "—"}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bio */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="font-mono text-base sm:text-lg">About</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <p className="text-sm text-muted-foreground sm:text-base">{profileData.bio}</p>
        </CardContent>
      </Card>

      {/* Skills */}
      {profileData.skills.length > 0 && (
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
      )}

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
              No projects yet.
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
  )
}


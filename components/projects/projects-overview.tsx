"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Star, Users, Calendar, TrendingUp, Loader2 } from "lucide-react"
import { useProjects } from "@/hooks/use-data"
import { getProjectMembers, getProjectUpdates } from "@/lib/database"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"

const stageColors: Record<string, string> = {
    Idea: "bg-[#AEC6FF]/30 text-[#3A5FCD] border-[#3A5FCD]",
    Prototype: "bg-[#5C7AEA]/20 text-[#5C7AEA] border-[#5C7AEA]",
    MVP: "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]",
    Growth: "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]",
}

const trackColors: Record<string, string> = {
    Engineering: "border-[#3A5FCD] bg-[#AEC6FF]/30 text-[#3A5FCD]",
    Climate: "border-[#2D6A4F] bg-[#95D5B2]/30 text-[#2D6A4F]",
    Health: "border-[#E63946] bg-[#FFCCD5]/30 text-[#E63946]",
}

export function ProjectsOverview() {
    const router = useRouter()
    const { data: projects, loading } = useProjects()
    const [projectsWithMembers, setProjectsWithMembers] = useState<any[]>([])

    useEffect(() => {
        async function fetchProjectDetails() {
            if (!projects || projects.length === 0) return

            const projectsWithDetails = await Promise.all(
                projects.map(async (project) => {
                    const [membersResult, updatesResult] = await Promise.all([
                        getProjectMembers(project.id),
                        getProjectUpdates(project.id),
                    ])

                    const members = membersResult.data || []
                    const updates = updatesResult.data || []

                    // Calculate days active
                    const daysActive = project.created_at
                        ? Math.floor((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 0

                    return {
                        ...project,
                        members: members.map((m: any) => {
                            const initials = m.profiles?.full_name
                                ? m.profiles.full_name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                : m.profiles?.username?.slice(0, 2).toUpperCase() || "??"
                            return {
                                id: m.member_id,
                                name: m.profiles?.full_name || m.profiles?.username || "Unknown",
                                avatar: initials,
                                avatarUrl: m.profiles?.avatar || null,
                            }
                        }),
                        stats: {
                            updates: updates.length,
                            members: members.length,
                            daysActive,
                        },
                    }
                })
            )

            setProjectsWithMembers(projectsWithDetails)
        }

        fetchProjectDetails()
    }, [projects])

    const handleProjectClick = (projectId: string) => {
        router.push(`/projects/${projectId}`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">My Projects</h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                        Projects you're currently working on
                    </p>
                </div>
                <Badge variant="outline" className="border-2 border-border text-sm">
                    {projectsWithMembers.length} Active
                </Badge>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
                        <p className="mt-4 text-sm text-muted-foreground">Loading projects...</p>
                    </div>
                </div>
            ) : projectsWithMembers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No projects found</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {projectsWithMembers.map((project) => (
                    <Card
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className="group cursor-pointer border-2 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    >
                        <CardHeader className="border-b-2 border-border pb-4">
                            <div className="space-y-3">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {project.featured && (
                                        <Badge className="border-2 border-[#E7B75F] bg-[#E7B75F]/20 text-[#B8860B]">
                                            <Star className="mr-1 h-3 w-3 fill-current" />
                                            Featured
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className={`border-2 ${stageColors[project.stage]}`}>
                                        {project.stage}
                                    </Badge>
                                    <Badge variant="outline" className={`border-2 ${trackColors[project.track] || "border-border"}`}>
                                        {project.track}
                                    </Badge>
                                </div>

                                {/* Project Name */}
                                <CardTitle className="font-mono text-lg leading-tight group-hover:text-[#3A5FCD] transition-colors">
                                    {project.name}
                                </CardTitle>

                                {/* Team Name */}
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    {project.team_name || "No team name"}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-4">
                            {/* Description */}
                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                {project.description}
                            </p>

                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium">Progress</span>
                                    <span className="text-muted-foreground">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between border-t-2 border-border pt-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {project.stats?.updates || 0} updates
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {project.stats?.daysActive || 0} days
                                </div>
                            </div>

                            {/* Team Members */}
                            {project.members && project.members.length > 0 && (
                                <div className="flex items-center gap-2 border-t-2 border-border pt-4">
                                    <div className="flex -space-x-2">
                                        {project.members.slice(0, 4).map((member: any) => (
                                            <Avatar
                                                key={member.id}
                                                className="h-8 w-8 border-2 border-white"
                                                title={member.name}
                                            >
                                                <AvatarImage src={member.avatarUrl || undefined} />
                                                <AvatarFallback className="bg-[#AEC6FF] text-xs font-medium">
                                                    {member.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                    {project.members.length > 4 && (
                                        <span className="text-xs text-muted-foreground">+{project.members.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Zap, Loader2 } from "lucide-react"
import { useProfiles } from "@/hooks/use-data"
import { useAuth } from "@/contexts/auth-context"

const tracks = ["All Tracks", "ai/ml", "web dev", "app dev", "ui/ux", "data science"]
const cohorts = ["All Cohorts", "s25"]
const timeRanges = ["All Time", "This Month", "This Week"]

export function LeaderboardContent() {
  const { data: profiles, loading } = useProfiles()
  const { profile: currentProfile } = useAuth()
  const [activeTrack, setActiveTrack] = useState("All Tracks")
  const [activeCohort, setActiveCohort] = useState("All Cohorts")

  // Process leaderboard data from profiles
  const leaderboardData = useMemo(() => {
    if (!profiles) return []

    let filtered = profiles.filter((p) => {
      // Normalize track comparison (handle null, case-insensitive, trim whitespace)
      const profileTrack = p.track ? p.track.trim() : null
      const matchesTrack = 
        activeTrack === "All Tracks" || 
        (profileTrack && profileTrack.toLowerCase() === activeTrack.toLowerCase())
      
      // Normalize cohort comparison (handle null, case-insensitive, trim whitespace)
      const profileCohort = p.cohort ? p.cohort.trim() : null
      const matchesCohort = 
        activeCohort === "All Cohorts" || 
        (profileCohort && profileCohort.toLowerCase() === activeCohort.toLowerCase())
      
      return matchesTrack && matchesCohort
    })

    // Sort by XP descending
    filtered = filtered.sort((a, b) => (b.xp || 0) - (a.xp || 0))

    // Add rank and avatar
    return filtered.map((profile, index) => {
      const initials = profile.full_name
        ? profile.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : profile.username.slice(0, 2).toUpperCase()

      return {
        rank: index + 1,
        id: profile.id,
        name: profile.full_name || profile.username,
        avatar: initials,
        xp: profile.xp || 0,
        badges: profile.badges || 0,
        track: profile.track || null,
        cohort: profile.cohort || null,
        isCurrentUser: currentProfile?.id === profile.id,
      }
    })
  }, [profiles, activeTrack, activeCohort, currentProfile])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-[#E7B75F]" />
      case 2:
        return <Medal className="h-5 w-5 text-[#C0C0C0]" />
      case 3:
        return <Medal className="h-5 w-5 text-[#CD7F32]" />
      default:
        return <span className="font-mono text-sm font-bold">{rank}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">See how you rank among fellow builders</p>
      </div>

      {/* Top 3 Podium */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#3A5FCD]" />
        </div>
      ) : leaderboardData.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {leaderboardData.slice(0, 3).map((user, index) => (
            <Card
            key={user.rank}
            className={`border-2 shadow-[4px_4px_0px_0px_#1A1A1A] ${
              index === 0 ? "sm:order-2" : index === 1 ? "sm:order-1" : "sm:order-3"
            }`}
          >
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center border-2 border-border sm:mb-4 sm:h-16 sm:w-16 ${
                  index === 0 ? "bg-[#E7B75F]" : index === 1 ? "bg-[#C0C0C0]" : "bg-[#CD7F32]"
                }`}
              >
                {index === 0 ? (
                  <Trophy className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                ) : (
                  <Medal className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                )}
              </div>
              <Avatar className="h-12 w-12 border-2 border-border sm:h-16 sm:w-16">
                <AvatarImage src={`/placeholder.svg?height=64&width=64&query=${user.name} portrait`} />
                <AvatarFallback className="bg-[#AEC6FF] text-sm font-bold sm:text-base">{user.avatar}</AvatarFallback>
              </Avatar>
              <h3 className="mt-2 font-mono text-sm font-bold sm:mt-3 sm:text-base">{user.name}</h3>
              {user.track && (
                <Badge variant="outline" className="mt-1 border-2 border-[#3A5FCD] text-xs text-[#3A5FCD]">
                  {user.track}
                </Badge>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs sm:mt-4 sm:gap-4 sm:text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-[#3A5FCD] sm:h-4 sm:w-4" />
                  <span className="font-mono font-bold">{user.xp.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-[#E7B75F] sm:h-4 sm:w-4" />
                  <span className="font-mono font-bold">{user.badges}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {tracks.map((track) => (
            <Button
              key={track}
              variant={activeTrack === track ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTrack(track)}
              className={
                activeTrack === track
                  ? "shrink-0 border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                  : "shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
              }
            >
              {track}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {cohorts.map((cohort) => (
            <Button
              key={cohort}
              variant={activeCohort === cohort ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCohort(cohort)}
              className={
                activeCohort === cohort
                  ? "shrink-0 border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                  : "shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
              }
            >
              {cohort}
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="font-mono text-base sm:text-lg">Full Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-border bg-[#F7F4EB]">
                  <th className="px-3 py-2 text-left font-mono text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">Rank</th>
                  <th className="px-3 py-2 text-left font-mono text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                    Builder
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">Track</th>
                  <th className="px-3 py-2 text-right font-mono text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">XP</th>
                  <th className="px-3 py-2 text-right font-mono text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                    Badges
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading leaderboard...</span>
                      </div>
                    </td>
                  </tr>
                ) : leaderboardData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No data found</p>
                    </td>
                  </tr>
                ) : (
                  leaderboardData.map((user) => (
                  <tr
                    key={user.rank}
                    className={`border-b-2 border-border transition-colors hover:bg-[#AEC6FF]/10 ${
                      user.isCurrentUser ? "bg-[#AEC6FF]/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex h-7 w-7 items-center justify-center border-2 border-border bg-white sm:h-8 sm:w-8">
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-7 w-7 border-2 border-border sm:h-8 sm:w-8">
                          <AvatarImage src={`/placeholder.svg?height=32&width=32&query=${user.name} portrait`} />
                          <AvatarFallback className="bg-[#AEC6FF] text-xs font-bold">{user.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {user.name}
                          {user.isCurrentUser && (
                            <Badge className="ml-1 border-2 border-[#3A5FCD] bg-[#3A5FCD] text-xs text-white sm:ml-2">
                              You
                            </Badge>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      {user.track ? (
                        <Badge variant="outline" className="border-2 border-border text-xs">
                          {user.track}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="h-3 w-3 text-[#3A5FCD] sm:h-4 sm:w-4" />
                        <span className="font-mono text-xs font-bold sm:text-sm">{user.xp.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Award className="h-3 w-3 text-[#E7B75F] sm:h-4 sm:w-4" />
                        <span className="font-mono text-xs font-bold sm:text-sm">{user.badges}</span>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Zap,
  Award,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  History,
  Gift,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getProfiles, updateProfile, getAwards, createAward, type Profile } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { Loader2 } from "lucide-react"

interface LeaderboardEntry {
  id: number
  name: string
  avatar: string
  avatarUrl?: string | null
  track: string
  cohort: string
  xp: number
  badges: number
  rank: number
  previousRank: number
}

interface XPTransaction {
  id: number
  memberId: number
  memberName: string
  amount: number
  reason: string
  type: "award" | "deduct" | "bonus"
  date: string
  awardedBy: string
}

interface BadgeType {
  id: number
  name: string
  description: string
  icon: string
  xpReward: number
  criteria: string
}

const initialLeaderboard: LeaderboardEntry[] = [
  {
    id: 1,
    name: "Sarah Chen",
    avatar: "SC",
    track: "Engineering",
    cohort: "Fall 2024",
    xp: 4850,
    badges: 15,
    rank: 1,
    previousRank: 1,
  },
  {
    id: 2,
    name: "Alex Kumar",
    avatar: "AK",
    track: "Design",
    cohort: "Fall 2024",
    xp: 4320,
    badges: 12,
    rank: 2,
    previousRank: 3,
  },
  {
    id: 3,
    name: "Jordan Lee",
    avatar: "JL",
    track: "Product",
    cohort: "Spring 2024",
    xp: 3980,
    badges: 11,
    rank: 3,
    previousRank: 2,
  },
  {
    id: 4,
    name: "Maria Garcia",
    avatar: "MG",
    track: "Engineering",
    cohort: "Fall 2024",
    xp: 3650,
    badges: 10,
    rank: 4,
    previousRank: 5,
  },
  {
    id: 5,
    name: "James Wilson",
    avatar: "JW",
    track: "Engineering",
    cohort: "Spring 2024",
    xp: 3420,
    badges: 9,
    rank: 5,
    previousRank: 4,
  },
  {
    id: 6,
    name: "Emily Davis",
    avatar: "ED",
    track: "Design",
    cohort: "Fall 2024",
    xp: 3180,
    badges: 8,
    rank: 6,
    previousRank: 7,
  },
  {
    id: 7,
    name: "John Doe",
    avatar: "JD",
    track: "Engineering",
    cohort: "Fall 2024",
    xp: 2450,
    badges: 8,
    rank: 7,
    previousRank: 6,
  },
  {
    id: 8,
    name: "Lisa Thompson",
    avatar: "LT",
    track: "Product",
    cohort: "Spring 2024",
    xp: 2380,
    badges: 7,
    rank: 8,
    previousRank: 8,
  },
]

const initialTransactions: XPTransaction[] = [
  {
    id: 1,
    memberId: 1,
    memberName: "Sarah Chen",
    amount: 500,
    reason: "Won Hackathon 2024",
    type: "award",
    date: "2 hours ago",
    awardedBy: "Admin",
  },
  {
    id: 2,
    memberId: 2,
    memberName: "Alex Kumar",
    amount: 200,
    reason: "Completed Design Challenge",
    type: "award",
    date: "1 day ago",
    awardedBy: "Admin",
  },
  {
    id: 3,
    memberId: 3,
    memberName: "Jordan Lee",
    amount: -50,
    reason: "Missed deadline",
    type: "deduct",
    date: "2 days ago",
    awardedBy: "System",
  },
  {
    id: 4,
    memberId: 4,
    memberName: "Maria Garcia",
    amount: 1000,
    reason: "Quarterly bonus",
    type: "bonus",
    date: "3 days ago",
    awardedBy: "Admin",
  },
]

const initialBadges: BadgeType[] = [
  {
    id: 1,
    name: "First Steps",
    description: "Complete your first task",
    icon: "🎯",
    xpReward: 50,
    criteria: "Complete 1 task",
  },
  {
    id: 2,
    name: "Hackathon Hero",
    description: "Participate in a hackathon",
    icon: "🏆",
    xpReward: 200,
    criteria: "Join any hackathon",
  },
  {
    id: 3,
    name: "Team Player",
    description: "Collaborate on 5 projects",
    icon: "🤝",
    xpReward: 150,
    criteria: "5 collaborative projects",
  },
  {
    id: 4,
    name: "Code Master",
    description: "Submit 50 code contributions",
    icon: "💻",
    xpReward: 300,
    criteria: "50 code submissions",
  },
  {
    id: 5,
    name: "Design Guru",
    description: "Complete 10 design challenges",
    icon: "🎨",
    xpReward: 250,
    criteria: "10 design challenges",
  },
]

type TabType = "rankings" | "xp-management" | "badges" | "settings"

export function AdminLeaderboardContent() {
  const { profile: currentProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("rankings")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [transactions, setTransactions] = useState<XPTransaction[]>([])
  const [badges, setBadges] = useState<BadgeType[]>(initialBadges)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isAwardXPOpen, setIsAwardXPOpen] = useState(false)
  const [isCreateBadgeOpen, setIsCreateBadgeOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [deleteBadgeId, setDeleteBadgeId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [xpFormData, setXPFormData] = useState({
    memberId: "",
    amount: "",
    reason: "",
    type: "award" as "award" | "deduct" | "bonus",
  })

  const [badgeFormData, setBadgeFormData] = useState({
    name: "",
    description: "",
    icon: "🏆",
    xpReward: "",
    criteria: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      await Promise.all([fetchLeaderboard(), fetchTransactions()])
    } catch (error) {
      // Error fetching data
    } finally{
      setLoading(false)
    }
  }

  async function fetchLeaderboard() {
    try {
      const { data: profiles, error } = await getProfiles()
      if (error) throw error

      const leaderboardData: LeaderboardEntry[] = (profiles || []).map((profile: Profile, index: number) => {
        const initials = (profile.full_name || profile.username).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        return {
          id: parseInt(profile.id.slice(0, 8), 16) || index + 1, // Convert UUID to number for compatibility
          name: profile.full_name || profile.username,
          avatar: initials,
          avatarUrl: profile.avatar || null,
          track: profile.track || "General",
          cohort: profile.cohort || "N/A",
          xp: profile.xp || 0,
          badges: profile.badges || 0,
          rank: index + 1,
          previousRank: index + 1, // We don't track previous rank, so use current
        }
      })

      setLeaderboard(leaderboardData)
    } catch (error) {
      // Error fetching leaderboard
    }
  }

  async function fetchTransactions() {
    try {
      const { data: awards, error } = await getAwards()
      if (error) throw error

      // Fetch profiles to get names
      const { data: profiles } = await getProfiles()
      const profilesMap = new Map((profiles || []).map((p: Profile) => [p.id, p]))

      const transactionsData: XPTransaction[] = (awards || []).map((award: any, index: number) => {
        const profile = profilesMap.get(award.user_id)
        return {
          id: index + 1,
          memberId: parseInt(award.user_id.slice(0, 8), 16) || index + 1,
          memberName: profile?.full_name || profile?.username || "Unknown",
          amount: 0, // Awards don't have amount, we'll need to calculate from XP changes
          reason: award.title || award.description || "Award",
          type: "award" as const,
          date: formatDistanceToNow(new Date(award.created_at), { addSuffix: true }),
          awardedBy: award.awarded_by || "Admin",
        }
      })

      setTransactions(transactionsData.slice(0, 50)) // Limit to recent 50
    } catch (error) {
      // Error fetching transactions
    }
  }

  const filteredLeaderboard = leaderboard.filter(
    (entry) =>
      entry.name.toLowerCase().includes(search.toLowerCase()) ||
      entry.track.toLowerCase().includes(search.toLowerCase()),
  )

  const handleAwardXP = async () => {
    if (!xpFormData.memberId || !xpFormData.amount || !xpFormData.reason) {
      alert("Please fill in all fields")
      return
    }

    if (!currentProfile?.id) {
      alert("You must be logged in to award XP")
      return
    }

    setIsSubmitting(true)
    try {
      // Find the profile by matching the ID
      const profile = (await getProfiles()).data?.find((p: Profile) => 
        parseInt(p.id.slice(0, 8), 16) === parseInt(xpFormData.memberId)
      )

      if (!profile) {
        alert("Member not found")
        return
      }

      const amount = parseInt(xpFormData.amount)
      const actualAmount = xpFormData.type === "deduct" ? -Math.abs(amount) : Math.abs(amount)
      const newXP = Math.max(0, (profile.xp || 0) + actualAmount)

      // Update profile XP
      const { error: updateError } = await updateProfile(profile.id, { xp: newXP })
      if (updateError) throw updateError

      // Create award record
      const { error: awardError } = await createAward({
        user_id: profile.id,
        title: xpFormData.reason,
        description: `${xpFormData.type === "deduct" ? "Deducted" : "Awarded"} ${Math.abs(amount)} XP`,
        awarded_by: currentProfile.id,
      })
      if (awardError) throw awardError

      // Refresh data
      await fetchData()

      setXPFormData({ memberId: "", amount: "", reason: "", type: "award" })
      setIsAwardXPOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to award XP")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateBadge = () => {
    const newBadge: BadgeType = {
      id: Date.now(),
      name: badgeFormData.name,
      description: badgeFormData.description,
      icon: badgeFormData.icon,
      xpReward: Number.parseInt(badgeFormData.xpReward) || 0,
      criteria: badgeFormData.criteria,
    }
    setBadges([...badges, newBadge])
    setBadgeFormData({ name: "", description: "", icon: "🏆", xpReward: "", criteria: "" })
    setIsCreateBadgeOpen(false)
  }

  const handleEditBadge = () => {
    if (!editingBadge) return
    setBadges(badges.map((b) => (b.id === editingBadge.id ? editingBadge : b)))
    setEditingBadge(null)
  }

  const handleDeleteBadge = (id: number) => {
    setBadges(badges.filter((b) => b.id !== id))
    setDeleteBadgeId(null)
  }

  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return { icon: TrendingUp, color: "text-green-600", text: `+${previous - current}` }
    if (current > previous) return { icon: TrendingDown, color: "text-red-600", text: `-${current - previous}` }
    return { icon: Minus, color: "text-muted-foreground", text: "0" }
  }

  const tabs = [
    { id: "rankings" as TabType, label: "Rankings", icon: Trophy },
    { id: "xp-management" as TabType, label: "XP Management", icon: Zap },
    { id: "badges" as TabType, label: "Badges", icon: Award },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ]

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
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Leaderboard Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage XP, badges, and leaderboard settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? "shrink-0 border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                : "shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
            }
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Rankings Tab */}
      {activeTab === "rankings" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A]"
              />
            </div>
            <Button
              onClick={() => setIsAwardXPOpen(true)}
              className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Award XP
            </Button>
          </div>

          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A] overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-border bg-[#F7F4EB]">
                      <TableHead className="font-mono font-bold w-16">Rank</TableHead>
                      <TableHead className="font-mono font-bold">Member</TableHead>
                      <TableHead className="font-mono font-bold hidden sm:table-cell">Track</TableHead>
                      <TableHead className="font-mono font-bold text-right">XP</TableHead>
                      <TableHead className="font-mono font-bold text-right hidden sm:table-cell">Badges</TableHead>
                      <TableHead className="font-mono font-bold text-center">Change</TableHead>
                      <TableHead className="font-mono font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading leaderboard...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLeaderboard.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No members found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeaderboard.map((entry) => {
                      const rankChange = getRankChange(entry.rank, entry.previousRank)
                      return (
                        <TableRow key={entry.id} className="border-b-2 border-border">
                          <TableCell>
                            <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-white">
                              {entry.rank <= 3 ? (
                                entry.rank === 1 ? (
                                  <Trophy className="h-4 w-4 text-[#E7B75F]" />
                                ) : (
                                  <Medal
                                    className={`h-4 w-4 ${entry.rank === 2 ? "text-[#C0C0C0]" : "text-[#CD7F32]"}`}
                                  />
                                )
                              ) : (
                                <span className="font-mono text-sm font-bold">{entry.rank}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border-2 border-border">
                                <AvatarImage src={entry.avatarUrl || undefined} />
                                <AvatarFallback className="bg-[#AEC6FF] text-xs font-bold">
                                  {entry.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{entry.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="border-2 border-[#3A5FCD] text-[#3A5FCD]">
                              {entry.track}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Zap className="h-3 w-3 text-[#3A5FCD]" />
                              <span className="font-mono text-sm font-bold">{entry.xp.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            <div className="flex items-center justify-end gap-1">
                              <Award className="h-3 w-3 text-[#E7B75F]" />
                              <span className="font-mono text-sm font-bold">{entry.badges}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`flex items-center justify-center gap-1 ${rankChange.color}`}>
                              <rankChange.icon className="h-3 w-3" />
                              <span className="font-mono text-xs">{rankChange.text}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-2">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setXPFormData({ ...xpFormData, memberId: entry.id.toString() })
                                    setIsAwardXPOpen(true)
                                  }}
                                >
                                  <Gift className="mr-2 h-4 w-4" />
                                  Award XP
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <History className="mr-2 h-4 w-4" />
                                  View History
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
        </div>
      )}

      {/* XP Management Tab */}
      {activeTab === "xp-management" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAwardXPOpen(true)}
              className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total XP Awarded</p>
                <p className="font-mono text-xl font-bold text-green-600">
                  +
                  {transactions
                    .filter((t) => t.amount > 0)
                    .reduce((acc, t) => acc + t.amount, 0)
                    .toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total XP Deducted</p>
                <p className="font-mono text-xl font-bold text-red-600">
                  {transactions
                    .filter((t) => t.amount < 0)
                    .reduce((acc, t) => acc + t.amount, 0)
                    .toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="font-mono text-xl font-bold">{transactions.length}</p>
              </CardContent>
            </Card>
            <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Avg XP per Member</p>
                <p className="font-mono text-xl font-bold">
                  {Math.round(leaderboard.reduce((acc, m) => acc + m.xp, 0) / leaderboard.length).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono text-base">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y-2 divide-border">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 flex items-center justify-center border-2 border-border ${
                          tx.type === "award" ? "bg-green-100" : tx.type === "bonus" ? "bg-[#E7B75F]/20" : "bg-red-100"
                        }`}
                      >
                        {tx.type === "award" ? (
                          <Zap className="h-5 w-5 text-green-600" />
                        ) : tx.type === "bonus" ? (
                          <Gift className="h-5 w-5 text-[#B8860B]" />
                        ) : (
                          <Minus className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.memberName}</p>
                        <p className="text-xs text-muted-foreground">{tx.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-13 sm:ml-0">
                      <span className={`font-mono font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount} XP
                      </span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreateBadgeOpen} onOpenChange={setIsCreateBadgeOpen}>
              <DialogTrigger asChild>
                <Button className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-mono">Create New Badge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Input
                        value={badgeFormData.icon}
                        onChange={(e) => setBadgeFormData({ ...badgeFormData, icon: e.target.value })}
                        className="border-2 text-center text-xl"
                        maxLength={2}
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={badgeFormData.name}
                        onChange={(e) => setBadgeFormData({ ...badgeFormData, name: e.target.value })}
                        placeholder="Badge name"
                        className="border-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={badgeFormData.description}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, description: e.target.value })}
                      placeholder="What is this badge for?"
                      className="border-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>XP Reward</Label>
                      <Input
                        type="number"
                        value={badgeFormData.xpReward}
                        onChange={(e) => setBadgeFormData({ ...badgeFormData, xpReward: e.target.value })}
                        placeholder="100"
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Criteria</Label>
                      <Input
                        value={badgeFormData.criteria}
                        onChange={(e) => setBadgeFormData({ ...badgeFormData, criteria: e.target.value })}
                        placeholder="Complete 5 tasks"
                        className="border-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" className="border-2 bg-transparent">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleCreateBadge}
                      className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                    >
                      Create Badge
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <Card key={badge.id} className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex items-center justify-center border-2 border-border bg-[#E7B75F]/20 text-2xl">
                        {badge.icon}
                      </div>
                      <div>
                        <h3 className="font-mono font-bold">{badge.name}</h3>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-2">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingBadge(badge)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600"
                          onClick={() => setDeleteBadgeId(badge.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-[#3A5FCD]" />
                      <span className="font-mono font-bold">+{badge.xpReward} XP</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{badge.criteria}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="font-mono">Leaderboard Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Leaderboard Visibility</Label>
                <select className="w-full border-2 border-border bg-white p-2">
                  <option>Public - Visible to all members</option>
                  <option>Private - Only visible to admins</option>
                  <option>Anonymous - Rankings shown without names</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ranking Period</Label>
                <select className="w-full border-2 border-border bg-white p-2">
                  <option>All Time</option>
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>By Cohort</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>XP Decay</Label>
                <select className="w-full border-2 border-border bg-white p-2">
                  <option>None - XP never decays</option>
                  <option>Monthly - 5% decay per month of inactivity</option>
                  <option>Quarterly - 10% decay per quarter of inactivity</option>
                </select>
              </div>
              <div className="flex items-center justify-between border-2 border-border p-4 bg-[#F7F4EB]">
                <div>
                  <p className="font-medium">Show Rank Changes</p>
                  <p className="text-xs text-muted-foreground">Display position changes on the leaderboard</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between border-2 border-border p-4 bg-[#F7F4EB]">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-xs text-muted-foreground">Send weekly leaderboard updates to members</p>
                </div>
                <input type="checkbox" className="h-5 w-5" />
              </div>
              <Button className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Award XP Dialog */}
      <Dialog open={isAwardXPOpen} onOpenChange={setIsAwardXPOpen}>
        <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Award/Deduct XP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <select
                value={xpFormData.memberId}
                onChange={(e) => setXPFormData({ ...xpFormData, memberId: e.target.value })}
                className="w-full border-2 border-border bg-white p-2"
              >
                <option value="">Select member...</option>
                {leaderboard.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.xp.toLocaleString()} XP)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={xpFormData.type}
                  onChange={(e) =>
                    setXPFormData({ ...xpFormData, type: e.target.value as "award" | "deduct" | "bonus" })
                  }
                  className="w-full border-2 border-border bg-white p-2"
                >
                  <option value="award">Award</option>
                  <option value="bonus">Bonus</option>
                  <option value="deduct">Deduct</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={xpFormData.amount}
                  onChange={(e) => setXPFormData({ ...xpFormData, amount: e.target.value })}
                  placeholder="100"
                  className="border-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={xpFormData.reason}
                onChange={(e) => setXPFormData({ ...xpFormData, reason: e.target.value })}
                placeholder="Why are you awarding/deducting XP?"
                className="border-2"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-2 bg-transparent">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleAwardXP}
                className={`border-2 border-border shadow-[4px_4px_0px_0px_#1A1A1A] ${
                  xpFormData.type === "deduct" ? "bg-red-600 hover:bg-red-700" : "bg-[#3A5FCD] hover:bg-[#5C7AEA]"
                } text-white`}
              >
                {xpFormData.type === "deduct" ? "Deduct XP" : "Award XP"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Badge Dialog */}
      <Dialog open={!!editingBadge} onOpenChange={(open) => !open && setEditingBadge(null)}>
        <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Badge</DialogTitle>
          </DialogHeader>
          {editingBadge && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={editingBadge.icon}
                    onChange={(e) => setEditingBadge({ ...editingBadge, icon: e.target.value })}
                    className="border-2 text-center text-xl"
                    maxLength={2}
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingBadge.name}
                    onChange={(e) => setEditingBadge({ ...editingBadge, name: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingBadge.description}
                  onChange={(e) => setEditingBadge({ ...editingBadge, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>XP Reward</Label>
                  <Input
                    type="number"
                    value={editingBadge.xpReward}
                    onChange={(e) =>
                      setEditingBadge({ ...editingBadge, xpReward: Number.parseInt(e.target.value) || 0 })
                    }
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Criteria</Label>
                  <Input
                    value={editingBadge.criteria}
                    onChange={(e) => setEditingBadge({ ...editingBadge, criteria: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="border-2 bg-transparent">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleEditBadge}
                  className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Badge Dialog */}
      <Dialog open={!!deleteBadgeId} onOpenChange={(open) => !open && setDeleteBadgeId(null)}>
        <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Delete Badge</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this badge? Members who have earned it will keep it, but it won't be
            available for new awards.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-2 bg-transparent">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteBadgeId && handleDeleteBadge(deleteBadgeId)}
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

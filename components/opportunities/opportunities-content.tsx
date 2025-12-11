"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Bookmark, BookmarkCheck, MapPin, Calendar, Building2, ExternalLink, Loader2 } from "lucide-react"
import { useOpportunities } from "@/hooks/use-data"
import { useAuth } from "@/contexts/auth-context"
import { saveOpportunity, unsaveOpportunity, getSavedOpportunities } from "@/lib/database"

const categories = ["All", "Internship", "Hackathon", "Grant", "Job", "BRIK Exclusive"]

export function OpportunitiesContent() {
  const { data: opportunities, loading } = useOpportunities()
  const { profile } = useAuth()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [savedItems, setSavedItems] = useState<string[]>([])

  // Fetch saved opportunities
  useEffect(() => {
    async function fetchSaved() {
      if (profile?.id) {
        const { data } = await getSavedOpportunities(profile.id)
        if (data) {
          setSavedItems(data.map((item: any) => item.opportunity_id))
        }
      }
    }
    fetchSaved()
  }, [profile?.id])

  const handleSaveToggle = async (opportunityId: string) => {
    if (!profile?.id) return

    if (savedItems.includes(opportunityId)) {
      await unsaveOpportunity(profile.id, opportunityId)
      setSavedItems(savedItems.filter((id) => id !== opportunityId))
    } else {
      await saveOpportunity(profile.id, opportunityId)
      setSavedItems([...savedItems, opportunityId])
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      (opp.organization && opp.organization.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === "All" || opp.category === activeCategory
    return matchesSearch && matchesCategory
  })


  const getCategoryColor = (category: string) => {
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
      {/* Coming Soon Message */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center border-2 border-border bg-[#AEC6FF]">
            <Calendar className="h-10 w-10 text-[#3A5FCD]" />
          </div>
          <h2 className="font-mono text-2xl font-bold sm:text-3xl">Coming Soon</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            The Opportunity Board is under development. Check back soon!
          </p>
        </CardContent>
      </Card>

      {/* Original Code - Hidden but kept for future use */}
      <div className="hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">Opportunity Board</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Discover internships, hackathons, grants, and more
          </p>
        </div>
        {profile?.role === "admin" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Opportunity
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono">Add New Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="opp-title">Title</Label>
                <Input id="opp-title" placeholder="Enter opportunity title" className="border-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opp-org">Organization</Label>
                  <Input id="opp-org" placeholder="Company name" className="border-2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opp-category">Category</Label>
                  <select id="opp-category" className="w-full border-2 border-border bg-white p-2">
                    {categories.slice(1).map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opp-deadline">Deadline</Label>
                  <Input id="opp-deadline" type="date" className="border-2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opp-location">Location</Label>
                  <Input id="opp-location" placeholder="City or Remote" className="border-2" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-description">Description</Label>
                <Textarea
                  id="opp-description"
                  placeholder="Describe the opportunity..."
                  className="min-h-24 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-link">Apply Link</Label>
                <Input id="opp-link" placeholder="https://..." className="border-2" />
              </div>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]">
                Add Opportunity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={
                activeCategory === category
                  ? "shrink-0 border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                  : "shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading opportunities...</p>
          </div>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No opportunities found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities.map((opp) => (
            <Dialog key={opp.id}>
            <Card className="flex h-full flex-col border-2 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={`border-2 ${getCategoryColor(opp.category)}`}>
                    {opp.category}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleSaveToggle(opp.id)
                    }}
                    className="text-[#3A5FCD] transition-colors hover:text-[#5C7AEA]"
                  >
                    {savedItems.includes(opp.id) ? (
                      <BookmarkCheck className="h-5 w-5 fill-[#3A5FCD]" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <CardTitle className="mt-2 text-base sm:text-lg">{opp.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{opp.organization}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{opp.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {opp.deadline
                      ? new Date(opp.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Open"}
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-2 bg-transparent shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                </div>
              </CardContent>
            </Card>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-mono">{opp.title}</DialogTitle>
                  <Badge variant="outline" className={`border-2 ${getCategoryColor(opp.category)}`}>
                    {opp.category}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{opp.organization}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {opp.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Deadline:{" "}
                    {opp.deadline
                      ? new Date(opp.deadline).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Open"}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{opp.description}</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                    asChild
                  >
                    <a href={opp.apply_link || "#"} target="_blank" rel="noopener noreferrer">
                      Apply Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 bg-transparent shadow-[2px_2px_0px_0px_#1A1A1A]"
                    onClick={() => handleSaveToggle(opp.id)}
                  >
                    {savedItems.includes(opp.id) ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

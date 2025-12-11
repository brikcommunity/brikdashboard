"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, FileText, Video, LinkIcon, FileSpreadsheet, Download, ExternalLink, Loader2 } from "lucide-react"
import { useResources } from "@/hooks/use-data"
import { useAuth } from "@/contexts/auth-context"

const types = ["All", "PDF", "Video", "Template", "Link"]

// Map category to icon
const getResourceIcon = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case "pdf":
      return FileText
    case "video":
      return Video
    case "template":
      return FileSpreadsheet
    case "link":
      return LinkIcon
    default:
      return FileText
  }
}

export function ResourcesContent() {
  const { data: resources, loading } = useResources()
  const { profile } = useAuth()
  const [search, setSearch] = useState("")
  const [activeType, setActiveType] = useState("All")
  const isAdmin = profile?.role === "admin"

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(search.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(search.toLowerCase()))
    const matchesType = activeType === "All" || resource.category === activeType
    return matchesSearch && matchesType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PDF":
        return "bg-[#AEC6FF]/30 text-[#3A5FCD] border-[#3A5FCD]"
      case "Video":
        return "bg-[#5C7AEA]/20 text-[#5C7AEA] border-[#5C7AEA]"
      case "Template":
        return "bg-[#E7B75F]/20 text-[#B8860B] border-[#E7B75F]"
      case "Link":
        return "bg-[#F7F4EB] text-[#1A1A1A] border-[#1A1A1A]"
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
            <FileText className="h-10 w-10 text-[#3A5FCD]" />
          </div>
          <h2 className="font-mono text-2xl font-bold sm:text-3xl">Coming Soon</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            The Resource Library is under development. Check back soon!
          </p>
        </CardContent>
      </Card>

      {/* Original Code - Hidden but kept for future use */}
      <div className="hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight">Resource Library</h1>
          <p className="mt-1 text-muted-foreground">Curated resources to help you build and grow</p>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            </DialogTrigger>
          <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono">Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="resource-title">Title</Label>
                <Input id="resource-title" placeholder="Enter resource title" className="border-2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-type">Type</Label>
                <select id="resource-type" className="w-full border-2 border-border bg-white p-2">
                  {types.slice(1).map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-description">Description</Label>
                <Textarea
                  id="resource-description"
                  placeholder="Describe the resource..."
                  className="min-h-24 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-link">Link or File</Label>
                <Input id="resource-link" placeholder="https://..." className="border-2" />
              </div>
              <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]">
                Add Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <Button
              key={type}
              variant={activeType === type ? "default" : "outline"}
              onClick={() => setActiveType(type)}
              className={
                activeType === type
                  ? "border-2 border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                  : "border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#F7F4EB]"
              }
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No resources found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResources.map((resource) => {
            const IconComponent = getResourceIcon(resource.category)
            return (
              <Dialog key={resource.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer border-2 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-[#AEC6FF]">
                          <IconComponent className="h-5 w-5 text-[#3A5FCD]" />
                        </div>
                        <Badge variant="outline" className={`border-2 ${getTypeColor(resource.category || "")}`}>
                          {resource.category || "Unknown"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2 text-base">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{resource.description || ""}</p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="font-mono">{resource.title}</DialogTitle>
                      <Badge variant="outline" className={`border-2 ${getTypeColor(resource.category || "")}`}>
                        {resource.category || "Unknown"}
                      </Badge>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex h-32 items-center justify-center border-2 border-dashed border-border bg-[#F7F4EB]">
                      <IconComponent className="h-12 w-12 text-[#3A5FCD]" />
                    </div>
                    {resource.description && <p className="text-sm leading-relaxed">{resource.description}</p>}
                    {resource.link && (
                      <div className="flex gap-2">
                        {resource.category === "Link" ? (
                          <Button
                            className="flex-1 border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                            asChild
                          >
                            <a href={resource.link} target="_blank" rel="noopener noreferrer">
                              Visit Link
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]"
                            asChild
                          >
                            <a href={resource.link} target="_blank" rel="noopener noreferrer">
                              Download
                              <Download className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}

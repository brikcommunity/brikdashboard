"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Plus, ImageIcon, Loader2 } from "lucide-react"
import { useCalendarEvents } from "@/hooks/use-data"
import { useAuth } from "@/contexts/auth-context"

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarContent() {
  const { data: events, loading } = useCalendarEvents()
  const { profile } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week">("month")
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null)
  const isAdmin = profile?.role === "admin"

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => {
      // Handle both date strings and full ISO datetime strings
      const eventDate = e.date ? new Date(e.date).toISOString().split('T')[0] : null
      return eventDate === dateStr
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthName = currentDate.toLocaleString("default", { month: "long" })

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#3A5FCD]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading calendar events...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-1 text-muted-foreground">Keep track of events and deadlines</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border-2 border-border shadow-[2px_2px_0px_0px_#1A1A1A]">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              onClick={() => setView("month")}
              className={view === "month" ? "bg-[#3A5FCD] text-white" : ""}
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              onClick={() => setView("week")}
              className={view === "week" ? "bg-[#3A5FCD] text-white" : ""}
            >
              Week
            </Button>
          </div>
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#5C7AEA] hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
            <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono">Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Event Title</Label>
                  <Input id="event-title" placeholder="Enter event title" className="border-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input id="event-date" type="date" className="border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-time">Time</Label>
                    <Input id="event-time" type="time" className="border-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-type">Type</Label>
                  <select id="event-type" className="w-full border-2 border-border bg-white p-2">
                    <option value="event">Event</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea id="event-description" placeholder="Add event details..." className="min-h-24 border-2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-image">Cover Image</Label>
                  <div className="flex items-center gap-2">
                    <Input id="event-image" type="file" accept="image/*" className="border-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">Optional: Add a cover image for your event</p>
                </div>
                <Button className="w-full border-2 border-border bg-[#3A5FCD] text-white shadow-[4px_4px_0px_0px_#1A1A1A]">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Calendar */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              className="border-2 shadow-[2px_2px_0px_0px_#1A1A1A] bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="font-mono text-xl">
              {monthName} {year}
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="border-2 shadow-[2px_2px_0px_0px_#1A1A1A] bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border-2 border-border bg-[#3A5FCD]" />
              <span>Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border-2 border-border bg-[#E7B75F]" />
              <span>Deadlines</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b-2 border-border">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="border-r-2 border-border p-3 text-center font-mono text-sm font-bold last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const today = new Date()
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

              return (
                <div
                  key={index}
                  className={`min-h-24 border-b-2 border-r-2 border-border p-2 last:border-r-0 ${
                    index >= days.length - 7 ? "border-b-0" : ""
                  } ${day ? "bg-white" : "bg-[#F7F4EB]"}`}
                >
                  {day && (
                    <>
                      <div
                        className={`mb-1 inline-flex h-7 w-7 items-center justify-center font-mono text-sm ${
                          isToday ? "border-2 border-border bg-[#3A5FCD] font-bold text-white" : ""
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event) => (
                          <Dialog key={event.id}>
                            <DialogTrigger asChild>
                              <button
                                className={`w-full truncate border-2 border-border px-1.5 py-0.5 text-left text-xs font-medium text-white ${
                                  event.type === "deadline" ? "bg-[#E7B75F]" : "bg-[#3A5FCD]"
                                } ${event.image_url ? "flex items-center gap-1" : ""}`}
                                onClick={() => setSelectedEvent(event)}
                              >
                                {event.image_url && <ImageIcon className="h-2.5 w-2.5 flex-shrink-0" />}
                                <span className="truncate">{event.title}</span>
                              </button>
                            </DialogTrigger>
                            <DialogContent className="border-2 shadow-[8px_8px_0px_0px_#1A1A1A] sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="font-mono">{event.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 pt-4">
                                {event.image_url && (
                                  <div className="relative aspect-video w-full overflow-hidden border-2 border-border">
                                    <Image
                                      src={event.image_url || "/placeholder.svg"}
                                      alt={event.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 border-2 border-border ${
                                      event.type === "deadline" ? "bg-[#E7B75F]" : "bg-[#3A5FCD]"
                                    }`}
                                  />
                                  <span className="text-sm capitalize">{event.type || "event"}</span>
                                </div>
                                <p className="text-sm">
                                  <span className="font-medium">Date:</span>{" "}
                                  {new Date(event.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                                {event.time && (
                                  <p className="text-sm">
                                    <span className="font-medium">Time:</span> {event.time}
                                  </p>
                                )}
                                {event.description && (
                                  <div className="border-t-2 border-border pt-3">
                                    <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

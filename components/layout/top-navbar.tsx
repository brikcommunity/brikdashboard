"use client"

import { Bell, Search, ChevronDown, Menu, Calendar, Users, TrendingUp, Award, Briefcase, FolderKanban, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/hooks/use-data"
import { markNotificationAsRead } from "@/lib/database"
import { formatDistanceToNow } from "date-fns"

interface TopNavbarProps {
  onMenuClick: () => void
}

// Map notification types to icons
const notificationIcons: Record<string, typeof Calendar> = {
  announcement: Users,
  event: Calendar,
  award: Award,
  project: FolderKanban,
  opportunity: Briefcase,
  system: TrendingUp,
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const { data: notifications, loading: notificationsLoading, unreadCount, refetch: refetchNotifications } = useNotifications(profile?.id || null)

  // Generate avatar initials
  const avatarInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile?.username?.slice(0, 2).toUpperCase() || "??"

  // Get display name
  const displayName = profile?.full_name || profile?.username || "User"

  const handleProfileClick = () => {
    if (profile?.username) {
      router.push(`/profile/${profile.username}`)
    } else {
      router.push("/profile")
    }
  }

  const handleSettingsClick = () => {
    // Can navigate to settings page when implemented
    console.log("Settings clicked")
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const handleMobileSearchClick = () => {
    // Focus the search input on mobile
    const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }

  const handleNotificationClick = async (notificationId: string, linkUrl?: string | null) => {
    // Mark as read
    await markNotificationAsRead(notificationId)
    refetchNotifications()
    
    // Navigate if there's a link
    if (linkUrl) {
      router.push(linkUrl)
    }
  }

  const handleViewAllNotifications = () => {
    // Navigate to notifications page when implemented
    router.push("/notifications")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10 shrink-0 border-2 shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A] lg:hidden bg-transparent"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search - hidden on mobile, visible on sm+ */}
        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-10 w-full border-2 pl-10 shadow-[2px_2px_0px_0px_#1A1A1A] focus:shadow-[4px_4px_0px_0px_#1A1A1A]"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleMobileSearchClick}
          className="h-10 w-10 border-2 shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A] sm:hidden bg-transparent"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-10 w-10 border-2 bg-transparent shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center border-2 border-border bg-[#3A5FCD] text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <DropdownMenuLabel className="font-bold text-base">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[400px] overflow-y-auto">
              {notificationsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#3A5FCD]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Bell
                  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id, notification.link_url)}
                      className="flex gap-3 p-3 cursor-pointer hover:bg-[#AEC6FF]/20"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border ${!notification.read ? "bg-[#3A5FCD]" : "bg-[#AEC6FF]"
                        }`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold leading-none">{notification.title}</p>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground">{notification.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </DropdownMenuItem>
                  )
                })
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleViewAllNotifications}
              className="justify-center font-semibold text-[#3A5FCD] hover:bg-[#AEC6FF]/20"
            >
              View All Notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex h-10 items-center gap-2 border-2 bg-transparent px-2 shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A] sm:px-3"
            >
              <Avatar className="h-7 w-7 border-2 border-border">
                <AvatarImage src={profile?.avatar || undefined} />
                <AvatarFallback className="bg-[#AEC6FF] text-xs font-bold">{avatarInitials}</AvatarFallback>
              </Avatar>
              <span className="hidden font-medium sm:inline-block">{displayName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-2 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <DropdownMenuItem onClick={handleProfileClick}>My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

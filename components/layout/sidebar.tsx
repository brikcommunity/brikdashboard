"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Megaphone,
  Calendar,
  Briefcase,
  BookOpen,
  Trophy,
  User,
  Settings,
  X,
  FolderKanban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/opportunities", icon: Briefcase, label: "Opportunities" },
  { href: "/resources", icon: BookOpen, label: "Resources" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/profile", icon: User, label: "My Profile" },
]

const adminItems = [{ href: "/admin", icon: Settings, label: "Admin Panel" }]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const isAdmin = profile?.role === "admin"

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r-2 border-border bg-[#F7F4EB] transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b-2 border-border px-4">
            <Link href="/" className="flex items-center gap-2" onClick={onClose}>
              <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-[#3A5FCD] shadow-[2px_2px_0px_0px_#1A1A1A]">
                <span className="font-mono text-sm font-bold text-white">B</span>
              </div>
              <span className="font-mono text-lg font-bold tracking-tight">BRIK</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {/* Admin Panel - Only shown at top for admins */}
            {isAdmin && (
              <div className="mb-2 space-y-1">
                {adminItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-none border-2 px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                          : "border-transparent hover:border-border hover:bg-white hover:shadow-[2px_2px_0px_0px_#1A1A1A]",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <div className="my-2 border-t-2 border-border" />
              </div>
            )}

            {/* Regular Navigation Items */}
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-none border-2 px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-border bg-[#3A5FCD] text-white shadow-[2px_2px_0px_0px_#1A1A1A]"
                      : "border-transparent hover:border-border hover:bg-white hover:shadow-[2px_2px_0px_0px_#1A1A1A]",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

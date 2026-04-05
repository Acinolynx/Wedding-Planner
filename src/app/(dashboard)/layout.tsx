"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  Briefcase,
  Menu,
  X,
  LogOut,
  Settings,
  Table,
  Palette,
  Database,
  CalendarClock,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guests", label: "Daftar Tamu", icon: Users },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/vendors", label: "Vendor", icon: Briefcase },
  { href: "/seating", label: "Tata Letak", icon: Table },
  { href: "/moodboard", label: "Moodboard", icon: Palette },
  { href: "/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/backup", label: "Backup", icon: Database },
  { href: "/settings", label: "Pengaturan", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Wedding Planner</h2>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-background transition-transform md:hidden",
          mobileOpen ? "flex" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-6">
          <h2 className="text-lg font-semibold">Wedding Planner</h2>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between gap-4 border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <h1 className="text-sm font-semibold">Wedding Planner</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

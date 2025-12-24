"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  AppWindow,
  Users,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Keyboard,
  Building2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useSessionUser } from "@/components/providers/session-provider"

const notifications = [
  {
    id: 1,
    type: "warning",
    title: "Renewal Due Soon",
    description: "Salesforce contract expires in 14 days",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    type: "alert",
    title: "Shadow IT Detected",
    description: "3 new unsanctioned apps discovered",
    time: "4 hours ago",
    unread: true,
  },
  {
    id: 3,
    type: "success",
    title: "Access Review Completed",
    description: "Q4 SOC2 review finished with 98% compliance",
    time: "1 day ago",
    unread: false,
  },
  {
    id: 4,
    type: "info",
    title: "Workflow Completed",
    description: "Offboarding for John Doe completed successfully",
    time: "2 days ago",
    unread: false,
  },
] as const

const searchCommands = {
  apps: [
    { id: "slack", name: "Slack", category: "Collaboration" },
    { id: "salesforce", name: "Salesforce", category: "Sales" },
    { id: "github", name: "GitHub", category: "DevTools" },
    { id: "figma", name: "Figma", category: "Design" },
  ],
  users: [
    { id: "u1", name: "Sarah Chen", email: "sarah.chen@company.com" },
    { id: "u2", name: "Michael Torres", email: "m.torres@company.com" },
    { id: "u3", name: "Emily Watson", email: "e.watson@company.com" },
  ],
  contracts: [
    { id: "c1", name: "Salesforce Enterprise", vendor: "Salesforce" },
    { id: "c2", name: "GitHub Enterprise", vendor: "GitHub" },
  ],
} as const

export function TopNav() {
  const router = useRouter()
  const user = useSessionUser()
  const [commandOpen, setCommandOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const notificationListRef = useRef<HTMLDivElement>(null)
  const [focusedNotificationIndex, setFocusedNotificationIndex] = useState<number>(-1)

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [])

  const userInitials = useMemo(
    () =>
      user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [user.name],
  )

  const toggleCommand = useCallback(() => setCommandOpen((open) => !open), [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
      if (e.key === "Escape" && notificationsOpen) {
        setNotificationsOpen(false)
      }
    },
    [notificationsOpen],
  )

  const handleNotificationKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!notificationsOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedNotificationIndex((prev) => Math.min(prev + 1, notifications.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedNotificationIndex((prev) => Math.max(prev - 1, 0))
          break
        case "Enter":
        case " ":
          if (focusedNotificationIndex >= 0) {
            e.preventDefault()
          }
          break
        case "Home":
          e.preventDefault()
          setFocusedNotificationIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedNotificationIndex(notifications.length - 1)
          break
      }
    },
    [notificationsOpen, focusedNotificationIndex],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!notificationsOpen) {
      setFocusedNotificationIndex(-1)
    }
  }, [notificationsOpen])

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "warning":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: "/sign-in" })
    } catch (error) {
      console.error("Sign out error:", error)
      setIsSigningOut(false)
    }
  }, [])

  const handleSearchClick = useCallback(() => setCommandOpen(true), [])

  const handleSettingsClick = useCallback(() => router.push("/settings"), [router])

  const createCommandHandler = useCallback(
    (path: string) => () => {
      router.push(path)
      setCommandOpen(false)
    },
    [router],
  )

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <SidebarTrigger className="-ml-1 btn-press" />
        <Separator orientation="vertical" className="h-6" />

        <Badge
          variant="outline"
          className="hidden sm:flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
        >
          <span className="status-dot status-dot-active" />
          Production
        </Badge>

        <Button
          variant="outline"
          className={cn(
            "relative h-9 w-full max-w-sm justify-start rounded-md bg-muted/50 text-sm text-muted-foreground",
            "hover:bg-muted hover:text-foreground transition-colors duration-150",
            "focus-visible:ring-2 focus-visible:ring-ring",
            "sm:pr-12 md:max-w-md lg:max-w-lg",
          )}
          onClick={handleSearchClick}
        >
          <Search className="mr-2 h-4 w-4 shrink-0" />
          <span className="hidden sm:inline-flex">Search apps, users, contracts...</span>
          <span className="inline-flex sm:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 btn-press"
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-in zoom-in-50 duration-200">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications ({unreadCount} unread)</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0"
              align="end"
              onKeyDown={handleNotificationKeyDown}
              role="dialog"
              aria-label="Notifications panel"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="text-sm font-semibold" id="notifications-heading">
                  Notifications
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </Button>
              </div>
              <ScrollArea className="h-[300px] custom-scrollbar">
                <div className="divide-y" role="list" aria-labelledby="notifications-heading" ref={notificationListRef}>
                  {notifications.map((notification, index) => (
                    <button
                      key={notification.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 w-full text-left",
                        "transition-colors duration-150 hover:bg-muted/50",
                        "focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        notification.unread && "bg-muted/30",
                        focusedNotificationIndex === index && "bg-muted/50 ring-2 ring-inset ring-ring",
                      )}
                      tabIndex={focusedNotificationIndex === index ? 0 : -1}
                      role="listitem"
                      aria-label={`${notification.title}: ${notification.description}. ${notification.time}${notification.unread ? ". Unread" : ""}`}
                      onFocus={() => setFocusedNotificationIndex(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          // Handle notification click
                        }
                      }}
                    >
                      <div className="mt-0.5" aria-hidden="true">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-sm leading-none", notification.unread && "font-medium")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground/70">{notification.time}</p>
                      </div>
                      {notification.unread && (
                        <div className="mt-1.5" aria-hidden="true">
                          <span className="h-2 w-2 rounded-full bg-primary block" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t p-2">
                <Button variant="ghost" className="w-full justify-center text-xs btn-press" size="sm">
                  View all notifications
                  <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 rounded-md px-2 hover:bg-muted btn-press">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/professional-woman-avatar.png" alt={user.name} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="text-sm font-medium leading-none">{user.name}</span>
                  <span className="text-[11px] text-muted-foreground">{user.role?.replace("_", " ") || "User"}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/professional-woman-avatar.png" alt={user.name} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{user.department} Department</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Keyboard className="mr-2 h-4 w-4" />
                  Keyboard shortcuts
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput
          placeholder="Search apps, users, contracts, or type a command..."
          aria-label="Search apps, users, contracts, or type a command"
        />
        <CommandList className="custom-scrollbar" aria-label="Search results">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Applications">
            {searchCommands.apps.map((app) => (
              <CommandItem
                key={app.id}
                onSelect={createCommandHandler(`/applications/${app.id}`)}
                className="cursor-pointer"
              >
                <AppWindow className="mr-2 h-4 w-4" />
                <span>{app.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{app.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Users">
            {searchCommands.users.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={createCommandHandler(`/users?search=${encodeURIComponent(user.email)}`)}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{user.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{user.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Contracts">
            {searchCommands.contracts.map((contract) => (
              <CommandItem key={contract.id} onSelect={createCommandHandler(`/contracts`)} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>{contract.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{contract.vendor}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={createCommandHandler("/access-reviews")} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Start Access Review
            </CommandItem>
            <CommandItem onSelect={createCommandHandler("/applications")} className="cursor-pointer">
              <AppWindow className="mr-2 h-4 w-4" />
              Add New Application
            </CommandItem>
            <CommandItem onSelect={createCommandHandler("/reports")} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

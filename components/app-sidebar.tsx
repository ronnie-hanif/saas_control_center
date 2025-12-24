"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  AppWindow,
  Users,
  FileText,
  ShieldCheck,
  Workflow,
  Plug,
  BarChart3,
  Settings,
  Layers,
  DollarSign,
  HelpCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navGroups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Asset Management",
    items: [
      { title: "Applications", href: "/applications", icon: AppWindow, badge: "142" },
      { title: "Users", href: "/users", icon: Users },
      { title: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Access Reviews", href: "/access-reviews", icon: ShieldCheck, badge: "3" },
      { title: "Workflows", href: "/workflows", icon: Workflow },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Contracts", href: "/contracts", icon: FileText },
      { title: "Spend", href: "/spend", icon: DollarSign },
    ],
  },
  {
    label: "Analytics",
    items: [{ title: "Reports", href: "/reports", icon: BarChart3 }],
  },
]

const bottomNavItems = [{ title: "Settings", href: "/settings", icon: Settings }]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar className="border-r border-border custom-scrollbar" collapsible="icon">
        <SidebarHeader className="border-b border-border p-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold tracking-tight">SaaS Control Center</span>
              <span className="text-[11px] text-muted-foreground">Enterprise Edition</span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2 py-2 custom-scrollbar">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label} className="py-1">
              <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    return (
                      <SidebarMenuItem key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "gap-3 rounded-md transition-all duration-150",
                                isActive && "bg-primary/10 text-primary font-medium shadow-sm",
                                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                              )}
                            >
                              <Link href={item.href}>
                                <item.icon className={cn("h-4 w-4 transition-colors", isActive && "text-primary")} />
                                <span className="flex-1">{item.title}</span>
                                {item.badge && (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "ml-auto h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-medium",
                                      "badge-interactive",
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="group-data-[collapsible=icon]:flex hidden">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-2">
          <SidebarMenu>
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Help & Support"
                className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Support</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}

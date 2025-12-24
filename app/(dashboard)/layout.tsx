import type React from "react"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SessionProvider } from "@/components/providers/session-provider"
import { requireAuth } from "@/lib/auth/session"

const isOktaConfigured = !!(process.env.OKTA_ISSUER && process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopNav />
          <main className="flex-1 overflow-auto bg-muted/30 custom-scrollbar">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-[1800px] space-y-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}

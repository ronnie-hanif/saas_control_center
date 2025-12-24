"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { UserTable } from "@/components/users/user-table"
import { UserDetailDrawer } from "@/components/users/user-detail-drawer"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { getUsers, getApps, getAuditEvents } from "@/lib/data"
import type { User, App, AuditEvent } from "@/lib/types"
import { Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [usersData, appsData, eventsData] = await Promise.all([getUsers(), getApps(), getAuditEvents()])
      setUsers(usersData)
      setApps(appsData)
      setAuditEvents(eventsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError("Failed to load users data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState title="Failed to load users" description={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Users"
        description="Manage user access and app assignments across your organization"
        showDataFreshness={!loading}
        isMockData={true}
        lastUpdated={lastUpdated}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Connect an identity provider to sync your user directory"
          actionLabel="Connect Integration"
          onAction={() => {}}
        />
      ) : (
        <UserTable users={users} onUserClick={handleUserClick} />
      )}

      <UserDetailDrawer
        user={selectedUser}
        apps={apps}
        auditEvents={auditEvents}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}

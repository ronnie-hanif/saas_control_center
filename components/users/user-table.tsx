"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, Download, UserX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserTableProps {
  users: User[]
  onUserClick: (user: User) => void
}

export function UserTable({ users, onUserClick }: UserTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const { toast } = useToast()
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const tableRef = useRef<HTMLTableElement>(null)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesDept = deptFilter === "all" || user.department === deptFilter
    return matchesSearch && matchesStatus && matchesDept
  })

  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const departments = [...new Set(users.map((u) => u.department))]

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map((u) => u.id))
    }
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleExport = () => {
    toast({
      title: "Export started",
      description: `Exporting ${filteredUsers.length} users to CSV...`,
    })
  }

  const handleBulkOffboard = () => {
    toast({
      title: "Offboarding initiated",
      description: `Starting offboarding process for ${selectedUsers.length} users`,
    })
    setSelectedUsers([])
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateObj)
  }

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableElement>) => {
      const rows = paginatedUsers
      if (rows.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedRowIndex((prev) => Math.min(prev + 1, rows.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedRowIndex((prev) => Math.max(prev - 1, 0))
          break
        case "Enter":
        case " ":
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            e.preventDefault()
            onUserClick(rows[focusedRowIndex])
          }
          break
        case "Home":
          e.preventDefault()
          setFocusedRowIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedRowIndex(rows.length - 1)
          break
      }
    },
    [paginatedUsers, focusedRowIndex, onUserClick],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search users by name or email"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkOffboard}>
              <UserX className="mr-2 h-4 w-4" />
              Offboard ({selectedUsers.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table
          ref={tableRef}
          onKeyDown={handleTableKeyDown}
          tabIndex={0}
          role="grid"
          aria-label="Users directory table"
          aria-rowcount={filteredUsers.length}
        >
          <TableHeader>
            <TableRow role="row">
              <TableHead className="w-12" role="columnheader">
                <Checkbox
                  checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all users on this page"
                />
              </TableHead>
              <TableHead role="columnheader">Name</TableHead>
              <TableHead role="columnheader">Department</TableHead>
              <TableHead role="columnheader">Manager</TableHead>
              <TableHead role="columnheader">Status</TableHead>
              <TableHead className="text-right" role="columnheader">
                Apps Used
              </TableHead>
              <TableHead className="text-right" role="columnheader">
                App Spend
              </TableHead>
              <TableHead className="text-right" role="columnheader">
                High Risk
              </TableHead>
              <TableHead role="columnheader">Last Active</TableHead>
              <TableHead className="w-12" role="columnheader">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user, index) => (
              <TableRow
                key={user.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  focusedRowIndex === index ? "ring-2 ring-inset ring-ring bg-muted/30" : ""
                }`}
                onClick={() => onUserClick(user)}
                onFocus={() => setFocusedRowIndex(index)}
                tabIndex={focusedRowIndex === index ? 0 : -1}
                role="row"
                aria-rowindex={index + 1}
                aria-selected={selectedUsers.includes(user.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.manager || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-right">{user.appsUsed}</TableCell>
                <TableCell className="text-right">{formatCurrency(user.totalAppSpend)}</TableCell>
                <TableCell className="text-right">
                  {user.highRiskAccessCount > 0 ? (
                    <Badge variant="destructive">{user.highRiskAccessCount}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(user.lastActive)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUserClick(user)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Start Access Review</DropdownMenuItem>
                      <DropdownMenuItem>View App Access</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Initiate Offboarding</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length === 0
            ? "No users to display"
            : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredUsers.length)} of ${filteredUsers.length} users`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

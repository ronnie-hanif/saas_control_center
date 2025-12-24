"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Contract } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface RenewalCalendarProps {
  contracts: Contract[]
}

export function RenewalCalendar({ contracts }: RenewalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()

  const renewalsThisMonth = contracts.filter((contract) => {
    const renewalDate = new Date(contract.renewalDate)
    return renewalDate.getMonth() === month && renewalDate.getFullYear() === year
  })

  const getRenewalsForDay = (day: number) => {
    return renewalsThisMonth.filter((contract) => {
      const renewalDate = new Date(contract.renewalDate)
      return renewalDate.getDate() === day
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Renewal Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">{monthName}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const renewals = getRenewalsForDay(day)
            const isToday =
              new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

            return (
              <div
                key={day}
                className={`min-h-[80px] rounded-md border p-1 ${
                  isToday ? "border-primary bg-primary/5" : ""
                } ${renewals.length > 0 ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
              >
                <span className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>{day}</span>
                {renewals.slice(0, 2).map((contract) => (
                  <div
                    key={contract.id}
                    className="mt-1 truncate rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/40"
                  >
                    <span className="font-medium">{contract.appName}</span>
                    <span className="ml-1 text-muted-foreground">{formatCurrency(contract.contractValue)}</span>
                  </div>
                ))}
                {renewals.length > 2 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    +{renewals.length - 2} more
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

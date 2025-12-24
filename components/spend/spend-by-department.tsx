"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building2 } from "lucide-react"
import Link from "next/link"

interface DepartmentSpend {
  department: string
  monthlySpend: number
  annualSpend: number
  appCount: number
  userCount: number
  percentOfTotal: number
  change: number
}

interface SpendByDepartmentProps {
  departments: DepartmentSpend[]
  totalMonthlySpend: number
}

export function SpendByDepartment({ departments, totalMonthlySpend }: SpendByDepartmentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const sortedDepartments = [...departments].sort((a, b) => b.monthlySpend - a.monthlySpend)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Spend by Department
            </CardTitle>
            <CardDescription>Monthly spend breakdown across departments</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports/department-spend">
              View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDepartments.map((dept) => (
          <div key={dept.department} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{dept.department}</span>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {dept.appCount} apps
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${dept.change >= 0 ? "text-red-600" : "text-green-600"}`}>
                  {dept.change >= 0 ? "+" : ""}
                  {dept.change}%
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(dept.monthlySpend)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={dept.percentOfTotal} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {dept.percentOfTotal.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-4 text-sm">
          <span className="font-medium text-muted-foreground">Total Monthly</span>
          <span className="text-lg font-bold">{formatCurrency(totalMonthlySpend)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

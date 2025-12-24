"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Grid3X3 } from "lucide-react"
import Link from "next/link"

interface CategorySpend {
  category: string
  monthlySpend: number
  appCount: number
  topApp: string
  color: string
}

interface SpendByCategoryProps {
  categories: CategorySpend[]
}

export function SpendByCategory({ categories }: SpendByCategoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalSpend = categories.reduce((sum, cat) => sum + cat.monthlySpend, 0)
  const sortedCategories = [...categories].sort((a, b) => b.monthlySpend - a.monthlySpend)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              Spend by Category
            </CardTitle>
            <CardDescription>Monthly spend by application category</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports/category-spend">
              View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCategories.map((category) => {
            const percentage = ((category.monthlySpend / totalSpend) * 100).toFixed(1)
            return (
              <div
                key={category.category}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{category.category}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {category.appCount} apps
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Top: {category.topApp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{formatCurrency(category.monthlySpend)}</p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DataTableWrapperProps {
  children: React.ReactNode
  className?: string
}

export function DataTableWrapper({ children, className }: DataTableWrapperProps) {
  const tableRef = React.useRef<HTMLDivElement>(null)
  const [focusedRowIndex, setFocusedRowIndex] = React.useState<number>(-1)

  React.useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const rows = table.querySelectorAll("tbody tr")
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
        case "Home":
          e.preventDefault()
          setFocusedRowIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedRowIndex(rows.length - 1)
          break
        case "Enter":
        case " ":
          if (focusedRowIndex >= 0) {
            e.preventDefault()
            const row = rows[focusedRowIndex] as HTMLElement
            row.click()
          }
          break
      }
    }

    table.addEventListener("keydown", handleKeyDown)
    return () => table.removeEventListener("keydown", handleKeyDown)
  }, [focusedRowIndex])

  React.useEffect(() => {
    const table = tableRef.current
    if (!table || focusedRowIndex < 0) return

    const rows = table.querySelectorAll("tbody tr")
    rows.forEach((row, index) => {
      if (index === focusedRowIndex) {
        row.setAttribute("data-focused", "true")
        row.setAttribute("tabindex", "0")
        ;(row as HTMLElement).focus()
      } else {
        row.removeAttribute("data-focused")
        row.setAttribute("tabindex", "-1")
      }
    })
  }, [focusedRowIndex])

  return (
    <div
      ref={tableRef}
      className={cn(
        "rounded-lg border border-border overflow-hidden",
        "focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
      role="grid"
      tabIndex={0}
      onFocus={() => {
        if (focusedRowIndex < 0) setFocusedRowIndex(0)
      }}
    >
      {children}
    </div>
  )
}

/**
 * Shared date formatting utilities for consistent UTC timestamps across the UI
 */

/**
 * Format a date to ISO string in UTC
 */
export function toUTCString(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString()
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString()
}

/**
 * Format a date for display (short format)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "N/A"
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "N/A"
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return "N/A"
  }
}

/**
 * Format a date for display (long format with time)
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return "N/A"
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "N/A"
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    })
  } catch {
    return "N/A"
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A"
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "N/A"

    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMins = Math.round(diffMs / (1000 * 60))
        if (diffMins === 0) return "just now"
        if (diffMins > 0) return `in ${diffMins} min`
        return `${Math.abs(diffMins)} min ago`
      }
      if (diffHours > 0) return `in ${diffHours} hours`
      return `${Math.abs(diffHours)} hours ago`
    }
    if (diffDays > 0) return `in ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  } catch {
    return "N/A"
  }
}

/**
 * Check if a date is within N days from now
 */
export function isWithinDays(date: Date | string | null | undefined, days: number): boolean {
  if (!date) return false
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return false
    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(now.getDate() + days)
    return d <= cutoff && d >= now
  } catch {
    return false
  }
}

/**
 * Get days until a date (negative if in past)
 */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return null
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    return Math.round(diffMs / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

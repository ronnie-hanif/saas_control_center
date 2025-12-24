/**
 * Safe formatting utilities for production-ready numeric displays
 * Handles NaN, null, undefined, and invalid values gracefully
 */

const PLACEHOLDER = "—"

/**
 * Safely format a number as currency
 * Returns placeholder for invalid/missing values
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    currency?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    placeholder?: string
  } = {},
): string {
  const { currency = "USD", minimumFractionDigits = 0, maximumFractionDigits = 0, placeholder = PLACEHOLDER } = options

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return placeholder
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Safely format a number with locale-appropriate separators
 * Returns placeholder for invalid/missing values
 */
export function formatNumber(
  value: number | null | undefined,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    placeholder?: string
  } = {},
): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 0, placeholder = PLACEHOLDER } = options

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return placeholder
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Safely format a percentage value
 * Returns placeholder for invalid/missing values
 */
export function formatPercent(
  value: number | null | undefined,
  options: {
    decimals?: number
    placeholder?: string
  } = {},
): string {
  const { decimals = 1, placeholder = PLACEHOLDER } = options

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return placeholder
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * Safely format a date
 * Returns placeholder for invalid/missing values
 */
export function formatDate(
  value: string | Date | null | undefined,
  options: {
    format?: "short" | "medium" | "long" | "relative"
    placeholder?: string
  } = {},
): string {
  const { format = "medium", placeholder = PLACEHOLDER } = options

  if (!value) {
    return placeholder
  }

  const date = value instanceof Date ? value : new Date(value)

  if (isNaN(date.getTime())) {
    return placeholder
  }

  if (format === "relative") {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const formatOptions: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric" }
      : format === "long"
        ? { month: "long", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric", year: "numeric" }

  return date.toLocaleDateString("en-US", formatOptions)
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number | null | undefined, options: { placeholder?: string } = {}): string {
  const { placeholder = PLACEHOLDER } = options

  if (bytes === null || bytes === undefined || isNaN(bytes) || !isFinite(bytes)) {
    return placeholder
  }

  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

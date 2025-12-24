/**
 * Check if a value is a Prisma Decimal (duck typing to avoid importing @prisma/client)
 */
function isPrismaDecimal(value: unknown): value is { toNumber: () => number } {
  return (
    value !== null && typeof value === "object" && "toNumber" in value && typeof (value as any).toNumber === "function"
  )
}

/**
 * Safely convert a value to a number, returning a fallback for invalid values
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  if (isPrismaDecimal(value)) return value.toNumber()
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? fallback : num
}

/**
 * Safely convert Decimal to number for display
 */
export function decimalToNumber(value: unknown, fallback = 0): number {
  if (!value) return fallback
  if (isPrismaDecimal(value)) {
    const num = value.toNumber()
    return isNaN(num) ? fallback : num
  }
  const num = Number(value)
  return isNaN(num) ? fallback : num
}

/**
 * Format currency with safe number handling
 */
export function formatCurrency(value: unknown, fallback = "—"): string {
  const num = safeNumber(value, Number.NaN)
  if (isNaN(num)) return fallback
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format percentage with safe number handling
 */
export function formatPercent(value: unknown, fallback = "—"): string {
  const num = safeNumber(value, Number.NaN)
  if (isNaN(num)) return fallback
  return `${Math.round(num)}%`
}

/**
 * Calculate percentage safely
 */
export function calculatePercent(numerator: number, denominator: number): number {
  if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return 0
  const result = (numerator / denominator) * 100
  return isNaN(result) ? 0 : Math.min(100, Math.max(0, result))
}

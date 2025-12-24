/**
 * CSV Export Utilities
 *
 * Safe CSV generation with proper escaping and type handling
 */

type CellValue = string | number | boolean | Date | null | undefined

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: CellValue): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") {
    if (isNaN(value) || !isFinite(value)) return ""
    return String(value)
  }

  const str = String(value)
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface CSVColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => CellValue)
}

/**
 * Generate CSV string from data
 */
export function generateCSV<T extends Record<string, unknown>>(data: T[], columns: CSVColumn<T>[]): string {
  // Header row
  const headerRow = columns.map((col) => escapeCSV(col.header)).join(",")

  // Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]
        return escapeCSV(value as CellValue)
      })
      .join(",")
  })

  return [headerRow, ...dataRows].join("\n")
}

/**
 * Create a downloadable CSV blob
 */
export function createCSVBlob(csvContent: string): Blob {
  // Add BOM for Excel compatibility
  const BOM = "\uFEFF"
  return new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" })
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")
  return `${prefix}_${timestamp}.csv`
}

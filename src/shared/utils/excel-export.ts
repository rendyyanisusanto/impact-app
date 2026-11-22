import * as XLSX from 'xlsx'
import type { ExportOptions } from '../types/crud.types'

/**
 * Sanitizes cell strings against formula injection (CSV/Excel injection)
 * Any string starting with =, +, -, @, \t, or \r is prefixed with a single quote.
 */
export function sanitizeExcelCell(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/^[=+\-@\t\r]/.test(value) || /^[=+\-@]/.test(value.trim())) {
      return `'${value}`
    }
  }
  return value
}

export function exportToExcel<T = unknown>(options: ExportOptions<T>): void {
  const { filename, columns, data } = options

  // Transform data rows into key-value pairs matching column labels
  const formattedRows = data.map(item => {
    const rowObj: Record<string, unknown> = {}
    const record = item as Record<string, unknown>
    for (const col of columns) {
      const rawVal = record[col.key as string]
      const cellVal = col.formatter ? col.formatter(rawVal, item) : rawVal
      rowObj[col.label] = sanitizeExcelCell(cellVal ?? '')
    }
    return rowObj
  })

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  // Auto-size columns based on maximum length
  const colWidths = columns.map(col => {
    const labelLen = col.label.length
    const maxValLen = Math.max(
      ...data.map(item => {
        const record = item as Record<string, unknown>
        const val = col.formatter
          ? String(col.formatter(record[col.key as string], item))
          : String(record[col.key as string] ?? '')
        return val.length
      }),
      0
    )
    return { wch: Math.min(Math.max(labelLen, maxValLen) + 3, 40) }
  })
  worksheet['!cols'] = colWidths

  // Ensure filename has .xlsx extension
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`

  XLSX.writeFile(workbook, safeFilename)
}

import * as XLSX from 'xlsx'
import type {
  ImportTemplateDefinition,
  ImportValidationResult,
  ImportRowError
} from '../types/crud.types'
import type { ExcelImportTemplate } from '../types/excel-import.types'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function generateImportTemplate(def: ImportTemplateDefinition | ExcelImportTemplate): void {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Data template with headers and example row
  const headers = def.columns.map(c => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colName = (c as any).label || (c as any).header || c.key
    return `${colName}${c.required ? ' *' : ''}`
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exampleRow = def.columns.map(c => (c as any).example ?? '')

  const dataSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Set column widths
  dataSheet['!cols'] = def.columns.map(c => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colName = (c as any).label || (c as any).header || c.key
    return {
      wch: Math.max(colName.length + 5, 18)
    }
  })

  XLSX.utils.book_append_sheet(workbook, dataSheet, def.sheetName)

  // Sheet 2+: Reference sheets if provided
  if (def.referenceSheets) {
    for (const refSheet of def.referenceSheets) {
      const sheet = XLSX.utils.aoa_to_sheet([refSheet.headers, ...refSheet.rows])
      sheet['!cols'] = refSheet.headers.map(h => ({ wch: Math.max(h.length + 5, 20) }))
      XLSX.utils.book_append_sheet(workbook, sheet, refSheet.name)
    }
  }

  const title = def.title || def.sheetName
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-template.xlsx`
  XLSX.writeFile(workbook, filename)
}

export async function parseAndValidateExcel<T extends Record<string, unknown>>(
  file: File,
  def: ImportTemplateDefinition | ExcelImportTemplate,
  rowMapper: (rawRow: Record<string, unknown>, rowNumber: number) => { data?: T; error?: string }
): Promise<ImportValidationResult<T>> {
  const errors: ImportRowError[] = []

  // 1. File extension and size check
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    errors.push({
      rowNumber: 0,
      message: 'Format file tidak didukung. Harap unggah file spreadsheet Excel (.xlsx / .xls).'
    })
    return { totalRows: 0, validRows: [], invalidCount: 1, errors }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push({
      rowNumber: 0,
      message: `Ukuran file melebihi batas maksimum (${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`
    })
    return { totalRows: 0, validRows: [], invalidCount: 1, errors }
  }

  // 2. Read file as ArrayBuffer
  let buffer: ArrayBuffer
  if (typeof file.arrayBuffer === 'function') {
    buffer = await file.arrayBuffer()
  } else {
    buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsArrayBuffer(file)
    })
  }

  let workbook: XLSX.WorkBook

  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    errors.push({
      rowNumber: 0,
      message: 'Format file tidak valid atau file korup. Harap unggah file Excel (.xlsx / .xls).'
    })
    return { totalRows: 0, validRows: [], invalidCount: 1, errors }
  }

  // 3. Check Sheet
  const sheetName = workbook.SheetNames.includes(def.sheetName)
    ? def.sheetName
    : workbook.SheetNames[0]

  if (!sheetName) {
    errors.push({
      rowNumber: 0,
      message: 'File Excel tidak memiliki worksheet yang dapat dibaca.'
    })
    return { totalRows: 0, validRows: [], invalidCount: 1, errors }
  }

  const worksheet = workbook.Sheets[sheetName]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

  if (rows.length < 2) {
    errors.push({
      rowNumber: 0,
      message: 'File Excel kosong atau hanya berisi baris header tanpa data.'
    })
    return { totalRows: 0, validRows: [], invalidCount: 1, errors }
  }

  // 4. Header validation
  const fileHeaders = (rows[0] as unknown[]).map(h =>
    String(h).replace(/\s*\*/g, '').trim().toLowerCase()
  )

  const headerIndices: Record<string, number> = {}
  for (const col of def.columns) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colLabel = String((col as any).label || (col as any).header || col.key)
    const normColLabel = colLabel.toLowerCase()
    const foundIdx = fileHeaders.findIndex(fh => fh === normColLabel)
    if (foundIdx === -1 && col.required) {
      errors.push({
        rowNumber: 1,
        column: colLabel,
        message: `Kolom wajib '${colLabel}' tidak ditemukan pada baris header file.`
      })
    } else {
      headerIndices[col.key] = foundIdx
    }
  }

  if (errors.length > 0) {
    return { totalRows: 0, validRows: [], invalidCount: errors.length, errors }
  }

  // 5. Row-by-Row parsing and validation
  const validRows: T[] = []
  const dataRows = rows.slice(1) // Skip header

  const seenKeys = new Set<string>()

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2 // 1-based index in Excel (Row 1 is header)
    const rowValues = dataRows[i] as unknown[]

    // Check if entire row is empty
    const isBlank = rowValues.every(val => val === '' || val === null || val === undefined)
    if (isBlank) continue

    const rowObj: Record<string, unknown> = {}
    let rowHasError = false

    // Field-level checks based on column definitions
    for (const col of def.columns) {
      const idx = headerIndices[col.key]
      const rawValue = idx !== undefined && idx !== -1 ? rowValues[idx] : ''
      const stringValue = String(rawValue ?? '').trim()

      if (col.required && (!stringValue || stringValue === '')) {
        errors.push({
          rowNumber,
          column: col.label,
          field: col.key,
          message: `Baris ${rowNumber}: Kolom '${col.label}' wajib diisi.`
        })
        rowHasError = true
      } else if (col.maxLength && stringValue.length > col.maxLength) {
        errors.push({
          rowNumber,
          column: col.label,
          field: col.key,
          message: `Baris ${rowNumber}: Kolom '${col.label}' melebihi batas maksimal ${col.maxLength} karakter.`
        })
        rowHasError = true
      } else if (col.type === 'number' && stringValue !== '') {
        const num = Number(stringValue)
        if (isNaN(num)) {
          errors.push({
            rowNumber,
            column: col.label,
            field: col.key,
            message: `Baris ${rowNumber}: Kolom '${col.label}' harus berupa angka numerik yang valid.`
          })
          rowHasError = true
        } else {
          rowObj[col.key] = num
        }
      } else if (col.type === 'email' && stringValue !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(stringValue)) {
          errors.push({
            rowNumber,
            column: col.label,
            field: col.key,
            message: `Baris ${rowNumber}: Format email pada kolom '${col.label}' tidak valid.`
          })
          rowHasError = true
        } else {
          rowObj[col.key] = stringValue
        }
      } else {
        rowObj[col.key] = stringValue
      }
    }

    // Duplicate check in file (e.g. kode)
    const codeValue = rowObj['kode'] as string | undefined
    if (codeValue) {
      if (seenKeys.has(codeValue.toLowerCase())) {
        errors.push({
          rowNumber,
          column: 'Kode',
          field: 'kode',
          message: `Baris ${rowNumber}: Kode '${codeValue}' terduplikasi di dalam file yang sama.`
        })
        rowHasError = true
      } else {
        seenKeys.add(codeValue.toLowerCase())
      }
    }

    // Custom domain mapper and reference lookup
    if (!rowHasError) {
      const mapped = rowMapper(rowObj, rowNumber)
      if (mapped.error) {
        errors.push({
          rowNumber,
          message: mapped.error
        })
      } else if (mapped.data) {
        validRows.push(mapped.data)
      }
    }
  }

  const invalidCount = errors.length

  return {
    totalRows: dataRows.length,
    validRows,
    invalidCount,
    errors
  }
}

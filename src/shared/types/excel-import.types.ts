import type { ImportTemplateDefinition, ImportColumnDefinition } from './crud.types'

export type { ImportTemplateDefinition, ImportColumnDefinition }

export interface ExcelImportColumn extends Partial<ImportColumnDefinition> {
  key: string
  header?: string
  label?: string
  required?: boolean
  description?: string
  example?: string | number
}

export interface ExcelImportTemplate {
  sheetName: string
  title?: string
  columns: (ImportColumnDefinition | ExcelImportColumn)[]
  sampleData?: Record<string, unknown>[]
  referenceSheets?: {
    name: string
    headers: string[]
    rows: (string | number)[][]
  }[]
}

export interface ImportRowMapper<T> {
  mapRow(row: Record<string, unknown>, rowNumber: number): { data?: T; error?: string }
}

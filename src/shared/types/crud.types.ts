/**
 * Universal Master Data CRUD, Import, and Export Types
 */

export interface BaseEntity {
  id: number
  status?: number | boolean | null
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
}

export interface ListQuery {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: number | string | boolean
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CrudService<T, CreateDto, UpdateDto> {
  list(query?: ListQuery): Promise<PaginatedResponse<T>>
  getById(id: number): Promise<T>
  create(payload: CreateDto): Promise<T>
  update(id: number, payload: UpdateDto): Promise<T>
  delete(id: number): Promise<void | boolean>
  exportAll?(query?: ListQuery): Promise<T[]>
  importBatch?(
    items: CreateDto[]
  ): Promise<{ importedCount: number; imported?: number; failed?: number; errors?: string[] }>
}

export interface ExportColumn<T = unknown> {
  key: keyof T | string
  label: string
  formatter?: (val: unknown, row: T) => string | number
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface ExportOptions<T = unknown> {
  filename: string
  title: string
  subtitle?: string
  columns: ExportColumn<T>[]
  data: T[]
  orientation?: 'portrait' | 'landscape'
  filterInfo?: string
}

export interface ImportColumnDefinition {
  key: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'reference'
  maxLength?: number
  description?: string
  example?: string | number
}

export interface ImportTemplateDefinition {
  sheetName: string
  title: string
  columns: ImportColumnDefinition[]
  referenceSheets?: {
    name: string
    headers: string[]
    rows: (string | number)[][]
  }[]
}

export interface ImportRowError {
  rowNumber: number
  column?: string
  field?: string
  message: string
}

export interface ImportValidationResult<T> {
  totalRows: number
  validRows: T[]
  invalidCount: number
  errors: ImportRowError[]
}

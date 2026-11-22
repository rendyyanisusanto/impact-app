export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: PaginationMeta
  errors?: Record<string, string[]>
}

export type SortDirection = 'asc' | 'desc'

export interface SortParam {
  key: string
  direction: SortDirection
}

export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: SortDirection
  [key: string]: unknown
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

import type { ApiResponse } from '@/shared/types/api.types'
import type {
  PaginatedResponse,
  PaginationParams,
  SortParams
} from '@/shared/types/pagination.types'
import { ApiError, type ApiErrorCode } from '../api-error'

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
  status?: number
): never {
  throw new ApiError({ code, message, fieldErrors, status })
}

export function paginateArray<T>(
  items: readonly T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.max(1, params.pageSize || 10)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pagedItems = items.slice(start, end)

  return {
    items: pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages
  }
}

export function sortArray<T extends Record<string, unknown>>(
  items: readonly T[],
  sort?: SortParams
): T[] {
  if (!sort || !sort.field) return [...items]

  const { field, direction } = sort
  const dir = direction === 'desc' ? -1 : 1

  return [...items].sort((a, b) => {
    const valA = a[field]
    const valB = b[field]

    if (valA === valB) return 0
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * dir
    }

    return String(valA).localeCompare(String(valB)) * dir
  })
}

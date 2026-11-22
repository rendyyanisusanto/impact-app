import { apiClient } from '@/shared/services/api-client'

export interface SystemErrorItem {
  id: number
  error_code: string
  request_id: string | null
  user_id: number | null
  username: string | null
  source: 'BACKEND' | 'FRONTEND'
  module: string | null
  endpoint: string | null
  http_method: string | null
  http_status: number | null
  error_type: string
  message: string
  stack_trace: string | null
  fingerprint: string
  context: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  occurred_at: string
}

export interface ErrorGroupItem {
  fingerprint: string
  error_code: string
  error_type: string
  message: string
  module: string | null
  endpoint: string | null
  source: string
  count: number
  last_occurred_at: string
}

export interface ErrorStatsDto {
  total24h: number
  backendCount: number
  frontendCount: number
  status500Count: number
}

export interface ErrorFilterQuery {
  page?: number
  pageSize?: number
  search?: string
  source?: 'BACKEND' | 'FRONTEND' | ''
  module?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ErrorPaginatedResult {
  items: SystemErrorItem[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

export class ErrorMonitoringService {
  async getAll(filters: ErrorFilterQuery = {}): Promise<ErrorPaginatedResult> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize))
    if (filters.search) params.append('search', filters.search)
    if (filters.source) params.append('source', filters.source)
    if (filters.module) params.append('module', filters.module)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient<SystemErrorItem[]>(`/system-errors${query}`)

    const meta = res.meta || {
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      totalItems: res.data.length,
      totalPages: 1
    }

    return {
      items: res.data,
      totalItems: meta.totalItems,
      page: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages
    }
  }

  async getById(id: number): Promise<SystemErrorItem> {
    const res = await apiClient<SystemErrorItem>(`/system-errors/${id}`)
    return res.data
  }

  async getGroups(query: Record<string, string> = {}): Promise<ErrorGroupItem[]> {
    const params = new URLSearchParams(query)
    const q = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient<ErrorGroupItem[]>(`/system-errors/groups${q}`)
    return res.data
  }

  async getStats(): Promise<ErrorStatsDto> {
    const res = await apiClient<ErrorStatsDto>('/system-errors/stats')
    return res.data
  }
}

export const errorMonitoringService = new ErrorMonitoringService()


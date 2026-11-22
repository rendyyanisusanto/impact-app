import { apiClient } from '@/shared/services/api-client'

export interface AuditLogChange {
  id: number
  audit_log_id: number
  field_name: string
  old_value: unknown
  new_value: unknown
}

export interface AuditLog {
  id: number
  event_id: string
  user_id: number | null
  username: string | null
  module: string
  action: string
  table_name: string | null
  record_id: string | null
  description: string | null
  status: string
  ip_address: string | null
  user_agent: string | null
  request_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  changes?: AuditLogChange[]
}

export interface AuditFilterQuery {
  page?: number
  pageSize?: number
  search?: string
  module?: string
  action?: string
  startDate?: string
  endDate?: string
  userId?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AuditPaginatedResult {
  items: AuditLog[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

export class AuditTrailService {
  async getAll(filters: AuditFilterQuery = {}): Promise<AuditPaginatedResult> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize))
    if (filters.search) params.append('search', filters.search)
    if (filters.module) params.append('module', filters.module)
    if (filters.action) params.append('action', filters.action)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.userId) params.append('userId', String(filters.userId))
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient<AuditLog[]>(`/audit-logs${query}`)

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

  async getById(id: number): Promise<AuditLog> {
    const res = await apiClient<AuditLog>(`/audit-logs/${id}`)
    return res.data
  }
}

export const auditTrailService = new AuditTrailService()


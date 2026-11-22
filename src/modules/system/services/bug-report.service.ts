import { apiClient } from '@/shared/services/api-client'

export type BugPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED'

export interface BugAttachmentItem {
  id: number
  bug_report_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: number | null
  created_at: string
}

export interface BugReportItem {
  id: number
  report_code: string
  reporter_id: number | null
  reporter_username: string | null
  title: string
  description: string
  module: string | null
  page_url: string | null
  error_id: number | null
  priority: BugPriority
  status: BugStatus
  assigned_to: number | null
  resolution_note: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  closed_at: string | null
  attachments?: BugAttachmentItem[]
}

export interface CreateBugReportPayload {
  title: string
  description: string
  module?: string
  pageUrl?: string
  priority?: BugPriority
  errorId?: number
  screenshotBase64?: string
  screenshotName?: string
  screenshotType?: string
}

export interface UpdateBugReportPayload {
  status?: BugStatus
  priority?: BugPriority
  assignedTo?: number | null
  resolutionNote?: string | null
}

export interface BugReportFilterQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  priority?: string
  module?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BugReportPaginatedResult {
  items: BugReportItem[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

export class BugReportService {
  async getAll(filters: BugReportFilterQuery = {}): Promise<BugReportPaginatedResult> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize))
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.priority) params.append('priority', filters.priority)
    if (filters.module) params.append('module', filters.module)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient<BugReportItem[]>(`/bug-reports${query}`)

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

  async getMyReports(): Promise<BugReportItem[]> {
    const res = await apiClient<BugReportItem[]>('/bug-reports/my-reports')
    return res.data
  }

  async getById(id: number): Promise<BugReportItem> {
    const res = await apiClient<BugReportItem>(`/bug-reports/${id}`)
    return res.data
  }

  async create(payload: CreateBugReportPayload): Promise<BugReportItem> {
    const res = await apiClient<BugReportItem>('/bug-reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async update(id: number, payload: UpdateBugReportPayload): Promise<BugReportItem> {
    const res = await apiClient<BugReportItem>(`/bug-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
    return res.data
  }
}

export const bugReportService = new BugReportService()


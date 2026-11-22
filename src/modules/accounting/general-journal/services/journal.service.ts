import { apiClient } from '@/shared/services/api-client'
import type {
  JournalHeader,
  JournalFilterParams,
  JournalKpiSummary,
  SelectableAccount,
  CreateJournalPayload,
  UpdateJournalPayload,
  ReverseJournalPayload
} from '../types/journal.types'

export interface PaginatedJournalsResult {
  items: JournalHeader[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export class JournalApiService {
  private readonly baseUrl = '/accounting/general-journal'

  async getJournals(params?: JournalFilterParams): Promise<PaginatedJournalsResult> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.start_date) query.append('start_date', params.start_date)
    if (params?.end_date) query.append('end_date', params.end_date)
    if (params?.status && params.status !== 'ALL') query.append('status', params.status)
    if (params?.source_type && params.source_type !== 'ALL') query.append('source_type', params.source_type)
    if (params?.akun_id) query.append('akun_id', String(params.akun_id))
    if (params?.created_by) query.append('created_by', String(params.created_by))
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    if (params?.sort_by) query.append('sort_by', params.sort_by)
    if (params?.sort_dir) query.append('sort_dir', params.sort_dir)

    const endpoint = `${this.baseUrl}${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<PaginatedJournalsResult>(endpoint, { method: 'GET' })
    return res.data
  }

  async getKpi(params?: JournalFilterParams): Promise<JournalKpiSummary> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.start_date) query.append('start_date', params.start_date)
    if (params?.end_date) query.append('end_date', params.end_date)
    if (params?.source_type && params.source_type !== 'ALL') query.append('source_type', params.source_type)
    if (params?.created_by) query.append('created_by', String(params.created_by))

    const endpoint = `${this.baseUrl}/kpi${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<JournalKpiSummary>(endpoint, { method: 'GET' })
    return res.data
  }

  async getSelectableAccounts(search?: string): Promise<SelectableAccount[]> {
    const query = new URLSearchParams()
    if (search && search.trim()) query.append('search', search.trim())
    const endpoint = `${this.baseUrl}/accounts${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<SelectableAccount[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async getJournalById(id: number): Promise<JournalHeader> {
    const res = await apiClient<JournalHeader>(`${this.baseUrl}/${id}`, { method: 'GET' })
    return res.data
  }

  async createDraft(payload: CreateJournalPayload): Promise<JournalHeader> {
    const res = await apiClient<JournalHeader>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateDraft(id: number, payload: UpdateJournalPayload): Promise<JournalHeader> {
    const res = await apiClient<JournalHeader>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async postJournal(id: number): Promise<JournalHeader> {
    const res = await apiClient<JournalHeader>(`${this.baseUrl}/${id}/post`, {
      method: 'POST'
    })
    return res.data
  }

  async reverseJournal(id: number, payload: ReverseJournalPayload): Promise<JournalHeader> {
    const res = await apiClient<JournalHeader>(`${this.baseUrl}/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async cancelDraft(id: number): Promise<JournalHeader> {
    const res = await apiClient<JournalHeader>(`${this.baseUrl}/${id}/cancel`, {
      method: 'POST'
    })
    return res.data
  }
}

export const journalService = new JournalApiService()

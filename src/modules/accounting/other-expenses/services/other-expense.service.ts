import { apiClient } from '@/shared/services/api-client'
import type {
  OtherExpenseHeader,
  OtherExpenseFilterParams,
  OtherExpenseKpiSummary,
  SelectableAccount,
  CreateOtherExpensePayload,
  UpdateOtherExpensePayload,
  ReverseOtherExpensePayload
} from '../types/other-expense.types'

export interface PaginatedExpensesResult {
  items: OtherExpenseHeader[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class OtherExpenseApiService {
  private readonly baseUrl = '/accounting/other-expenses'

  async getExpenses(params?: OtherExpenseFilterParams): Promise<PaginatedExpensesResult> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.start_date) query.append('start_date', params.start_date)
    if (params?.end_date) query.append('end_date', params.end_date)
    if (params?.status && params.status !== 'ALL') query.append('status', params.status)
    if (params?.akun_beban) query.append('akun_beban', String(params.akun_beban))
    if (params?.akun_kas) query.append('akun_kas', String(params.akun_kas))
    if (params?.created_by) query.append('created_by', String(params.created_by))
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    if (params?.sort_by) query.append('sort_by', params.sort_by)
    if (params?.sort_dir) query.append('sort_dir', params.sort_dir)

    const endpoint = `${this.baseUrl}${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<PaginatedExpensesResult>(endpoint, { method: 'GET' })
    return res.data
  }

  async getKpi(params?: OtherExpenseFilterParams): Promise<OtherExpenseKpiSummary> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.start_date) query.append('start_date', params.start_date)
    if (params?.end_date) query.append('end_date', params.end_date)
    if (params?.status && params.status !== 'ALL') query.append('status', params.status)
    if (params?.akun_beban) query.append('akun_beban', String(params.akun_beban))
    if (params?.akun_kas) query.append('akun_kas', String(params.akun_kas))
    if (params?.created_by) query.append('created_by', String(params.created_by))

    const endpoint = `${this.baseUrl}/kpi${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<OtherExpenseKpiSummary>(endpoint, { method: 'GET' })
    return res.data
  }

  async getSelectableAccounts(type?: 'all' | 'cash' | 'expense', search?: string): Promise<SelectableAccount[]> {
    const query = new URLSearchParams()
    if (type) query.append('type', type)
    if (search && search.trim()) query.append('search', search.trim())
    const endpoint = `${this.baseUrl}/accounts${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<SelectableAccount[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async getExpenseById(id: number): Promise<OtherExpenseHeader> {
    const res = await apiClient<OtherExpenseHeader>(`${this.baseUrl}/${id}`, { method: 'GET' })
    return res.data
  }

  async createDraft(payload: CreateOtherExpensePayload): Promise<OtherExpenseHeader> {
    const res = await apiClient<OtherExpenseHeader>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateDraft(id: number, payload: UpdateOtherExpensePayload): Promise<OtherExpenseHeader> {
    const res = await apiClient<OtherExpenseHeader>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async postExpense(id: number): Promise<OtherExpenseHeader> {
    const res = await apiClient<OtherExpenseHeader>(`${this.baseUrl}/${id}/post`, {
      method: 'POST'
    })
    return res.data
  }

  async reverseExpense(id: number, payload: ReverseOtherExpensePayload): Promise<OtherExpenseHeader> {
    const res = await apiClient<OtherExpenseHeader>(`${this.baseUrl}/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async cancelDraft(id: number): Promise<OtherExpenseHeader> {
    const res = await apiClient<OtherExpenseHeader>(`${this.baseUrl}/${id}/cancel`, {
      method: 'POST'
    })
    return res.data
  }
}

export const otherExpenseService = new OtherExpenseApiService()

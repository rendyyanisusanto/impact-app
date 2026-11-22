import { apiClient } from '@/shared/services/api-client'
import type {
  OtherIncomeHeader,
  OtherIncomeFilterParams,
  OtherIncomeKpiSummary,
  SelectableAccount,
  CreateOtherIncomePayload,
  UpdateOtherIncomePayload,
  ReverseOtherIncomePayload
} from '../types/other-income.types'

export interface PaginatedIncomesResult {
  items: OtherIncomeHeader[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class OtherIncomeApiService {
  private readonly baseUrl = '/accounting/other-income'

  async getIncomes(params?: OtherIncomeFilterParams): Promise<PaginatedIncomesResult> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.start_date) query.append('start_date', params.start_date)
    if (params?.end_date) query.append('end_date', params.end_date)
    if (params?.status && params.status !== 'ALL') query.append('status', params.status)
    if (params?.akun_sumber) query.append('akun_sumber', String(params.akun_sumber))
    if (params?.akun_beban) query.append('akun_beban', String(params.akun_beban))
    if (params?.akun_kas) query.append('akun_kas', String(params.akun_kas))
    if (params?.created_by) query.append('created_by', String(params.created_by))
    if (params?.received_from) query.append('received_from', params.received_from.trim())
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    if (params?.sort_by) query.append('sort_by', params.sort_by)
    if (params?.sort_dir) query.append('sort_dir', params.sort_dir)

    const endpoint = `${this.baseUrl}${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<PaginatedIncomesResult>(endpoint, { method: 'GET' })
    return res.data
  }

  async getKpi(params?: OtherIncomeFilterParams): Promise<OtherIncomeKpiSummary> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.start_date) query.append('start_date', params.start_date)
    if (params?.end_date) query.append('end_date', params.end_date)
    if (params?.status && params.status !== 'ALL') query.append('status', params.status)
    if (params?.akun_sumber) query.append('akun_sumber', String(params.akun_sumber))
    if (params?.akun_beban) query.append('akun_beban', String(params.akun_beban))
    if (params?.akun_kas) query.append('akun_kas', String(params.akun_kas))
    if (params?.created_by) query.append('created_by', String(params.created_by))
    if (params?.received_from) query.append('received_from', params.received_from.trim())

    const endpoint = `${this.baseUrl}/kpi${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<OtherIncomeKpiSummary>(endpoint, { method: 'GET' })
    return res.data
  }

  async getSelectableAccounts(type?: 'all' | 'cash' | 'income', search?: string): Promise<SelectableAccount[]> {
    const query = new URLSearchParams()
    if (type) query.append('type', type)
    if (search && search.trim()) query.append('search', search.trim())
    const endpoint = `${this.baseUrl}/accounts${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<SelectableAccount[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async getIncomeById(id: number): Promise<OtherIncomeHeader> {
    const res = await apiClient<OtherIncomeHeader>(`${this.baseUrl}/${id}`, { method: 'GET' })
    return res.data
  }

  async createDraft(payload: CreateOtherIncomePayload): Promise<OtherIncomeHeader> {
    const res = await apiClient<OtherIncomeHeader>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateDraft(id: number, payload: UpdateOtherIncomePayload): Promise<OtherIncomeHeader> {
    const res = await apiClient<OtherIncomeHeader>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async postIncome(id: number): Promise<OtherIncomeHeader> {
    const res = await apiClient<OtherIncomeHeader>(`${this.baseUrl}/${id}/post`, {
      method: 'POST'
    })
    return res.data
  }

  async reverseIncome(id: number, payload: ReverseOtherIncomePayload): Promise<OtherIncomeHeader> {
    const res = await apiClient<OtherIncomeHeader>(`${this.baseUrl}/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async cancelDraft(id: number): Promise<OtherIncomeHeader> {
    const res = await apiClient<OtherIncomeHeader>(`${this.baseUrl}/${id}/cancel`, {
      method: 'POST'
    })
    return res.data
  }
}

export const otherIncomeService = new OtherIncomeApiService()

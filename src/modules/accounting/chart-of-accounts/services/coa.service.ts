import { apiClient } from '@/shared/services/api-client'
import type { PaginatedResponse } from '@/shared/types/crud.types'
import type {
  CoaGroup,
  CoaParent,
  CoaAccount,
  CoaTreeNodeGroup,
  CoaKpiSummary,
  CoaFilterParams,
  CreateCoaGroupPayload,
  UpdateCoaGroupPayload,
  CreateCoaParentPayload,
  UpdateCoaParentPayload,
  CreateCoaAccountPayload,
  UpdateCoaAccountPayload,
  ImportAccountRow,
  ImportValidationResult,
  ImportCommitResult
} from '../types/coa.types'

export interface ICoaService {
  getKpi(): Promise<CoaKpiSummary>
  getTree(params?: CoaFilterParams): Promise<CoaTreeNodeGroup[]>
  getGroups(activeOnly?: boolean): Promise<CoaGroup[]>
  createGroup(payload: CreateCoaGroupPayload): Promise<CoaGroup>
  updateGroup(id: number, payload: UpdateCoaGroupPayload): Promise<CoaGroup>
  getParents(coaId?: number | string, activeOnly?: boolean): Promise<CoaParent[]>
  createParent(payload: CreateCoaParentPayload): Promise<CoaParent>
  updateParent(id: number, payload: UpdateCoaParentPayload): Promise<CoaParent>
  getAccounts(params?: CoaFilterParams): Promise<PaginatedResponse<CoaAccount>>
  getAccountById(id: number): Promise<CoaAccount>
  createAccount(payload: CreateCoaAccountPayload): Promise<CoaAccount>
  updateAccount(id: number, payload: UpdateCoaAccountPayload): Promise<CoaAccount>
  toggleAccountStatus(id: number, isActive: number): Promise<CoaAccount>
  deleteAccount(id: number): Promise<{ success: boolean; message: string }>
  validateImport(rows: ImportAccountRow[]): Promise<ImportValidationResult>
  commitImport(items: any[]): Promise<ImportCommitResult>
  logExport(filter: any, format: 'excel' | 'pdf'): Promise<void>
}

export class CoaApiService implements ICoaService {
  private readonly baseUrl = '/accounting/coa'

  async getKpi(): Promise<CoaKpiSummary> {
    const res = await apiClient<CoaKpiSummary>(`${this.baseUrl}/kpi`, { method: 'GET' })
    return res.data
  }

  async getTree(params?: CoaFilterParams): Promise<CoaTreeNodeGroup[]> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search.trim())
    if (params?.coa_id && params.coa_id !== 'all') query.append('coa_id', String(params.coa_id))
    if (params?.saldo_normal && params.saldo_normal !== 'all') query.append('saldo_normal', params.saldo_normal)
    if (params?.status && params.status !== 'all') query.append('status', params.status)
    if (params?.is_used && params.is_used !== 'all') query.append('is_used', params.is_used)

    const endpoint = `${this.baseUrl}/tree${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<CoaTreeNodeGroup[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async getGroups(activeOnly = false): Promise<CoaGroup[]> {
    const endpoint = `${this.baseUrl}/groups${activeOnly ? '?active=true' : ''}`
    const res = await apiClient<CoaGroup[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async createGroup(payload: CreateCoaGroupPayload): Promise<CoaGroup> {
    const res = await apiClient<CoaGroup>(`${this.baseUrl}/groups`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateGroup(id: number, payload: UpdateCoaGroupPayload): Promise<CoaGroup> {
    const res = await apiClient<CoaGroup>(`${this.baseUrl}/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async getParents(coaId?: number | string, activeOnly = false): Promise<CoaParent[]> {
    const query = new URLSearchParams()
    if (coaId && coaId !== 'all') query.append('coa_id', String(coaId))
    if (activeOnly) query.append('active', 'true')

    const endpoint = `${this.baseUrl}/parents${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<CoaParent[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async createParent(payload: CreateCoaParentPayload): Promise<CoaParent> {
    const res = await apiClient<CoaParent>(`${this.baseUrl}/parents`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateParent(id: number, payload: UpdateCoaParentPayload): Promise<CoaParent> {
    const res = await apiClient<CoaParent>(`${this.baseUrl}/parents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async getAccounts(params: CoaFilterParams = {}): Promise<PaginatedResponse<CoaAccount>> {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search.trim())
    if (params.coa_id && params.coa_id !== 'all') query.append('coa_id', String(params.coa_id))
    if (params.indukakun_id && params.indukakun_id !== 'all') query.append('indukakun_id', String(params.indukakun_id))
    if (params.saldo_normal && params.saldo_normal !== 'all') query.append('saldo_normal', params.saldo_normal)
    if (params.status && params.status !== 'all') query.append('status', params.status)
    if (params.is_used && params.is_used !== 'all') query.append('is_used', params.is_used)
    if (params.page) query.append('page', String(params.page))
    if (params.limit) query.append('limit', String(params.limit))
    if (params.sortBy) query.append('sortBy', params.sortBy)
    if (params.sortOrder) query.append('sortOrder', params.sortOrder)

    const endpoint = `${this.baseUrl}/accounts${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<CoaAccount[]>(endpoint, { method: 'GET' })

    const meta = res.meta || {
      page: params.page || 1,
      pageSize: params.limit || 20,
      totalItems: Array.isArray(res.data) ? res.data.length : 0,
      totalPages: 1
    }

    return {
      data: res.data || [],
      total: meta.totalItems,
      page: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages
    }
  }

  async getAccountById(id: number): Promise<CoaAccount> {
    const res = await apiClient<CoaAccount>(`${this.baseUrl}/accounts/${id}`, { method: 'GET' })
    return res.data
  }

  async createAccount(payload: CreateCoaAccountPayload): Promise<CoaAccount> {
    const res = await apiClient<CoaAccount>(`${this.baseUrl}/accounts`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateAccount(id: number, payload: UpdateCoaAccountPayload): Promise<CoaAccount> {
    const res = await apiClient<CoaAccount>(`${this.baseUrl}/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async toggleAccountStatus(id: number, isActive: number): Promise<CoaAccount> {
    const res = await apiClient<CoaAccount>(`${this.baseUrl}/accounts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    })
    return res.data
  }

  async deleteAccount(id: number): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<{ success: boolean; message: string }>(`${this.baseUrl}/accounts/${id}`, {
      method: 'DELETE'
    })
    return res.data
  }

  async validateImport(rows: ImportAccountRow[]): Promise<ImportValidationResult> {
    const res = await apiClient<ImportValidationResult>(`${this.baseUrl}/import/validate`, {
      method: 'POST',
      body: JSON.stringify({ rows })
    })
    return res.data
  }

  async commitImport(items: any[]): Promise<ImportCommitResult> {
    const res = await apiClient<ImportCommitResult>(`${this.baseUrl}/import/commit`, {
      method: 'POST',
      body: JSON.stringify({ items })
    })
    return res.data
  }

  async logExport(filter: any, format: 'excel' | 'pdf'): Promise<void> {
    try {
      await apiClient(`${this.baseUrl}/export/log`, {
        method: 'POST',
        body: JSON.stringify({ filter, format })
      })
    } catch {
      // Non-blocking log
    }
  }
}

export const coaService = new CoaApiService()

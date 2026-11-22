import { apiClient } from '@/shared/services/api-client'
import type {
  CustomerReportFilterParams,
  CustomerReportResponse,
  SalesCustomerReportFilterOptions
} from '../types/sales-customer-report.types'

export class SalesCustomerReportService {
  /**
   * Mengonversi filter object ke URL query string
   */
  public buildQueryString(filters: Partial<CustomerReportFilterParams>): string {
    const params = new URLSearchParams()

    if (filters.customer_id) params.append('customer_id', String(filters.customer_id))
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.min_total !== undefined && filters.min_total !== null) {
      params.append('min_total', String(filters.min_total))
    }
    if (filters.max_total !== undefined && filters.max_total !== null) {
      params.append('max_total', String(filters.max_total))
    }
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_direction) params.append('sort_direction', filters.sort_direction)
    if (filters.page) params.append('page', String(filters.page))
    if (filters.per_page) params.append('per_page', String(filters.per_page))

    return params.toString()
  }

  /**
   * Mengambil data laporan terpaginasi
   */
  async getReport(filters: CustomerReportFilterParams): Promise<CustomerReportResponse> {
    const qs = this.buildQueryString(filters)
    const res = await apiClient<any>(`/reports/sales-by-customer?${qs}`)
    const payload = res.data?.items !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload
  }

  /**
   * Mengambil seluruh data terfilter untuk keperluan Export PDF/Excel
   */
  async getAllReportData(filters: CustomerReportFilterParams): Promise<any[]> {
    const exportFilters = { ...filters, page: 1, per_page: 5000 }
    const qs = this.buildQueryString(exportFilters)
    const res = await apiClient<any>(`/reports/sales-by-customer?${qs}`)
    const payload = res.data?.items !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload?.items || []
  }

  /**
   * Mengambil opsi filter (daftar customer & status)
   */
  async getFilterOptions(search?: string): Promise<SalesCustomerReportFilterOptions> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await apiClient<any>(`/reports/sales-by-customer/filters${qs}`)
    const payload = res.data?.customers !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload
  }

  /**
   * URL direct download Excel backend
   */
  getExcelDownloadUrl(filters: CustomerReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/sales-by-customer/export/excel?${qs}`
  }

  /**
   * URL direct print view backend
   */
  getPrintUrl(filters: CustomerReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/sales-by-customer/print?${qs}`
  }
}

export const salesCustomerReportService = new SalesCustomerReportService()

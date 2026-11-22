import { apiClient } from '@/shared/services/api-client'
import type {
  SalesReportFilterParams,
  SalesReportApiResponse,
  SalesReportFilterOptions
} from '../types/sales-report.types'

export class SalesReportService {
  /**
   * Mengonversi filter object ke query string
   */
  private buildQueryString(filters: Partial<SalesReportFilterParams>): string {
    const params = new URLSearchParams()

    if (filters.report_type) params.append('report_type', filters.report_type)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.customer_id) params.append('customer_id', String(filters.customer_id))
    if (filters.product_id) params.append('product_id', String(filters.product_id))
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.production_status && filters.production_status !== 'ALL') {
      params.append('production_status', filters.production_status)
    }
    if (filters.delivery_status && filters.delivery_status !== 'ALL') {
      params.append('delivery_status', filters.delivery_status)
    }
    if (filters.invoice_type && filters.invoice_type !== 'ALL') {
      params.append('invoice_type', filters.invoice_type)
    }
    if (filters.payment_status && filters.payment_status !== 'ALL') {
      params.append('payment_status', filters.payment_status)
    }
    if (filters.order_type && filters.order_type !== 'ALL') {
      params.append('order_type', filters.order_type)
    }
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.min_amount !== undefined && filters.min_amount !== null && !isNaN(filters.min_amount)) {
      params.append('min_amount', String(filters.min_amount))
    }
    if (filters.max_amount !== undefined && filters.max_amount !== null && !isNaN(filters.max_amount)) {
      params.append('max_amount', String(filters.max_amount))
    }
    if (filters.created_by) params.append('created_by', String(filters.created_by))
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_direction) params.append('sort_direction', filters.sort_direction)
    if (filters.page) params.append('page', String(filters.page))
    if (filters.per_page) params.append('per_page', String(filters.per_page))

    return params.toString()
  }

  /**
   * Mengambil data laporan dengan paginasi
   */
  async getReport(filters: SalesReportFilterParams): Promise<SalesReportApiResponse> {
    const qs = this.buildQueryString(filters)
    const res = await apiClient<any>(`/reports/sales?${qs}`)
    const payload = res.data?.items !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload
  }

  /**
   * Mengambil semua baris data terfilter untuk keperluan Export PDF/Excel
   */
  async getAllReportData(filters: SalesReportFilterParams): Promise<any[]> {
    const exportFilters = { ...filters, page: 1, per_page: 5000 }
    const qs = this.buildQueryString(exportFilters)
    const res = await apiClient<any>(`/reports/sales?${qs}`)
    const payload = res.data?.items !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload?.items || []
  }

  /**
   * Mengambil opsi filter untuk dropdown
   */
  async getFilterOptions(): Promise<SalesReportFilterOptions> {
    const res = await apiClient<any>('/reports/sales/filters')
    const payload = res.data?.customers !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload
  }

  /**
   * URL download file Excel backend
   */
  getExcelDownloadUrl(filters: SalesReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/sales/export/excel?${qs}`
  }

  /**
   * URL cetak HTML backend
   */
  getPrintUrl(filters: SalesReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/sales/print?${qs}`
  }
}

export const salesReportService = new SalesReportService()

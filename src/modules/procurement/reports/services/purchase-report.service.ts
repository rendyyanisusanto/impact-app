import { apiClient } from '@/shared/services/api-client'
import type {
  PurchaseReportFilterParams,
  PurchaseReportApiResponse,
  PurchaseReportFilterOptions
} from '../types/purchase-report.types'

export class PurchaseReportService {
  /**
   * Mengonversi filter object ke query string
   */
  private buildQueryString(filters: Partial<PurchaseReportFilterParams>): string {
    const params = new URLSearchParams()

    if (filters.report_type) params.append('report_type', filters.report_type)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.date_basis) params.append('date_basis', filters.date_basis)
    if (filters.supplier_id) params.append('supplier_id', String(filters.supplier_id))
    if (filters.material_id) params.append('material_id', String(filters.material_id))
    if (filters.warehouse_id) params.append('warehouse_id', String(filters.warehouse_id))
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.payment_status && filters.payment_status !== 'ALL') params.append('payment_status', filters.payment_status)
    if (filters.receipt_status && filters.receipt_status !== 'ALL') params.append('receipt_status', filters.receipt_status)
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
  async getReport(filters: PurchaseReportFilterParams): Promise<PurchaseReportApiResponse> {
    const qs = this.buildQueryString(filters)
    const res = await apiClient<PurchaseReportApiResponse>(`/reports/purchases?${qs}`)
    return res.data
  }

  /**
   * Mengambil semua baris data terfilter untuk keperluan Export PDF/Excel
   */
  async getAllReportData(filters: PurchaseReportFilterParams): Promise<any[]> {
    const exportFilters = { ...filters, page: 1, per_page: 5000 }
    const qs = this.buildQueryString(exportFilters)
    const res = await apiClient<PurchaseReportApiResponse>(`/reports/purchases?${qs}`)
    return res.data.items || []
  }

  /**
   * Mengambil opsi filter untuk dropdown
   */
  async getFilterOptions(): Promise<PurchaseReportFilterOptions> {
    const res = await apiClient<PurchaseReportFilterOptions>('/reports/purchases/filters')
    return res.data
  }

  /**
   * URL download file Excel backend
   */
  getExcelDownloadUrl(filters: PurchaseReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/purchases/export/excel?${qs}`
  }

  /**
   * URL cetak HTML backend
   */
  getPrintUrl(filters: PurchaseReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/purchases/print?${qs}&auto_print=1`
  }
}

export const purchaseReportService = new PurchaseReportService()

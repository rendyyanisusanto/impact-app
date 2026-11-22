import { apiClient } from '@/shared/services/api-client'
import type {
  ProductReportFilterParams,
  ProductReportApiResponse,
  SalesProductReportFilterOptions
} from '../types/sales-product-report.types'

export class SalesProductReportService {
  /**
   * Mengonversi filter object ke URL query string
   */
  private buildQueryString(filters: Partial<ProductReportFilterParams>): string {
    const params = new URLSearchParams()

    if (filters.product_id) params.append('product_id', String(filters.product_id))
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.customer_id) params.append('customer_id', String(filters.customer_id))
    if (filters.so_status && filters.so_status !== 'ALL') params.append('so_status', filters.so_status)
    if (filters.mode) params.append('mode', filters.mode)
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_direction) params.append('sort_direction', filters.sort_direction)
    if (filters.page) params.append('page', String(filters.page))
    if (filters.per_page) params.append('per_page', String(filters.per_page))

    return params.toString()
  }

  /**
   * Mengambil data laporan terpaginasi
   */
  async getReport(filters: ProductReportFilterParams): Promise<ProductReportApiResponse> {
    const qs = this.buildQueryString(filters)
    const res = await apiClient<any>(`/reports/sales-by-product?${qs}`)
    const payload = res.data?.items !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload
  }

  /**
   * Mengambil seluruh data terfilter untuk keperluan Export PDF/Excel
   */
  async getAllReportData(filters: ProductReportFilterParams): Promise<any[]> {
    const exportFilters = { ...filters, page: 1, per_page: 5000 }
    const qs = this.buildQueryString(exportFilters)
    const res = await apiClient<any>(`/reports/sales-by-product?${qs}`)
    const payload = res.data?.items !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload?.items || []
  }

  /**
   * Mengambil opsi filter (daftar produk & customer)
   */
  async getFilterOptions(): Promise<SalesProductReportFilterOptions> {
    const res = await apiClient<any>('/reports/sales-by-product/filters')
    const payload = res.data?.products !== undefined ? res.data : (res.data?.data ?? res.data)
    return payload
  }

  /**
   * URL direct download Excel backend
   */
  getExcelDownloadUrl(filters: ProductReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/sales-by-product/export/excel?${qs}`
  }

  /**
   * URL direct print view backend
   */
  getPrintUrl(filters: ProductReportFilterParams): string {
    const qs = this.buildQueryString(filters)
    return `/api/v1/reports/sales-by-product/print?${qs}`
  }
}

export const salesProductReportService = new SalesProductReportService()

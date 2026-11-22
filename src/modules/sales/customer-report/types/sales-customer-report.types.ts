export type SoStatusOption = '1' | '0' | 'ALL' | 'cancelled'

export interface CustomerReportFilterParams {
  customer_id?: number | null
  date_from?: string
  date_to?: string
  status?: SoStatusOption
  search?: string
  min_total?: number | null
  max_total?: number | null
  sort_by?: string
  sort_direction?: 'ASC' | 'DESC'
  page?: number
  per_page?: number
}

export interface CustomerReportCustomerMeta {
  id: number
  kode: string
  nama: string
  no_hp?: string | null
  alamat?: string | null
  email?: string | null
  status: number
}

export interface CustomerReportItemRow {
  id: number
  kode: string
  tanggal: string
  customer_id: number
  keterangan: string | null
  subtotal: number
  diskon: number
  total_ppn: number
  total: number
  status: number // 0 = Terbuka, 1 = Tertutup
  status_aktif: number // 1 = Aktif, 0 = Dibatalkan
  order_type: string | null
  status_produksi: number
  created_by: number | null
  creator_username?: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CustomerReportSummaryTotals {
  total_orders: number
  subtotal: number
  discount: number
  tax: number
  grand_total: number
}

export interface CustomerReportPagination {
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface CustomerReportResponse {
  customer: CustomerReportCustomerMeta
  period: {
    date_from?: string
    date_to?: string
  }
  items: CustomerReportItemRow[]
  summary: CustomerReportSummaryTotals
  pagination: CustomerReportPagination
}

export interface CustomerLookupItem {
  id: number
  kode: string
  nama: string
  no_hp: string | null
  alamat: string | null
  status: number
}

export interface SalesCustomerReportFilterOptions {
  customers: CustomerLookupItem[]
  statuses: Array<{ value: SoStatusOption; label: string }>
  sortOptions: Array<{ value: string; label: string }>
}

export interface ReportColumnConfig {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  visible: boolean
  sortable?: boolean
}

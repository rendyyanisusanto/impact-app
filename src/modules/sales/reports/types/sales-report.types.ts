export type SalesReportType =
  | 'summary'
  | 'detail'
  | 'customer'
  | 'product'
  | 'status'
  | 'so_vs_delivery'
  | 'invoice'
  | 'payment_receivable'

export interface SalesReportFilterParams {
  report_type: SalesReportType
  date_from?: string
  date_to?: string
  date_basis?: 'so' | 'invoice' | 'payment' | 'delivery'
  customer_id?: number
  product_id?: number
  status?: string // 'ALL', '0', '1', 'cancelled'
  production_status?: string // 'ALL', '0', '1'
  delivery_status?: string // 'ALL', 'BELUM', 'PARSIAL', 'SELESAI'
  invoice_type?: string // 'ALL', 'DP', 'TERMIN', 'PELUNASAN'
  payment_status?: string // 'ALL', 'BELUM_BAYAR', 'SEBAGIAN', 'LUNAS'
  order_type?: string // 'ALL', 'PPN', 'NON_PPN', 'NON_PPN_2'
  search?: string
  min_amount?: number
  max_amount?: number
  created_by?: number
  sort_by?: string
  sort_direction?: 'ASC' | 'DESC'
  page?: number
  per_page?: number
}

export interface ReportColumnConfig {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  visible: boolean
  sortable?: boolean
}

export interface SalesReportPagination {
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface SalesReportSummaryTotals {
  total_rows: number
  total_amount?: number
  total_qty?: number
  total_subtotal?: number
  total_diskon?: number
  total_ppn?: number
  total_pembayaran?: number
  total_sisa_tagihan?: number
}

export interface SalesReportFilterOptions {
  customers: Array<{ id: number; kode: string | null; nama: string }>
  products: Array<{ id: number; kode: string | null; nama: string }>
  users: Array<{ id: number; username: string }>
  order_types: string[]
  invoice_types: string[]
  statuses: Array<{ value: string; label: string }>
  production_statuses: Array<{ value: string; label: string }>
  delivery_statuses: Array<{ value: string; label: string }>
  payment_statuses: Array<{ value: string; label: string }>
  date_basis_options: Array<{ value: string; label: string }>
}

export interface SalesReportData {
  items: any[]
  pagination: SalesReportPagination
  summary_totals: SalesReportSummaryTotals
  applied_filters: Record<string, any>
}

export type SalesReportApiResponse = SalesReportData

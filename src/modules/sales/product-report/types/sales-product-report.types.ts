export type ProductReportMode = 'summary' | 'chronological' | 'customer_detail'

export type SoStatusOption = '1' | '0' | 'active' | 'cancelled' | 'ALL'

export interface ProductReportFilterParams {
  product_id: number
  date_from: string
  date_to: string
  customer_id?: number
  so_status?: SoStatusOption
  sort_by?: string
  sort_direction?: 'ASC' | 'DESC'
  page?: number
  per_page?: number
  search?: string
  mode?: ProductReportMode
}

export interface ProductReportProductMeta {
  id: number
  kode: string
  nama: string
  satuan?: string | null
}

export interface ProductReportCustomerMeta {
  id: number
  kode: string
  nama: string
}

export interface ProductReportSummaryRow {
  customer_id: number
  customer_code: string
  customer_name: string
  so_count: number
  total_qty: number
  qty_percentage: number
  total_amount: number
  last_purchase_date: string | null
}

export interface ProductReportDetailRow {
  detail_id: number
  sales_order_id: number
  tanggal: string
  nomor_so: string
  order_type: string | null
  so_status: number
  so_status_aktif: number
  customer_id: number | null
  customer_code: string | null
  customer_name: string
  produk_id: number
  kode_produk: string | null
  nama_produk: string
  satuan: string | null
  item_keterangan: string | null
  qty: number
  harga: number
  diskon: number
  subtotal: number
}

export interface ProductReportSummaryTotals {
  total_rows: number
  total_so: number
  total_customers: number
  total_qty: number
  total_amount: number
}

export interface ProductReportPagination {
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface ProductReportApiResponse {
  mode: ProductReportMode
  product: ProductReportProductMeta
  customer?: ProductReportCustomerMeta | null
  date_from: string
  date_to: string
  items: (ProductReportSummaryRow | ProductReportDetailRow)[]
  pagination: ProductReportPagination
  summary: ProductReportSummaryTotals
}

export interface ProductFilterItem {
  id: number
  kode: string
  nama: string
  display_name: string
}

export interface CustomerFilterItem {
  id: number
  kode: string
  nama: string
}

export interface SalesProductReportFilterOptions {
  products: ProductFilterItem[]
  customers: CustomerFilterItem[]
  statuses: { value: string; label: string }[]
}

export interface ReportColumnConfig {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  visible: boolean
  sortable?: boolean
}

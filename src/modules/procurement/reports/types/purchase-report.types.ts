export type PurchaseReportType =
  | 'summary'
  | 'detail'
  | 'supplier'
  | 'material'
  | 'status'
  | 'po_vs_receipt'
  | 'purchase_vs_payment'

export interface PurchaseReportFilterParams {
  report_type: PurchaseReportType
  date_from: string
  date_to: string
  date_basis?: 'po' | 'receipt' | 'payment'
  supplier_id?: number
  material_id?: number
  warehouse_id?: number
  status: string // 'ALL' | '0' | '1' | 'cancelled'
  payment_status: string // 'ALL' | 'BELUM_DITAGIH' | 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS'
  receipt_status: string // 'ALL' | 'BELUM' | 'PARSIAL' | 'SELESAI' | 'OVER'
  search: string
  min_amount?: number
  max_amount?: number
  created_by?: number
  sort_by: string
  sort_direction: 'ASC' | 'DESC'
  page: number
  per_page: number
}

export interface SummaryReportRow {
  id: number
  tanggal: string
  kode: string
  suplier_id: number | null
  supplier_name: string
  supplier_code: string | null
  item_count: number
  total_qty: number
  subtotal: number
  diskon: number
  total_ppn: number
  total: number
  status: number
  status_aktif: number
  status_transaksi_id: number | null
  status_transaksi_nama: string | null
  created_by: number | null
  creator_username: string | null
}

export interface DetailReportRow {
  detail_id: number
  po_id: number
  tanggal: string
  kode_po: string
  supplier_name: string
  kode_bahan: string | null
  nama_bahan: string
  satuan: string | null
  qty: number
  harga: number
  diskon: number
  subtotal: number
  status_po: number
  status_aktif: number
  created_by: number | null
  creator_username: string | null
}

export interface SupplierReportRow {
  supplier_id: number
  kode_supplier: string
  nama_supplier: string
  jumlah_po: number
  total_nilai_po: number
  total_nilai_diterima: number
  total_tagihan: number
}

export interface MaterialReportRow {
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  satuan: string | null
  total_qty_pesan: number
  total_nilai_pesan: number
  total_qty_terima: number
  total_nilai_terima: number
}

export interface StatusReportRow {
  id: number
  nomor_po: string
  tanggal: string
  supplier_name: string
  total_po: number
  status_po: number
  status_aktif: number
  qty_pesan: number
  qty_terima: number
  sisa_qty: number
  status_penerimaan: 'Belum Diterima' | 'Parsial' | 'Selesai'
}

export interface PoVsReceiptReportRow {
  po_id: number
  nomor_po: string
  tanggal_po: string
  supplier_name: string
  kode_bahan: string | null
  nama_bahan: string
  satuan: string | null
  qty_po: number
  qty_terima: number
  sisa_qty: number
  persentase: number
  status_penerimaan: 'Belum Diterima' | 'Parsial' | 'Selesai' | 'Over'
}

export interface PurchaseVsPaymentReportRow {
  po_id: number
  nomor_po: string
  tanggal_po: string
  supplier_name: string
  nilai_po: number
  nilai_penerimaan: number
  nomor_tagihan: string
  nilai_tagihan: number
  nilai_dibayar: number
  sisa_tagihan: number
  status_pembayaran: 'Belum Ditagih' | 'Belum Bayar' | 'Bayar Sebagian' | 'Lunas'
}

export interface PurchaseReportSummaryTotals {
  total_rows: number
  total_po_amount?: number
  total_item_subtotal?: number
  total_received_amount?: number
  total_billed_amount?: number
  total_paid_amount?: number
  total_remaining_bill?: number
  total_qty_pesan?: number
  total_qty_terima?: number
  total_sisa_qty?: number
}

export interface PurchaseReportPagination {
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface PurchaseReportApiResponse<T = any> {
  report_type: PurchaseReportType
  items: T[]
  pagination: PurchaseReportPagination
  summary: PurchaseReportSummaryTotals
  filters_applied: PurchaseReportFilterParams
}

export interface FilterOptionItem {
  id: number
  kode?: string
  nama: string
}

export interface PurchaseReportFilterOptions {
  suppliers: FilterOptionItem[]
  materials: FilterOptionItem[]
  warehouses: FilterOptionItem[]
  users: { id: number; username: string }[]
  statuses: { value: string; label: string }[]
  receipt_statuses: { value: string; label: string }[]
  payment_statuses: { value: string; label: string }[]
}

export interface ReportColumnConfig {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  visible: boolean
  sortable?: boolean
  width?: string
}

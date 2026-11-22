import type { PaginationParams, SortParams } from '@/shared/types/pagination.types'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'
export type { SalesOrderVariantKey } from '../config/sales-order-variants'

/* =========================================================================
   1. LEGACY RETRO-COMPATIBILITY TYPES (FOR MOCK SERVICE TESTS)
   ========================================================================= */
export type LegacySalesOrderStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface SalesOrderSummary {
  [key: string]: unknown
  id: string
  orderNumber: string
  customerName: string
  orderDate: string
  status: LegacySalesOrderStatus
  totalAmount: number
}

export interface SalesOrderQueryParams extends Partial<PaginationParams> {
  search?: string
  status?: string
  sort?: SortParams
  scenario?: 'default' | 'empty' | 'validation_error' | 'server_error' | 'network_error'
}

/* =========================================================================
   2. DOMAIN CONSTANTS & ENUMS (MARIADB MAPPING)
   ========================================================================= */
export const STATUS_DOKUMEN_SO = {
  DRAFT: 0,
  SUCCEEDED: 1
} as const

export type StatusDokumenSO = (typeof STATUS_DOKUMEN_SO)[keyof typeof STATUS_DOKUMEN_SO]

export const STATUS_PRODUKSI_ITEM = {
  READY_STOCK: 0,
  PRODUKSI: 1
} as const

export type StatusProduksiItem = (typeof STATUS_PRODUKSI_ITEM)[keyof typeof STATUS_PRODUKSI_ITEM]

export type PaymentStatus = 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS'
export type DeliveryStatus = 'BELUM_KIRIM' | 'TERKIRIM'

/* =========================================================================
   3. ENTITY MODELS (MATCHING MARIADB SCHEMA)
   ========================================================================= */
export interface SalesOrder {
  id: number
  customer_id: number
  kode: string
  tanggal: string
  keterangan: string | null
  is_ppn: number // 1 or 0
  ppn_id: number | null
  subtotal: number
  diskon: number // Diskon SO (persentase atau amount)
  total_ppn: number
  status: number // 0 = Draft, 1 = Succeeded
  total: number
  status_produksi: number // 0 = Ready, 1 = Perlu Produksi
  status_aktif: number // 1 = Aktif, 0 = Batal / Void
  count_print: number
  no_faktur_pajak: string | null
  sales_id: number
  uuid?: string | null
  order_type: 'PPN' | 'NON_PPN' | 'NON_PPN_2'
  created_at?: string
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
  terbayar?: number
  sisa?: number
  payment_status?: PaymentStatus
}

export interface DetailSalesOrder {
  id: number
  sales_order_id: number
  produk_id: number
  qty: number
  harga: number
  diskon: number // Diskon per item (%)
  subtotal: number // Qty * Harga * (1 - Diskon/100)
  status_produksi: number // Jenis Stok: 0 = Ready Stock, 1 = Produksi
  keterangan: string | null
}

export interface KomponenSalesOrder {
  id: number
  sales_order_id: number
  komponen: string // Nama komponen / Biaya Tambahan (cth. "ONGKIR GRESIK")
  jumlah: number // Nominal biaya tambahan
}

/* =========================================================================
   4. LOOKUP & REFERENCE TYPES
   ========================================================================= */
export interface SalesPerson {
  id: number
  nik?: string
  nama: string
  no_hp?: string
}

export interface MasterPpn {
  id: number
  kode: string
  nama: number // Tarif persentase (e.g. 11 for 11%)
  status: number
  is_active: number
}

/* =========================================================================
   5. VIEWMODELS FOR UI & SPREADSHEET
   ========================================================================= */
export interface SalesOrderProductRow {
  rowId: string
  id?: number
  produk_id: number | null
  kode_produk?: string
  nama_produk: string
  stok_saat_ini: number
  satuan_nama?: string
  qty: number
  status_produksi: number // 0 = Ready Stock, 1 = Produksi
  harga: number
  diskon: number // %
  subtotal: number
  keterangan: string
}

export interface SalesOrderListItem {
  id: number
  variant: SalesOrderVariantKey
  kode: string
  tanggal: string
  customer_id: number
  customer_nama: string
  customer_kode?: string
  sales_id: number
  sales_nama: string
  subtotal: number
  diskon: number
  total_ppn: number
  total: number
  terbayar: number
  sisa: number
  payment_status: PaymentStatus
  delivery_status: DeliveryStatus
  status: number // 0 = Draft, 1 = Succeeded
  status_aktif: number
  count_print: number
  no_faktur_pajak: string | null
  has_komponen: boolean
  total_komponen: number
}

export interface SalesOrderWithDetails extends SalesOrder {
  variant: SalesOrderVariantKey
  customer_nama: string
  customer_alamat?: string
  customer_telepon?: string
  sales_nama: string
  ppn_persen?: number
  items: Array<
    DetailSalesOrder & {
      kode_produk?: string
      nama_produk?: string
      satuan_nama?: string
      stok_saat_ini?: number
    }
  >
  biaya_tambahan: KomponenSalesOrder[]
  terbayar: number
  sisa: number
  payment_status: PaymentStatus
  delivery_status: DeliveryStatus
}

/* =========================================================================
   6. PAYLOAD & FORM TYPES
   ========================================================================= */
export interface SalesOrderFormValues {
  id?: number
  kode: string
  customer_id: number | null
  tanggal: string
  sales_id: number | null
  keterangan: string
  no_faktur_pajak: string
  is_ppn: number
  ppn_id: number | null
  ppn_rate: number
  status: number
  diskon?: number
}

export interface SalesOrderCreatePayload {
  variant: SalesOrderVariantKey
  kode: string
  customer_id: number
  tanggal: string
  sales_id: number
  keterangan?: string | null
  no_faktur_pajak?: string | null
  is_ppn: number
  ppn_id?: number | null
  status: number
  diskon?: number
  items: Array<{
    produk_id: number
    qty: number
    harga: number
    diskon: number
    status_produksi: number
    keterangan?: string | null
  }>
  biaya_tambahan?: Array<{
    komponen: string
    jumlah: number
  }>
}

export interface SalesOrderUpdatePayload extends Partial<SalesOrderCreatePayload> {
  id: number
}

export interface SalesOrderFilters {
  search?: string
  startDate?: string
  endDate?: string
  sales_id?: number | null
  status?: number | null
  payment_status?: string | null
  delivery_status?: string | null
}

/* =========================================================================
   8. SPRINT 10: PRODUCTION INTEGRATION TYPES
   ========================================================================= */
export type StatusProduksiSummary =
  | 'TIDAK_BUTUH_PRODUKSI'
  | 'MENUNGGU_PRODUKSI'
  | 'DALAM_PROSES'
  | 'SEBAGIAN_SELESAI'
  | 'SELESAI'

export interface LinkedProductionDetailItem {
  id: number
  produk_id: number
  kode_produk: string
  nama_produk: string
  qty: number
  keterangan: string
}

export interface LinkedProductionOrder {
  id: number
  kode: string
  tanggal: string
  jenis_produksi: number
  jenis_label: string
  status_produksi: number
  status_produksi_label: string
  status: number
  status_label: string
  status_aktif: number
  total_qty: number
  keterangan: string
  items: LinkedProductionDetailItem[]
  created_at?: string
}

export interface LinkedProductionSummary {
  total_productions: number
  active_productions: number
  pending_count: number
  in_progress_count: number
  completed_count: number
  total_produced_qty: number
}

export interface LinkedProductionsResponse {
  so_id: number
  so_kode: string
  status_produksi_summary: StatusProduksiSummary
  summary: LinkedProductionSummary
  productions: LinkedProductionOrder[]
}

export interface ProductionRequirementItem {
  produk_id: number
  kode_produk: string
  nama_produk: string
  so_qty: number
  current_stock: number
  allocated_stock: number
  net_shortage: number
  existing_production_qty: number
  unfulfilled_qty: number
  keterangan?: string | null
}

export interface ProductionRequirementAnalysis {
  so_id: number
  so_kode: string
  customer_id: number
  customer_nama: string
  needs_production: boolean
  total_items: number
  total_shortage: number
  items: ProductionRequirementItem[]
}

export interface ProductionSyncResponse {
  status: 'NO_SHORTAGE' | 'UP_TO_DATE' | 'UPDATED' | 'CREATED' | 'CANCELLED'
  message: string
  production?: {
    id: number
    kode: string
    status_produksi: number
  }
}

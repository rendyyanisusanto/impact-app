import type { BaseEntity, ListQuery } from '@/shared/types/crud.types'

/**
 * 1. Database-shaped entity for Header Purchase Order (table: `purchase_order`)
 */
export interface PurchaseOrder extends BaseEntity {
  id: number
  kode: string | null
  suplier_id: number | null // Note: legacy column spelling is `suplier_id`
  tanggal: string | null // ISO date YYYY-MM-DD
  keterangan: string | null
  is_ppn: number // 0 or 1
  ppn_id: number | null
  subtotal: number | null // decimal(20,2)
  diskon: number | null // decimal(20,2) - Global discount
  total: number | null // decimal(20,2) - Grand total
  status: number | null // tinyint(1): 0 = Draft / Menunggu, 1 = Disetujui / Selesai
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
  total_ppn: number | null // decimal(20,2)
  status_aktif: number // 1 = Aktif, 0 = Dibatalkan / Nonaktif
  status_transaksi_id: number | null // 1 = CASH, 2 = JATUH TEMPO
  uuid: string | null
}

/**
 * 2. Database-shaped entity for Detail Purchase Order (table: `detail_purchase_order`)
 */
export interface PurchaseOrderDetail {
  id: number
  purchase_order_id: number
  bahan_id: number | null
  qty: number | null
  satuan_beli_id: number | null
  harga: number | null
  diskon: number | null // int(11) in SQL: percentage discount (0-100)
  subtotal: number | null
  keterangan: string | null
}

/**
 * 3. Status Transaksi entity (table: `status_transaksi`)
 */
export interface StatusTransaksi {
  id: number
  status_transaksi: string // 'CASH' | 'JATUH TEMPO'
}

/**
 * 4. Resolved List Item for AppDataTable display
 */
export interface PurchaseOrderListItem extends PurchaseOrder {
  suplier_nama?: string
  status_transaksi_nama?: string
  status_label?: string
  status_aktif_label?: string
  ppn_persen?: number
  items_count?: number
}

/**
 * 5. UI Spreadsheet Row Model for Material Detail Table
 */
export interface PurchaseOrderDetailRow {
  row_id: string // Client UUID for keying dynamic rows
  id?: number // Database detail id if editing existing record
  bahan_id: number | null
  nama_bahan: string
  satuan_beli_id: number | null
  nama_satuan: string
  stok: number // Read-only current stock from `master_data_bahan.qty`
  qty: number | null
  harga: number | null
  diskon: number | null // Discount percentage (0 - 100)
  subtotal: number | null // Read-only calculated: qty * harga * (1 - diskon/100)
  keterangan: string
  // Validation errors
  errors?: Partial<Record<'bahan_id' | 'qty' | 'harga' | 'diskon' | 'keterangan', string>>
}

/**
 * 6. Form Header Values for Create/Edit
 */
export interface PurchaseOrderFormValues {
  id?: number
  kode: string
  suplier_id: number | null
  tanggal: string
  keterangan: string
  is_ppn: boolean
  ppn_id: number | null
  status_transaksi_id: number | null
  status: number // 0 or 1
  diskon_persen: number // Global discount percentage in UI
}

/**
 * 7. Calculation Summary Results
 */
export interface PurchaseOrderSummary {
  subtotal: number
  diskon_persen: number
  diskon_nominal: number
  total_sebelum_ppn: number
  ppn_persen: number
  total_ppn: number
  total: number
}

/**
 * 8. Service Payloads
 */
export interface PurchaseOrderCreatePayload {
  header: {
    kode: string
    suplier_id: number
    tanggal: string
    keterangan?: string | null
    is_ppn: number
    ppn_id?: number | null
    subtotal: number
    diskon: number // nominal diskon global
    total: number
    total_ppn: number
    status: number
    status_transaksi_id: number
    status_aktif?: number
  }
  details: Array<{
    bahan_id: number
    qty: number
    satuan_beli_id: number
    harga: number
    diskon: number
    subtotal: number
    keterangan?: string | null
  }>
}

export interface PurchaseOrderUpdatePayload extends PurchaseOrderCreatePayload {
  id: number
}

/**
 * 9. Filter Queries
 */
export interface PurchaseOrderFilters extends Omit<ListQuery, 'status'> {
  startDate?: string
  endDate?: string
  suplier_id?: number | null
  status_transaksi_id?: number | null
  status?: number | string | boolean | null
  status_aktif?: number | null
  perPage?: number
}

/**
 * 10. Setting Table Types (Sprint 15 Fitur Baru)
 */
export interface PurchaseOrderPlaceholderInfo {
  token: string
  description: string
  example: string
}

export interface PurchaseOrderCodeSettingResponse {
  template: string
  preview: string
  supported_placeholders: PurchaseOrderPlaceholderInfo[]
}

/**
 * IMPACT FURNITURE V2 - SPRINT 4 TASK 6 & 7
 * GOODS RECEIPT (PENERIMAAN BARANG) TYPE DEFINITIONS
 *
 * Strictly mapped from database tables `penerimaan_barang` and `detail_penerimaan_barang`.
 * UI-only calculation fields are clearly marked.
 */

import type { PaginatedResponse } from '@/shared/types/crud.types'

/**
 * 1. Database Entity: `penerimaan_barang` (Header)
 */
export interface GoodsReceipt {
  id: number
  kode: string | null
  purchase_order_id: number | null
  no_surat_jalan: string | null
  gudang_id: number | null
  tanggal: string | null // YYYY-MM-DD
  nama_pengirim: string | null
  keterangan: string | null
  status: number | null // 0 = Draft, 1 = Diterima
  created_at: string
  created_by: number | null
  updated_at: string
  updated_by: number | null
  status_aktif: number // 1 = Aktif, 0 = Dibatalkan
  total_pembayaran: number | null
  nilai_pb: number | null
  is_ppn: number // 0 or 1
  ppn_id: number | null
  subtotal: number | null
  diskon: number | null
  total: number | null
  total_ppn: number | null
  uuid: string | null
}

/**
 * 2. Database Entity: `detail_penerimaan_barang` (Detail Items)
 * Note: Table does NOT have `subtotal` or `keterangan` in MariaDB schema.
 */
export interface GoodsReceiptDetail {
  id: number
  penerimaan_barang_id: number | null
  bahan_id: number | null
  qty_pesan: number | null
  qty_terima: number | null
  satuan_beli_id: number | null
  harga_satuan: number | null
  diskon: number | null // percentage integer/double
}

/**
 * 3. Enriched List Item for DataTable
 */
export interface GoodsReceiptListItem {
  id: number
  kode: string
  purchase_order_id: number | null
  kode_po: string
  suplier_id: number | null
  nama_suplier: string
  no_surat_jalan: string
  gudang_id: number | null
  nama_gudang: string
  tanggal: string
  nama_pengirim: string
  keterangan: string
  nilai_pb: number
  subtotal: number
  diskon: number
  total_ppn: number
  total: number
  status: number // 0 = Draft, 1 = Diterima
  status_label: string
  status_aktif: number // 1 = Aktif, 0 = Dibatalkan
  status_aktif_label: string
  item_count: number
}

/**
 * 4. Interactive Spreadsheet Row ViewModel
 */
export interface GoodsReceiptDetailRow {
  row_id: string // Client UUID for keying dynamic rows
  id?: number // Database detail id if editing existing record
  bahan_id: number | null
  kode_bahan: string
  nama_bahan: string
  satuan_beli_id: number | null
  nama_satuan: string
  stok: number // Current inventory stock from `master_data_bahan.qty`
  qty_pesan: number // From PO detail (read-only)
  already_received_qty: number // Total received in other PBs for this PO
  remaining_qty: number // Remaining unreceived: max(0, qty_pesan - already_received_qty)
  qty_terima: number | null // Actual received quantity (Editable)
  harga_satuan: number | null // Unit price from PO
  diskon: number | null // Discount % from PO
  subtotal: number | null // Calculated UI-only: qty_terima * harga_satuan * (1 - diskon/100)
  errors?: Partial<Record<'qty_terima' | 'harga_satuan' | 'diskon', string>>
}

/**
 * 5. Form Header Values for Create/Edit
 */
export interface GoodsReceiptFormValues {
  id?: number
  kode: string
  purchase_order_id: number | null
  no_surat_jalan: string
  gudang_id: number | null
  tanggal: string
  nama_pengirim: string
  keterangan: string
  is_ppn: boolean
  ppn_id: number | null
  ppn_persen: number
  diskon_persen: number
  status: number // 0 = Draft, 1 = Diterima
}

/**
 * 6. Calculation Summary Results
 */
export interface GoodsReceiptSummary {
  nilai_pb: number // Gross total of received materials
  subtotal: number
  diskon_persen: number
  diskon_nominal: number
  total_sebelum_ppn: number
  ppn_persen: number
  total_ppn: number
  total: number // Net grand total
}

/**
 * 7. Service Create & Update Payloads
 */
export interface GoodsReceiptCreatePayload {
  header: {
    kode: string
    purchase_order_id: number
    no_surat_jalan: string
    gudang_id: number
    tanggal: string
    nama_pengirim?: string | null
    keterangan?: string | null
    is_ppn: number
    ppn_id?: number | null
    subtotal: number
    diskon: number // nominal diskon
    total: number
    total_ppn: number
    nilai_pb: number
    status: number
    status_aktif?: number
  }
  details: Array<{
    bahan_id: number
    qty_pesan: number
    qty_terima: number
    satuan_beli_id: number
    harga_satuan: number
    diskon: number
  }>
}

export interface GoodsReceiptUpdatePayload {
  header: Partial<GoodsReceiptCreatePayload['header']>
  details: Array<{
    id?: number
    bahan_id: number
    qty_pesan: number
    qty_terima: number
    satuan_beli_id: number
    harga_satuan: number
    diskon: number
  }>
}

/**
 * 8. List Filtering & Query Parameters
 */
export interface GoodsReceiptFilters {
  search?: string
  suplier_id?: number | string
  gudang_id?: number | string
  status?: number | string
  status_aktif?: number | string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 9. Eligible Purchase Order for Selection Dropdown
 */
export interface EligiblePurchaseOrder {
  id: number
  kode: string
  tanggal: string | null
  suplier_id: number | null
  nama_suplier: string
  status: number | null
  is_ppn: number
  ppn_id: number | null
  total: number | null
  item_count: number
  fully_received: boolean
}

export interface GoodsReceiptPlaceholderInfo {
  token: string
  description: string
  example: string
}

export interface GoodsReceiptCodeSettingResponse {
  template: string
  preview: string
  supported_placeholders: GoodsReceiptPlaceholderInfo[]
}

export type PaginatedGoodsReceiptResponse = PaginatedResponse<GoodsReceiptListItem>

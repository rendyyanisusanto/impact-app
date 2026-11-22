/**
 * Bill Payment (Pembayaran Tagihan) Domain Types
 * Exactly mapped from MariaDB tables:
 * - `pembayaran_tagihan`
 * - `detail_pembayaran_tagihan`
 * - `detail_pb_pt`
 */

import type { PaginatedResponse } from '@/shared/types/crud.types'

/**
 * 1. Database Entity: `pembayaran_tagihan`
 */
export interface BillPayment {
  id: number
  kode: string | null
  total: number | null // Total nominal tagihan
  tanggal: string | null // YYYY-MM-DD
  created_at: string
  created_by: number | null
  updated_at: string
  updated_by: number | null
  status: number | null // 0 = Belum Lunas / Draft, 1 = Lunas
  status_aktif: number // 1 = Aktif, 0 = Dibatalkan
  no_tagihan: string | null // Invoice/bill number from supplier
  penagih: string | null // Collector / submitter
  jatuh_tempo: string | null // Due date
  keterangan: string | null
  diskon: number | null
  is_ppn: number | null // 0 or 1
  ppn_id: number | null
  subtotal: number | null
  total_ppn: number | null
  suplier_id: number | null
  total_bayar: number | null // Amount paid in this transaction
  uuid: string | null
}

/**
 * 2. Database Entity: `detail_pembayaran_tagihan`
 */
export interface BillPaymentDetail {
  id: number
  pembayaran_tagihan_id: number | null
  metode_pembayaran: string | null // 'Transfer Bank', 'Cash', 'Giro'
  bank_id: number | null
  jumlah: number | null
  keterangan: string | null
}

/**
 * 3. Database Entity: `detail_pb_pt` (Relation between PB & PT)
 */
export interface DetailPbPt {
  id: number
  pb_id: number | null
  pt_id: number | null
  nominal_alokasi?: number
}

export interface PbAllocationItem {
  pb_id: number
  nominal_alokasi: number
}

export interface BillPaymentPlaceholderInfo {
  token: string
  description: string
  example: string
}

export interface BillPaymentCodeSettingResponse {
  template: string
  preview: string
  supported_placeholders: BillPaymentPlaceholderInfo[]
}

/**
 * 4. Resolved List Item for AppDataTable
 */
export interface BillPaymentListItem extends BillPayment {
  nama_suplier: string
  bank_nama: string
  metode_pembayaran: string
  status_label: string
  status_aktif_label: string
  pb_count: number
}

/**
 * 5. Eligible Goods Receipt for Payment Allocation
 */
export interface EligibleGoodsReceiptForPayment {
  id: number
  kode: string
  purchase_order_id?: number | null
  kode_po?: string
  no_po?: string
  po_kode?: string
  tanggal: string | null
  suplier_id: number | null
  nama_suplier: string
  total_pb: number
  sudah_dibayar: number
  sisa_tagihan: number
  isSelected?: boolean
  nominal_alokasi?: number
  sisa_setelah_bayar?: number
}

/**
 * 6. UI Form Values
 */
export interface BillPaymentFormValues {
  id?: number
  kode: string
  no_tagihan: string
  tanggal: string
  jatuh_tempo: string
  penagih: string
  suplier_id: number | null
  keterangan: string
  status: number
  selected_pb_ids: number[]
  allocations?: PbAllocationItem[]
  payment_methods: Array<{
    id?: number
    metode_pembayaran: string
    bank_id: number | null
    jumlah: number
    keterangan: string
  }>
}

/**
 * 7. Creation & Update Payloads
 */
export interface BillPaymentCreatePayload {
  kode: string
  no_tagihan: string
  tanggal: string
  jatuh_tempo?: string
  penagih?: string
  suplier_id: number
  keterangan?: string
  status?: number
  pb_ids?: number[]
  allocations?: PbAllocationItem[]
  payment_methods: Array<{
    metode_pembayaran: string
    bank_id?: number | null
    jumlah: number
    keterangan?: string
  }>
}

export interface BillPaymentUpdatePayload {
  no_tagihan?: string
  tanggal?: string
  jatuh_tempo?: string
  penagih?: string
  keterangan?: string
  status?: number
  pb_ids?: number[]
  allocations?: PbAllocationItem[]
  payment_methods?: Array<{
    id?: number
    metode_pembayaran: string
    bank_id?: number | null
    jumlah: number
    keterangan?: string
  }>
}

/**
 * 8. Filters & Query Parameters
 */
export interface BillPaymentFilters {
  search?: string
  suplier_id?: number | string
  bank_id?: number | string
  status?: number | string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type PaginatedBillPaymentResponse = PaginatedResponse<BillPaymentListItem>

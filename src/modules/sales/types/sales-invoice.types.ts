/**
 * Sales Invoice Domain Models & Types
 * Mapped to legacy MariaDB schema: `pembayaran_sales_order` & `setting_table`
 */

import type { SalesOrderVariantKey } from '../config/sales-order-variants'

export type InvoiceType = 'DP' | 'Termin' | 'Pelunasan' | 'TERMIN' | 'PELUNASAN'
export type InvoicePaymentStatus = 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS'
export type InvoiceStatus = 1 | 0 // 1 = Aktif, 0 = Batal

export type InvoiceSummaryStatus = 'Belum Invoice' | 'Sebagian Invoice' | 'Sudah Invoice'

export interface SalesInvoice {
  id: number
  so_id: number
  kode: string // e.g. "INV/26/X/0343-1"
  tanggal: string // YYYY-MM-DD
  jenis: InvoiceType
  subtotal: number // DPP (Dasar Pengenaan Pajak)
  total_ppn: number // PPN nominal (0 for Non-PPN)
  total: number // Gross total of this invoice (DPP + PPN)
  no_faktur_pajak: string | null
  terbayar: number // Amount already paid (from payments)
  status_pembayaran: InvoicePaymentStatus
  status: InvoiceStatus // 1 = Aktif, 0 = Batal
  keterangan: string | null
  count_print?: number
  created_at: string
  created_by: number
  created_by_nama?: string
  updated_at?: string | null
  updated_by?: number | null
  uuid?: string
}

export interface SalesInvoiceListItem extends SalesInvoice {
  so_kode: string
  so_variant?: SalesOrderVariantKey
  customer_id?: number
  customer_nama: string
  sisa_pembayaran: number // total - terbayar
  payment_count?: number
}

export interface SalesInvoiceCreatePayload {
  so_id: number
  kode: string
  jenis: InvoiceType
  tanggal: string
  total: number // Nominal total tagihan invoice
  subtotal: number // DPP
  total_ppn: number // PPN
  no_faktur_pajak?: string | null
  keterangan?: string | null
  variant: SalesOrderVariantKey
}

export interface SalesOrderInvoiceSummary {
  order_id: number
  order_kode: string
  variant: SalesOrderVariantKey
  tanggal: string
  customer_nama: string
  customer_alamat?: string
  customer_telepon?: string
  sales_nama: string
  is_ppn: number
  ppn_rate: number
  total_dpp: number
  total_ppn: number
  total_so: number
  sudah_invoice: number
  sisa_invoice: number
  invoice_status: InvoiceSummaryStatus
  count_invoices: number
}

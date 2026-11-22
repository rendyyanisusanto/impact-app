/**
 * Sales Payment Domain Models & Types
 * Mapped to legacy MariaDB schema: `detail_pembayaran_sales_order` & `pembayaran_sales_order`
 */

import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import type { InvoiceType, InvoicePaymentStatus } from './sales-invoice.types'

export type PaymentMethod = 'TRANSFER' | 'TUNAI' | 'CEK/GIRO'
export type PaymentStatus = 1 | 0 // 1 = Aktif / Posted, 0 = Dibatalkan / Reversal

export interface SalesPayment {
  id: number
  kode: string // e.g. "PAY/2026/11/0001" or "PAY-INV/26/XI/0344-1/01"
  invoice_id: number // Foreign key to `pembayaran_sales_order.id` (MANDATORY)
  invoice_kode: string
  so_id: number // Foreign key to `sales_order.id` (denormalized reference)
  so_kode: string
  variant: SalesOrderVariantKey
  customer_id?: number
  customer_nama: string
  tanggal: string // YYYY-MM-DD
  metode_pembayaran: PaymentMethod
  bank_id: number | null
  bank_nama: string | null
  bank_rekening: string | null
  jumlah: number // Nominal pembayaran aktual
  keterangan: string | null
  bukti_bayar: string | null // Referensi nomor transfer / bukti
  status: PaymentStatus // 1 = Aktif, 0 = Dibatalkan
  alasan_batal?: string | null
  created_at: string
  created_by: number
  created_by_nama: string
  updated_at?: string | null
  updated_by?: number | null
  is_posted_to_finance: boolean // Contract flag for Sprint 8 Kas/Bank integration
  uuid?: string
  invoice_count?: number
  invoices_summary?: string
  details?: Array<{
    id: number
    sales_invoice_id: number
    invoice_kode: string
    invoice_jenis?: string
    customer_nama?: string
    so_id?: number
    so_kode?: string
    total_invoice?: number
    jumlah: number
    nominal?: number
    metode_pembayaran: string
    bank_id: number | null
    bank_nama: string | null
    bank_rekening: string | null
    bukti_bayar: string | null
    keterangan: string | null
  }>
}

export interface SalesInvoicePaymentSummary {
  invoice_id: number
  invoice_kode: string
  so_id: number
  so_kode: string
  variant: SalesOrderVariantKey
  customer_id?: number
  customer_nama: string
  customer_alamat?: string
  customer_telepon?: string
  tanggal_invoice: string
  jenis_invoice: InvoiceType
  total_invoice: number
  total_dpp: number
  total_ppn: number
  sudah_dibayar: number
  sisa_pembayaran: number
  status_pembayaran: InvoicePaymentStatus
  count_payments: number
  // Parent Sales Order Context
  total_so: number
  total_sudah_invoice_so: number
  total_sudah_dibayar_so: number
}

export interface PaymentAllocationItem {
  invoice_id: number
  amount: number
  keterangan?: string | null
  bukti_bayar?: string | null
  // UI Grid Enriched fields
  invoice_kode?: string
  so_id?: number
  so_kode?: string
  so_variant?: string
  invoice_jenis?: string
  invoice_tanggal?: string
  total_invoice?: number
  sudah_dibayar?: number
  sisa_tagihan?: number
  sisa_setelah_bayar?: number
  error?: string | null
}

export interface EligibleInvoice {
  invoiceId: number
  invoiceCode: string
  id: number
  kode: string
  salesOrderId: number
  sales_order_id: number
  salesOrderCode: string
  so_kode: string
  soVariant: SalesOrderVariantKey
  invoiceType: InvoiceType
  jenis: InvoiceType
  invoiceDate: string
  tanggal: string
  customerId: number
  customer_id: number
  customerName: string
  customer_nama: string
  customerAddress?: string
  customerPhone?: string
  invoiceTotal: number
  total: number
  totalPaid: number
  terbayar: number
  remainingBalance: number
  sisa_tagihan: number
  paymentStatus: InvoicePaymentStatus
  status_pembayaran: InvoicePaymentStatus
  eligible: boolean
  canPay: boolean
}

export interface CreatePaymentPayload {
  customerId?: number | null
  customer_id?: number | null
  invoice_id?: number // Optional if allocations provided
  tanggal: string
  metode_pembayaran: PaymentMethod
  bank_id?: number | null
  jumlah?: number // Optional if allocations provided
  keterangan?: string | null
  bukti_bayar?: string | null
  idempotency_key?: string
  allocations?: PaymentAllocationItem[]
}

export interface UpdatePaymentPayload {
  tanggal?: string
  metode_pembayaran?: PaymentMethod
  bank_id?: number | null
  jumlah?: number
  keterangan?: string | null
  bukti_bayar?: string | null
}

export interface PaymentCalculationResult {
  totalInvoice: number
  sudahDibayar: number
  sisaPembayaran: number
  statusPembayaran: InvoicePaymentStatus
}

export interface FinancePostingContract {
  payment_id: number
  payment_kode: string
  tanggal: string
  metode: PaymentMethod
  bank_id: number | null
  nominal: number
  keterangan: string
  is_posted: boolean
  posted_at?: string | null
}

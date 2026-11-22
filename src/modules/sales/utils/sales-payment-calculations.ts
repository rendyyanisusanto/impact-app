/**
 * Pure calculation utilities for Sales Payments
 * Follows decimal-safe integer math in Rupiah
 */

import type {
  PaymentCalculationResult,
  SalesPayment,
  PaymentStatus
} from '../types/sales-payment.types'
import type { InvoicePaymentStatus } from '../types/sales-invoice.types'

/**
 * Resolves the payment status based on total invoice and amount paid.
 */
export function resolvePaymentStatus(
  totalInvoice: number,
  sudahDibayar: number
): InvoicePaymentStatus {
  const roundedTotal = Math.round(totalInvoice || 0)
  const roundedPaid = Math.round(sudahDibayar || 0)

  if (roundedPaid <= 0) {
    return 'BELUM_BAYAR'
  }
  if (roundedPaid >= roundedTotal) {
    return 'LUNAS'
  }
  return 'SEBAGIAN'
}

/**
 * Calculates payment summary (total, sudah dibayar, sisa, status) from a list of payments.
 * Strictly ignores cancelled payments (status === 0).
 */
export function calculatePaymentSummary(
  totalInvoice: number,
  payments: Array<{ jumlah: number; status: PaymentStatus | number }>
): PaymentCalculationResult {
  const roundedTotal = Math.round(totalInvoice || 0)

  // Accumulate active payments only
  const sudahDibayar = payments
    .filter(p => p.status === 1)
    .reduce((sum, p) => sum + Math.round(Number(p.jumlah) || 0), 0)

  const sisaPembayaran = Math.max(0, roundedTotal - sudahDibayar)
  const statusPembayaran = resolvePaymentStatus(roundedTotal, sudahDibayar)

  return {
    totalInvoice: roundedTotal,
    sudahDibayar,
    sisaPembayaran,
    statusPembayaran
  }
}

/**
 * Generates next payment code based on invoice code and existing payment sequence.
 * Pattern: "PAY/{cleanInvoiceCode}/{seq}" (e.g. "PAY/26/XI/0344-1/01")
 */
export function generatePaymentCode(invoiceKode: string, existingPayments: SalesPayment[]): string {
  const cleanCode = invoiceKode.replace(/^INV\//i, '')
  const currentCount = existingPayments.length
  const seq = String(currentCount + 1).padStart(2, '0')
  return `PAY/${cleanCode}/${seq}`
}

/**
 * Validates whether a payment amount is eligible for the given remaining balance.
 */
export function validatePaymentAmount(
  amount: number,
  sisaPembayaran: number
): { isValid: boolean; error?: string } {
  const roundedAmount = Math.round(amount || 0)
  const roundedSisa = Math.round(sisaPembayaran || 0)

  if (isNaN(roundedAmount) || roundedAmount <= 0) {
    return { isValid: false, error: 'Nominal pembayaran harus lebih besar dari Rp 0.' }
  }

  if (roundedAmount > roundedSisa) {
    return {
      isValid: false,
      error: `Nominal pembayaran (Rp ${roundedAmount.toLocaleString('id-ID')}) melebihi sisa tagihan invoice (Rp ${roundedSisa.toLocaleString('id-ID')}).`
    }
  }

  return { isValid: true }
}

/**
 * Calculates payment aggregations for a Sales Order:
 * - total_so: Nominal final pesanan
 * - total_sudah_invoice: Total akumulasi invoice aktif
 * - total_sudah_dibayar: Total pembayaran aktif yang diterima
 * - sisa_so_dibayar: max(0, total_so - total_sudah_dibayar)
 */
export function calculateSalesOrderPaymentSummary(
  totalSo: number,
  activeInvoices: Array<{ id: number; total: number; status: number }>,
  activePayments: Array<{ invoice_id: number; jumlah: number; status: number }>
) {
  const roundedTotalSo = Math.round(totalSo || 0)

  const totalSudahInvoice = activeInvoices
    .filter(i => i.status === 1)
    .reduce((sum, i) => sum + Math.round(Number(i.total) || 0), 0)

  const activeInvoiceIds = new Set(activeInvoices.filter(i => i.status === 1).map(i => i.id))

  const totalSudahDibayar = activePayments
    .filter(p => p.status === 1 && activeInvoiceIds.has(p.invoice_id))
    .reduce((sum, p) => sum + Math.round(Number(p.jumlah) || 0), 0)

  const sisaSoDibayar = Math.max(0, roundedTotalSo - totalSudahDibayar)

  const paymentStatus: InvoicePaymentStatus =
    totalSudahDibayar <= 0
      ? 'BELUM_BAYAR'
      : totalSudahDibayar >= roundedTotalSo
        ? 'LUNAS'
        : 'SEBAGIAN'

  return {
    total_so: roundedTotalSo,
    total_sudah_invoice: totalSudahInvoice,
    total_sudah_dibayar: totalSudahDibayar,
    sisa_so_dibayar: sisaSoDibayar,
    payment_status: paymentStatus
  }
}

/**
 * Converts a numeric amount to Indonesian formal word format (Terbilang).
 */
export function terbilangRupiah(nominal: number): string {
  const angka = Math.abs(Math.round(nominal || 0))
  if (angka === 0) return 'Nol Rupiah'

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas'
  ]

  function bilang(n: number): string {
    if (n < 12) return satuan[n]
    if (n < 20) return `${bilang(n - 10)} Belas`
    if (n < 100) return `${bilang(Math.floor(n / 10))} Puluh ${bilang(n % 10)}`.trim()
    if (n < 200) return `Seratus ${bilang(n - 100)}`.trim()
    if (n < 1000) return `${bilang(Math.floor(n / 100))} Ratus ${bilang(n % 100)}`.trim()
    if (n < 2000) return `Seribu ${bilang(n - 1000)}`.trim()
    if (n < 1000000) return `${bilang(Math.floor(n / 1000))} Ribu ${bilang(n % 1000)}`.trim()
    if (n < 1000000000)
      return `${bilang(Math.floor(n / 1000000))} Juta ${bilang(n % 1000000)}`.trim()
    if (n < 1000000000000)
      return `${bilang(Math.floor(n / 1000000000))} Milyar ${bilang(n % 1000000000)}`.trim()
    return `${bilang(Math.floor(n / 1000000000000))} Triliun ${bilang(n % 1000000000000)}`.trim()
  }

  return `${bilang(angka)} Rupiah`
}

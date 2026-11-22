/**
 * Sales Invoice Calculation & Generation Utilities
 * Strictly typed & decimal-safe
 */

import type {
  SalesInvoice,
  InvoiceSummaryStatus,
  InvoicePaymentStatus
} from '../types/sales-invoice.types'

/**
 * Generates next sequential invoice code for a given Sales Order.
 * Pattern follows legacy standard: replaces "SO/" with "INV/" and appends "-{index}"
 * Example:
 *  SO: "SO/26/X/0343" -> "INV/26/X/0343-1"
 *  If already exists, next is "INV/26/X/0343-2"
 */
export function generateInvoiceCode(soKode: string, existingInvoicesForSo: SalesInvoice[]): string {
  // Convert SO prefix to INV prefix
  let baseCode = soKode.trim()
  if (baseCode.startsWith('SO/')) {
    baseCode = 'INV/' + baseCode.slice(3)
  } else if (baseCode.startsWith('SO-')) {
    baseCode = 'INV-' + baseCode.slice(3)
  } else {
    baseCode = `INV/${baseCode}`
  }

  // Find max suffix among existing invoices for this SO
  let maxSeq = 0
  const prefix = `${baseCode}-`

  existingInvoicesForSo.forEach(inv => {
    if (inv.kode.startsWith(prefix)) {
      const suffix = inv.kode.slice(prefix.length)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    } else if (inv.kode === baseCode && maxSeq === 0) {
      maxSeq = 1
    }
  })

  return `${baseCode}-${maxSeq + 1}`
}

/**
 * Calculates DPP and PPN from a given gross Total Invoice amount.
 *
 * For SO Impact (PPN 11% inclusive in total invoice):
 *  DPP = Math.round((Total / (1 + rate / 100)) * 100) / 100
 *  PPN = Math.round((Total - DPP) * 100) / 100
 *  Ensures DPP + PPN === Total.
 *
 * For Non-PPN (SO Pola & SO KS):
 *  DPP = Total
 *  PPN = 0
 */
export function calculateInvoiceTaxes(
  totalInvoice: number,
  hasTax: boolean,
  taxRate: number = 11
): { dpp: number; ppn: number; total: number } {
  const cleanTotal = Math.max(0, Math.round(Number(totalInvoice) || 0))

  if (!hasTax || taxRate <= 0) {
    return {
      dpp: cleanTotal,
      ppn: 0,
      total: cleanTotal
    }
  }

  // Calculate DPP backwards from gross inclusive amount
  const factor = 1 + taxRate / 100
  const dpp = Math.round(cleanTotal / factor)
  const ppn = cleanTotal - dpp

  return {
    dpp,
    ppn,
    total: cleanTotal
  }
}

/**
 * Calculates total already invoiced and remaining invoiceable amount.
 * Strictly excludes cancelled invoices (status === 0).
 */
export function calculateInvoiceSummary(
  soGrandTotal: number,
  invoices: SalesInvoice[]
): {
  sudahInvoice: number
  sisaInvoice: number
  status: InvoiceSummaryStatus
} {
  const validInvoices = invoices.filter(inv => inv.status === 1)
  const sudahInvoice = validInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
  const sisaInvoice = Math.max(0, soGrandTotal - sudahInvoice)

  let status: InvoiceSummaryStatus = 'Belum Invoice'
  if (sudahInvoice >= soGrandTotal && soGrandTotal > 0) {
    status = 'Sudah Invoice'
  } else if (sudahInvoice > 0) {
    status = 'Sebagian Invoice'
  }

  return {
    sudahInvoice,
    sisaInvoice,
    status
  }
}

/**
 * Resolves payment status for an invoice.
 */
export function resolveInvoicePaymentStatus(
  totalInvoice: number,
  terbayar: number
): InvoicePaymentStatus {
  if (terbayar <= 0) return 'BELUM_BAYAR'
  if (terbayar >= totalInvoice) return 'LUNAS'
  return 'SEBAGIAN'
}

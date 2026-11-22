import type { PurchaseOrderDetailRow, PurchaseOrderSummary } from '../types/purchase-order.types'

/**
 * Rounds a number safely to 2 decimal places to prevent floating-point drift.
 */
export function roundDecimal(value: number, decimals = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Calculates a single detail row's subtotal.
 * Row Gross = qty * harga
 * Row Discount = Row Gross * (diskon / 100)
 * Row Subtotal = Row Gross - Row Discount
 */
export function calculateRowSubtotal(
  qty: number | null | undefined,
  harga: number | null | undefined,
  diskonPersen: number | null | undefined
): number {
  const safeQty = Math.max(0, Number(qty) || 0)
  const safeHarga = Math.max(0, Number(harga) || 0)
  const safeDiskon = Math.min(100, Math.max(0, Number(diskonPersen) || 0))

  const gross = roundDecimal(safeQty * safeHarga)
  const discountAmount = roundDecimal(gross * (safeDiskon / 100))
  return roundDecimal(gross - discountAmount)
}

/**
 * Calculates complete document summary:
 * - Document Subtotal: Sum of all valid row subtotals
 * - Document Discount: Document Subtotal * (diskon_persen / 100)
 * - Total Sebelum PPN: Document Subtotal - Document Discount
 * - Total PPN: if is_ppn -> Total Sebelum PPN * (ppn_persen / 100), else 0
 * - Grand Total: Total Sebelum PPN + Total PPN
 */
export function calculateDocumentSummary(
  rows: Array<Pick<PurchaseOrderDetailRow, 'qty' | 'harga' | 'diskon' | 'bahan_id'>>,
  isPpn: boolean,
  ppnPersen = 11,
  diskonPersen = 0
): PurchaseOrderSummary {
  // 1. Sum subtotals of rows with a valid bahan_id and positive qty
  let rawSubtotal = 0
  for (const r of rows) {
    if (r.bahan_id) {
      const rowSub = calculateRowSubtotal(r.qty, r.harga, r.diskon)
      rawSubtotal = roundDecimal(rawSubtotal + rowSub)
    }
  }

  const safeDiskonPersen = Math.min(100, Math.max(0, Number(diskonPersen) || 0))
  const diskonNominal = roundDecimal(rawSubtotal * (safeDiskonPersen / 100))
  const totalSebelumPpn = roundDecimal(Math.max(0, rawSubtotal - diskonNominal))

  const safePpnPersen = Math.max(0, Number(ppnPersen) || 0)
  const totalPpn = isPpn ? roundDecimal(totalSebelumPpn * (safePpnPersen / 100)) : 0
  const grandTotal = roundDecimal(totalSebelumPpn + totalPpn)

  return {
    subtotal: rawSubtotal,
    diskon_persen: safeDiskonPersen,
    diskon_nominal: diskonNominal,
    total_sebelum_ppn: totalSebelumPpn,
    ppn_persen: safePpnPersen,
    total_ppn: totalPpn,
    total: grandTotal
  }
}

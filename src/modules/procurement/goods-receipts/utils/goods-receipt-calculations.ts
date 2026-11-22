/**
 * IMPACT FURNITURE V2 - SPRINT 4 TASK 6 & 7
 * GOODS RECEIPT CALCULATION ENGINE
 *
 * Implements decimal-safe arithmetic for row-level subtotal, gross receipt value,
 * global discount, tax calculation, and document grand total.
 */

import type { GoodsReceiptDetailRow, GoodsReceiptSummary } from '../types/goods-receipt.types'

/**
 * Rounds a floating point number to a fixed decimal precision using round-half-up
 */
export function roundDecimal(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Calculates line subtotal for a Goods Receipt detail row.
 * Formula: Qty Terima * Harga Satuan * (1 - Diskon% / 100)
 */
export function calculateGoodsReceiptRowSubtotal(
  qtyTerima: number | null | undefined,
  hargaSatuan: number | null | undefined,
  diskonPersen: number | null | undefined
): number {
  const qty = typeof qtyTerima === 'number' && !isNaN(qtyTerima) && qtyTerima > 0 ? qtyTerima : 0
  const harga =
    typeof hargaSatuan === 'number' && !isNaN(hargaSatuan) && hargaSatuan > 0 ? hargaSatuan : 0
  const diskon =
    typeof diskonPersen === 'number' && !isNaN(diskonPersen)
      ? Math.max(0, Math.min(100, diskonPersen))
      : 0

  const gross = qty * harga
  const discountNominal = gross * (diskon / 100)
  return roundDecimal(gross - discountNominal, 2)
}

/**
 * Calculates complete document summary from detail rows and header tax/discount options.
 */
export function calculateGoodsReceiptSummary(
  rows: GoodsReceiptDetailRow[],
  isPpn: boolean,
  ppnPersen: number = 11,
  diskonPersen: number = 0
): GoodsReceiptSummary {
  // 1. Calculate sum of valid line subtotals
  let rawSubtotal = 0

  for (const row of rows) {
    if (!row.bahan_id) continue
    const rowSubtotal = calculateGoodsReceiptRowSubtotal(
      row.qty_terima,
      row.harga_satuan,
      row.diskon
    )
    rawSubtotal += rowSubtotal
  }

  const subtotal = roundDecimal(rawSubtotal, 2)
  const nilai_pb = subtotal

  // 2. Global discount
  const safeDiskonPersen = Math.max(0, Math.min(100, diskonPersen || 0))
  const diskon_nominal = roundDecimal(subtotal * (safeDiskonPersen / 100), 2)

  // 3. Total before tax
  const total_sebelum_ppn = roundDecimal(Math.max(0, subtotal - diskon_nominal), 2)

  // 4. Tax (PPN)
  const safeTaxRate = isPpn ? Math.max(0, ppnPersen || 11) : 0
  const total_ppn = isPpn ? roundDecimal(total_sebelum_ppn * (safeTaxRate / 100), 2) : 0

  // 5. Grand Total (Total PB)
  const total = roundDecimal(total_sebelum_ppn + total_ppn, 2)

  return {
    nilai_pb,
    subtotal,
    diskon_persen: safeDiskonPersen,
    diskon_nominal,
    total_sebelum_ppn,
    ppn_persen: safeTaxRate,
    total_ppn,
    total
  }
}

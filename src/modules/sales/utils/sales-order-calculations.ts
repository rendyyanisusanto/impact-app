import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import type { PaymentStatus } from '../types/sales-order.types'

/**
 * Converts month number (1-12) to Roman numeral string.
 */
export function getRomanMonth(monthNum: number): string {
  const romanMap: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    11: 'XI',
    12: 'XII'
  }
  return romanMap[monthNum] || 'I'
}

/**
 * Parses date string (YYYY-MM-DD) into year, 2-digit year, month, 2-digit month, and roman month.
 */
export function parseDateContext(dateStr: string) {
  const d = new Date(dateStr)
  const isValid = !isNaN(d.getTime())
  const now = isValid ? d : new Date()

  const fullYear = now.getFullYear()
  const shortYear = String(fullYear).slice(-2) // e.g. "26"
  const monthNum = now.getMonth() + 1
  const monthPadded = String(monthNum).padStart(2, '0') // e.g. "03"
  const romanMonth = getRomanMonth(monthNum) // e.g. "III"

  return {
    fullYear,
    shortYear,
    monthNum,
    monthPadded,
    romanMonth
  }
}

/**
 * Formats a Sales Order code based on variant and sequential counter according to legacy settings.
 * - impact: SO/{year}/{romawi_bulan}/{last_number}  -> e.g. SO/26/XI/0344
 * - pola:   SO/{year}/PL/{month}/{last_number}         -> e.g. SO/26/PL/03/0093
 * - ks:     SO/{year}/{month}/{last_number}            -> e.g. SO/26/01/0065
 */
export function formatSalesOrderCode(
  variant: SalesOrderVariantKey,
  dateStr: string,
  seq: number
): string {
  const { shortYear, monthPadded, romanMonth } = parseDateContext(dateStr)
  const paddedSeq = String(seq).padStart(4, '0')

  switch (variant) {
    case 'impact':
      return `SO/${shortYear}/${romanMonth}/${paddedSeq}`
    case 'pola':
      return `SO/${shortYear}/PL/${monthPadded}/${paddedSeq}`
    case 'ks':
      return `SO/${shortYear}/${monthPadded}/${paddedSeq}`
  }
}

/**
 * Calculates item subtotal with percentage discount.
 * Subtotal = Qty * Harga * (1 - Diskon / 100)
 */
export function calculateItemSubtotal(qty: number, harga: number, diskonPercent: number): number {
  const validQty = Math.max(0, Number(qty) || 0)
  const validPrice = Math.max(0, Number(harga) || 0)
  const validDisc = Math.min(100, Math.max(0, Number(diskonPercent) || 0))

  const gross = validQty * validPrice
  const discountAmount = gross * (validDisc / 100)
  return Math.round(gross - discountAmount)
}

/**
 * Calculates complete order totals including items, overall discount, additional components, and optional tax.
 */
export function calculateOrderTotals(
  variant: SalesOrderVariantKey,
  items: Array<{ qty: number; harga: number; diskon: number }>,
  additionalCosts: Array<{ jumlah: number }> = [],
  ppnRate: number = 11,
  overallDiscount: number = 0
) {
  // 1. Subtotal items
  const itemsSubtotal = items.reduce((sum, item) => {
    return sum + calculateItemSubtotal(item.qty, item.harga, item.diskon)
  }, 0)

  // 2. Diskon order (mengurangi subtotal)
  const validDiscount = Math.max(0, Number(overallDiscount) || 0)
  const totalSebelumPpn = Math.max(0, itemsSubtotal - validDiscount)

  // 3. Additional components (biaya tambahan)
  const totalAdditionalCosts = additionalCosts.reduce((sum, comp) => {
    return sum + Math.max(0, Number(comp.jumlah) || 0)
  }, 0)

  // 4. Tax (PPN) - untuk SO Impact dihitung dari Total Sebelum PPN
  let totalPpn = 0
  if (variant === 'impact') {
    const rate = Math.max(0, Number(ppnRate) || 0)
    totalPpn = Math.round(totalSebelumPpn * (rate / 100))
  }

  // 5. Grand total / Total Bayar
  const grandTotal = totalSebelumPpn + totalAdditionalCosts + totalPpn

  return {
    itemsSubtotal,
    discount: validDiscount,
    totalSebelumPpn,
    subtotalAfterDiscount: totalSebelumPpn,
    totalAdditionalCosts,
    taxableBase: totalSebelumPpn,
    totalPpn,
    grandTotal
  }
}

/**
 * Resolves payment status based on total invoice and paid amount.
 */
export function resolvePaymentStatus(total: number, terbayar: number): PaymentStatus {
  if (terbayar >= total && total > 0) {
    return 'LUNAS'
  }
  if (terbayar > 0 && terbayar < total) {
    return 'SEBAGIAN'
  }
  return 'BELUM_BAYAR'
}

/**
 * Returns human-readable Indonesian label for payment status.
 */
export function formatPaymentStatusLabel(status?: PaymentStatus | string | null): string {
  const s = String(status || '').toUpperCase()
  if (s === 'LUNAS' || s === 'TERBAYAR') {
    return 'Terbayar'
  }
  if (s === 'SEBAGIAN' || s === 'TERBAYAR_SEBAGIAN' || s === 'TERBAYAR SEBAGIAN') {
    return 'Terbayar Sebagian'
  }
  return 'Belum Bayar'
}

/**
 * Returns Tailwind badge classes for payment status.
 */
export function getPaymentStatusBadgeClass(status?: PaymentStatus | string | null): string {
  const s = String(status || '').toUpperCase()
  if (s === 'LUNAS' || s === 'TERBAYAR') {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (s === 'SEBAGIAN' || s === 'TERBAYAR_SEBAGIAN' || s === 'TERBAYAR SEBAGIAN') {
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-rose-100 text-rose-800'
}

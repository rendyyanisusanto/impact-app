import type { SalesOrderVariantKey } from '@/modules/sales/config/sales-order-variants'
import type { DeliveryNoteItemInput } from '../types/delivery-note.types'

/**
 * Converts a 1-based month number into Roman numerals.
 */
export function getRomanMonth(monthNumber: number): string {
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
  return romanMap[monthNumber] || String(monthNumber)
}

/**
 * Generates official Surat Jalan code strictly according to legacy MariaDB patterns:
 * - Impact: SJ/{YY}/{MM}/{SEQ4} (e.g. SJ/26/03/0312)
 * - Pola:   SJ/{YY}/PL/{MM}/{SEQ4} (e.g. SJ/26/PL/03/0069)
 * - KS:     SJ/{YY}/{ROMAN_MONTH}/{SEQ4} (e.g. SJ/26/III/0067)
 * - Pickup: If isPickup is true, prefix with SJA or preserve SJ with pickup flag
 */
export function generateDeliveryNoteCode(
  variant: SalesOrderVariantKey = 'impact',
  sequenceNumber: number = 1,
  dateStr?: string,
  isPickup: boolean = false
): string {
  const date = dateStr ? new Date(dateStr) : new Date()
  const yearTwoDigits = String(date.getFullYear()).slice(-2)
  const monthNumber = date.getMonth() + 1
  const monthTwoDigits = String(monthNumber).padStart(2, '0')
  const seqPadded = String(sequenceNumber).padStart(4, '0')

  const prefix = isPickup ? 'SJA' : 'SJ'

  switch (variant) {
    case 'pola':
      return `${prefix}/${yearTwoDigits}/PL/${monthTwoDigits}/${seqPadded}`
    case 'ks':
      return `${prefix}/${yearTwoDigits}/${getRomanMonth(monthNumber)}/${seqPadded}`
    case 'impact':
    default:
      return `${prefix}/${yearTwoDigits}/${monthTwoDigits}/${seqPadded}`
  }
}

/**
 * Resolves legacy shipping status label based on status_kirim and status_ambil
 */
export function resolveShippingStatusLabel(
  statusKirim: number,
  statusAmbil?: number | null
): 'BELUM DIKIRIM' | 'TERKIRIM' | 'AMBIL SENDIRI' {
  if (statusAmbil === 1 || statusKirim === 2) {
    return 'AMBIL SENDIRI'
  }
  if (statusKirim === 1) {
    return 'TERKIRIM'
  }
  return 'BELUM DIKIRIM'
}

/**
 * Resolves legacy document status label: 0 -> DRAFT, 1 -> SUCCEEDED, 2 -> BATAL
 */
export function resolveDocumentStatusLabel(statusDokumen: number): 'SUCCEEDED' | 'DRAFT' | 'BATAL' {
  if (statusDokumen === 2) {
    return 'BATAL'
  }
  if (statusDokumen === 1) {
    return 'SUCCEEDED'
  }
  return 'DRAFT'
}

/**
 * Calculates sum of ordered qty and delivered qty across items
 */
export function calculateDeliveryTotals(items: Array<{ qty: number; qty_kirim: number }>): {
  totalOrdered: number
  totalDelivered: number
} {
  const totalOrdered = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  const totalDelivered = items.reduce((sum, item) => sum + (Number(item.qty_kirim) || 0), 0)
  return {
    totalOrdered,
    totalDelivered
  }
}

/**
 * Calculates remaining delivery quantity
 */
export function calculateRemainingDeliveryQty(soQty: number, alreadyDelivered: number): number {
  return Math.max(0, soQty - alreadyDelivered)
}

/**
 * Validates delivery items
 */
export function validateDeliveryQuantities(items: DeliveryNoteItemInput[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!items || items.length === 0) {
    errors.push('Minimal harus ada 1 produk dalam surat jalan.')
    return { isValid: false, errors }
  }

  const totalKirim = items.reduce((acc, it) => acc + (Number(it.qty_kirim) || 0), 0)
  if (totalKirim <= 0) {
    errors.push('Total QTY pengiriman harus lebih dari 0.')
  }

  items.forEach((it, index) => {
    const qtyKirim = Number(it.qty_kirim) || 0
    const sisa = it.sisa_qty !== undefined ? it.sisa_qty : it.qty - (it.qty_sudah_dikirim || 0)

    if (qtyKirim < 0) {
      errors.push(`Baris ${index + 1}: QTY pengiriman tidak boleh bernilai negatif.`)
    } else if (qtyKirim > sisa) {
      errors.push(
        `Baris ${index + 1} (${it.nama_produk || 'Produk'}): QTY pengiriman (${qtyKirim}) melebihi sisa pesanan (${sisa}).`
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

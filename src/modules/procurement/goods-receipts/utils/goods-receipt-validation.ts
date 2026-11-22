/**
 * IMPACT FURNITURE V2 - SPRINT 4 TASK 6 & 7
 * GOODS RECEIPT VALIDATION RULES
 */

import type { GoodsReceiptFormValues, GoodsReceiptDetailRow } from '../types/goods-receipt.types'

export interface GoodsReceiptValidationResult {
  isValid: boolean
  headerErrors: Record<string, string>
  rowErrors: Record<number, Partial<Record<'qty_terima' | 'harga_satuan' | 'diskon', string>>>
}

export function validateGoodsReceiptForm(
  header: GoodsReceiptFormValues,
  rows: GoodsReceiptDetailRow[]
): GoodsReceiptValidationResult {
  const headerErrors: Record<string, string> = {}
  const rowErrors: Record<
    number,
    Partial<Record<'qty_terima' | 'harga_satuan' | 'diskon', string>>
  > = {}

  // 1. Validate Header
  if (!header.kode?.trim()) {
    headerErrors.kode = 'Nomor / Kode Penerimaan Barang wajib diisi.'
  }

  if (!header.purchase_order_id) {
    headerErrors.purchase_order_id = 'Purchase Order wajib dipilih.'
  }

  if (!header.no_surat_jalan?.trim()) {
    headerErrors.no_surat_jalan = 'Nomor Surat Jalan wajib diisi.'
  }

  if (!header.gudang_id) {
    headerErrors.gudang_id = 'Lokasi Gudang penerimaan wajib dipilih.'
  }

  if (!header.tanggal?.trim()) {
    headerErrors.tanggal = 'Tanggal penerimaan barang wajib diisi.'
  }

  // 2. Validate Detail Rows
  const activeRows = rows.filter(r => !!r.bahan_id)

  if (activeRows.length === 0) {
    headerErrors.details = 'Penerimaan barang harus memiliki setidaknya satu item bahan dari PO.'
  }

  let hasReceivedQty = false

  rows.forEach((row, index) => {
    if (!row.bahan_id) return

    const cellErrors: Partial<Record<'qty_terima' | 'harga_satuan' | 'diskon', string>> = {}

    // Qty Terima validation
    if (row.qty_terima === null || row.qty_terima === undefined || isNaN(row.qty_terima)) {
      cellErrors.qty_terima = 'Qty Terima wajib diisi angka.'
    } else if (row.qty_terima < 0) {
      cellErrors.qty_terima = 'Qty Terima tidak boleh bernilai negatif.'
    } else if (!Number.isInteger(row.qty_terima)) {
      cellErrors.qty_terima = 'Qty Terima harus berupa bilangan bulat.'
    } else if (row.qty_terima > row.remaining_qty) {
      cellErrors.qty_terima = `Qty Terima melebihi sisa pesanan (maks. ${row.remaining_qty}).`
    } else if (row.qty_terima > 0) {
      hasReceivedQty = true
    }

    // Unit price validation
    if (row.harga_satuan === null || row.harga_satuan === undefined || row.harga_satuan < 0) {
      cellErrors.harga_satuan = 'Harga satuan tidak boleh negatif.'
    }

    // Diskon validation
    if (row.diskon !== null && row.diskon !== undefined) {
      if (row.diskon < 0 || row.diskon > 100) {
        cellErrors.diskon = 'Diskon harus antara 0% s/d 100%.'
      }
    }

    if (Object.keys(cellErrors).length > 0) {
      rowErrors[index] = cellErrors
    }
  })

  if (activeRows.length > 0 && !hasReceivedQty) {
    headerErrors.details = 'Setidaknya satu baris bahan harus memiliki Qty Terima lebih dari 0.'
  }

  const isValid = Object.keys(headerErrors).length === 0 && Object.keys(rowErrors).length === 0

  return {
    isValid,
    headerErrors,
    rowErrors
  }
}

import type { PurchaseOrderFormValues, PurchaseOrderDetailRow } from '../types/purchase-order.types'

export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
  detailErrors: Array<{ row_id: string; errors: Record<string, string> }>
}

export function validatePurchaseOrderForm(
  header: PurchaseOrderFormValues,
  rows: PurchaseOrderDetailRow[]
): FormValidationResult {
  const errors: Record<string, string> = {}
  const detailErrors: Array<{ row_id: string; errors: Record<string, string> }> = []

  // 1. Header validations
  if (!header.kode?.trim()) {
    errors.kode = 'Kode PO wajib diisi.'
  }

  if (!header.suplier_id) {
    errors.suplier_id = 'Supplier wajib dipilih.'
  }

  if (!header.tanggal?.trim()) {
    errors.tanggal = 'Tanggal PO wajib diisi.'
  }

  if (!header.status_transaksi_id) {
    errors.status_transaksi_id = 'Status transaksi wajib dipilih.'
  }

  // 2. Active detail rows validation
  const activeRows = rows.filter(r => r.bahan_id !== null && r.bahan_id !== undefined)

  if (activeRows.length === 0) {
    errors.details = 'Minimal harus menambahkan satu bahan pada detail Purchase Order.'
  } else {
    for (const row of activeRows) {
      const rowErrors: Record<string, string> = {}

      if (!row.bahan_id) {
        rowErrors.bahan_id = 'Bahan wajib dipilih.'
      }

      if (row.qty === null || row.qty === undefined || isNaN(row.qty) || row.qty <= 0) {
        rowErrors.qty = 'Qty harus berupa bilangan bulat positif (> 0).'
      } else if (!Number.isInteger(Number(row.qty))) {
        rowErrors.qty = 'Qty harus berupa bilangan bulat.'
      }

      if (row.harga === null || row.harga === undefined || isNaN(row.harga) || row.harga < 0) {
        rowErrors.harga = 'Harga tidak boleh negatif.'
      }

      if (row.diskon !== null && row.diskon !== undefined) {
        const diskonNum = Number(row.diskon)
        if (isNaN(diskonNum) || diskonNum < 0 || diskonNum > 100) {
          rowErrors.diskon = 'Diskon harus di antara 0% dan 100%.'
        }
      }

      if (row.keterangan && row.keterangan.length > 255) {
        rowErrors.keterangan = 'Keterangan maksimal 255 karakter.'
      }

      if (Object.keys(rowErrors).length > 0) {
        detailErrors.push({ row_id: row.row_id, errors: rowErrors })
      }
    }
  }

  const isValid = Object.keys(errors).length === 0 && detailErrors.length === 0

  return {
    isValid,
    errors,
    detailErrors
  }
}

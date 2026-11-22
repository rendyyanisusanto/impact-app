import type { SalesOrderFormValues, SalesOrderProductRow } from '../types/sales-order.types'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  itemErrors: Array<{ index: number; field: string; message: string }>
}

export function validateSalesOrderForm(
  _variant: SalesOrderVariantKey,
  form: SalesOrderFormValues,
  rows: SalesOrderProductRow[],
  options?: { isEdit?: boolean; isProductionCompleted?: boolean }
): ValidationResult {
  const errors: Record<string, string> = {}
  const itemErrors: Array<{ index: number; field: string; message: string }> = []

  // 1. Header Validation
  if (!form.kode || form.kode.trim() === '') {
    errors.kode = 'Nomor / Kode Sales Order wajib diisi.'
  }

  if (!form.customer_id || form.customer_id <= 0) {
    errors.customer_id = 'Pilih Customer pemesan terlebih dahulu.'
  }

  if (!form.tanggal || form.tanggal.trim() === '') {
    errors.tanggal = 'Tanggal transaksi penjualan wajib ditentukan.'
  }

  if (form.sales_id === null || form.sales_id === undefined || form.sales_id < 0) {
    errors.sales_id = 'Pilih Sales / Penanggung jawab pesanan.'
  }

  // 1.5. Status Dokumen Validation:
  // - Pada form Add baru (!isEdit): jika ada item produksi, status wajib Draft (0)
  // - Pada form Edit (isEdit): jika produksi belum selesai, status tidak boleh Selesai (1)
  // - Jika produksi sudah selesai (isProductionCompleted = true), status BOLEH Selesai (1)
  const hasProduction = rows.some(r => (r.produk_id || 0) > 0 && Number(r.status_produksi) === 1)
  if (hasProduction && form.status === 1) {
    if (!options?.isEdit) {
      errors.status =
        'Sales Order memiliki produk yang perlu diproduksi, sehingga status dokumen harus Draft dan tidak dapat diubah menjadi Selesai.'
    } else if (!options.isProductionCompleted) {
      errors.status =
        'Sales Order tidak dapat diubah menjadi Selesai (Succeeded) karena proses produksi belum selesai.'
    }
  }

  // 2. Filter valid rows
  const activeRows = rows.filter(r => (r.produk_id || 0) > 0 || Number(r.qty || 0) > 0)

  if (activeRows.length === 0) {
    errors.items = 'Minimal satu produk barang jadi harus dimasukkan ke dalam Sales Order.'
  }

  // 3. Duplicate and row validity check
  const seenProductIds = new Set<number>()

  rows.forEach((row, index) => {
    const hasProduct = (row.produk_id || 0) > 0
    const hasQty = Number(row.qty || 0) > 0

    // Only validate row if it's partially or fully filled
    if (hasProduct || hasQty) {
      if (!hasProduct) {
        itemErrors.push({
          index,
          field: 'produk_id',
          message: `Baris ${index + 1}: Produk belum dipilih.`
        })
      } else {
        if (seenProductIds.has(row.produk_id as number)) {
          itemErrors.push({
            index,
            field: 'produk_id',
            message: `Baris ${index + 1}: Produk '${row.nama_produk || 'Terpilih'}' telah dimasukkan pada baris lain (duplikasi).`
          })
        } else {
          seenProductIds.add(row.produk_id as number)
        }
      }

      if (!hasQty || Number(row.qty) <= 0) {
        itemErrors.push({
          index,
          field: 'qty',
          message: `Baris ${index + 1}: Kuantitas (Qty) harus berupa angka positif lebih dari 0.`
        })
      }

      if (Number(row.harga || 0) < 0) {
        itemErrors.push({
          index,
          field: 'harga',
          message: `Baris ${index + 1}: Harga satuan tidak boleh bernilai negatif.`
        })
      }

      const disc = Number(row.diskon || 0)
      if (disc < 0 || disc > 100) {
        itemErrors.push({
          index,
          field: 'diskon',
          message: `Baris ${index + 1}: Diskon harus berada di rentang 0% hingga 100%.`
        })
      }
    }
  })

  const isValid = Object.keys(errors).length === 0 && itemErrors.length === 0

  return {
    isValid,
    errors,
    itemErrors
  }
}

import type { ProductionCreatePayload, ProductionProductRow } from '../types/production.types'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  itemErrors: Array<{ index: number; field: string; message: string }>
}

/**
 * Validate production form values & product spreadsheet rows
 */
export function validateProductionForm(
  header: {
    kode?: string
    jenis_produksi: number | string
    tanggal: string
    status_produksi: number | string
    keterangan?: string | null
  },
  rows: ProductionProductRow[]
): ValidationResult {
  const errors: Record<string, string> = {}
  const itemErrors: Array<{ index: number; field: string; message: string }> = []

  // 1. Header validations
  if (!header.kode || header.kode.trim() === '') {
    errors.kode = 'Nomor produksi wajib diisi.'
  } else if (!/^PD\d{4}-\d+$/i.test(header.kode.trim())) {
    errors.kode = 'Format nomor produksi tidak valid (contoh: PD1126-0001).'
  }

  const jenisNum = Number(header.jenis_produksi)
  if (isNaN(jenisNum) || (jenisNum !== 0 && jenisNum !== 1)) {
    errors.jenis_produksi = 'Jenis produksi wajib dipilih.'
  }

  if (!header.tanggal || header.tanggal.trim() === '') {
    errors.tanggal = 'Tanggal produksi wajib diisi.'
  } else if (isNaN(Date.parse(header.tanggal))) {
    errors.tanggal = 'Format tanggal produksi tidak valid.'
  }

  const statusNum = Number(header.status_produksi)
  if (isNaN(statusNum) || (statusNum !== 0 && statusNum !== 1 && statusNum !== 2)) {
    errors.status_produksi = 'Status produksi wajib dipilih.'
  }

  if (header.keterangan && header.keterangan.length > 255) {
    errors.keterangan = 'Keterangan tidak boleh lebih dari 255 karakter.'
  }

  // 2. Spreadsheet items validation
  const filledRows = rows.filter(r => (r.produk_id || 0) > 0)

  if (filledRows.length === 0) {
    errors.items = 'Minimal satu produk furniture harus dimasukkan ke dalam daftar produksi.'
  }

  const seenProductIds = new Set<number>()

  rows.forEach((row, index) => {
    // Skip blank placeholder rows where no product is selected, no notes entered,
    // and qty is either empty, 0, or default untouched initial value (1).
    const isUntouchedBlank =
      (!row.produk_id || Number(row.produk_id) <= 0) &&
      (!row.nama_produk || row.nama_produk.trim() === '') &&
      (!row.keterangan || row.keterangan.trim() === '') &&
      (!row.qty || Number(row.qty) === 1)

    if (isUntouchedBlank) {
      return
    }

    if (!row.produk_id || Number(row.produk_id) <= 0) {
      itemErrors.push({
        index,
        field: 'nama_produk',
        message: `Baris #${index + 1}: Nama produk belum dipilih.`
      })
    } else {
      if (seenProductIds.has(row.produk_id)) {
        itemErrors.push({
          index,
          field: 'nama_produk',
          message: `Baris #${index + 1}: Produk '${row.nama_produk || row.produk_id}' sudah terdaftar pada baris lain.`
        })
      }
      seenProductIds.add(row.produk_id)
    }

    if (row.qty === undefined || row.qty === null || isNaN(row.qty) || row.qty <= 0) {
      itemErrors.push({
        index,
        field: 'qty',
        message: `Baris #${index + 1}: Qty produksi harus bernilai lebih dari 0.`
      })
    } else if (!Number.isInteger(Number(row.qty))) {
      itemErrors.push({
        index,
        field: 'qty',
        message: `Baris #${index + 1}: Qty produk jadi harus berupa bilangan bulat.`
      })
    }

    if (row.keterangan && row.keterangan.length > 255) {
      itemErrors.push({
        index,
        field: 'keterangan',
        message: `Baris #${index + 1}: Keterangan melebihi batas 255 karakter.`
      })
    }
  })

  return {
    isValid: Object.keys(errors).length === 0 && itemErrors.length === 0,
    errors,
    itemErrors
  }
}

/**
 * Validates payload at service boundary before database save
 */
export function validateProductionPayload(payload: ProductionCreatePayload): void {
  if (!payload.tanggal || payload.tanggal.trim() === '') {
    throw new Error('Tanggal transaksi produksi wajib diisi.')
  }

  const jenis = Number(payload.jenis_produksi)
  if (isNaN(jenis) || (jenis !== 0 && jenis !== 1)) {
    throw new Error('Jenis produksi harus bernilai 1 (Pesanan) atau 0 (Non Pesanan).')
  }

  if (!payload.items || payload.items.length === 0) {
    throw new Error('Transaksi produksi harus memiliki minimal 1 item produk.')
  }

  for (const [idx, item] of payload.items.entries()) {
    if (!item.produk_id || item.produk_id <= 0) {
      throw new Error(`Item ke-${idx + 1}: ID produk tidak valid.`)
    }
    if (!item.qty || item.qty <= 0) {
      throw new Error(`Item ke-${idx + 1}: Kuantitas produksi harus lebih besar dari 0.`)
    }
  }
}

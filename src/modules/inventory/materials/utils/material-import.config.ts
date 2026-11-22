import type { ImportTemplateDefinition } from '@/shared/types/crud.types'
import type { CreateMaterialDto } from '../types/material.types'
import { referenceService } from '@/shared/services/reference.service'
import {
  MOCK_GUDANG,
  MOCK_SATUAN_PAKAI,
  MOCK_SATUAN_BELI
} from '@/mocks/references/master-references.mock'

export const MATERIAL_IMPORT_TEMPLATE: ImportTemplateDefinition = {
  sheetName: 'Master Bahan',
  title: 'Master Data Bahan',
  columns: [
    {
      key: 'kode',
      label: 'Kode',
      required: false,
      type: 'string',
      maxLength: 50,
      example: 'MAT-010'
    },
    {
      key: 'nama',
      label: 'Nama Bahan',
      required: true,
      type: 'string',
      maxLength: 255,
      example: 'Paku Tembak F-30'
    },
    { key: 'min_qty', label: 'Minimum Qty', required: false, type: 'number', example: 20 },
    { key: 'qty', label: 'Qty Awal', required: false, type: 'number', example: 50 },
    {
      key: 'satuan_pakai',
      label: 'Satuan Pakai',
      required: false,
      type: 'string',
      example: 'Dus / Karton'
    },
    {
      key: 'satuan_beli',
      label: 'Satuan Beli',
      required: false,
      type: 'string',
      example: 'Dus / Karton'
    },
    {
      key: 'gudang',
      label: 'Gudang',
      required: false,
      type: 'string',
      example: 'Gudang Hardware & Fitting'
    },
    {
      key: 'harga_satuan',
      label: 'Harga Satuan (Rp)',
      required: false,
      type: 'number',
      example: 35000
    },
    {
      key: 'deskripsi',
      label: 'Deskripsi',
      required: false,
      type: 'string',
      example: 'Paku tembak angin lurus 30mm'
    },
    { key: 'status', label: 'Status', required: false, type: 'string', example: 'Aktif' }
  ],
  referenceSheets: [
    {
      name: 'Daftar Gudang',
      headers: ['ID Gudang', 'Nama Gudang'],
      rows: MOCK_GUDANG.map(g => [g.id, g.nama])
    },
    {
      name: 'Daftar Satuan',
      headers: ['Satuan Pakai (Penggunaan)', 'Satuan Beli (Pembelian)'],
      rows: Array.from(
        { length: Math.max(MOCK_SATUAN_PAKAI.length, MOCK_SATUAN_BELI.length) },
        (_, i) => [MOCK_SATUAN_PAKAI[i]?.nama || '', MOCK_SATUAN_BELI[i]?.nama || '']
      )
    }
  ]
}

export function materialRowMapper(
  rawRow: Record<string, unknown>,
  rowNumber: number
): { data?: CreateMaterialDto; error?: string } {
  const nama = String(rawRow['nama'] || '').trim()

  if (!nama) {
    return { error: `Baris ${rowNumber}: Nama bahan wajib diisi.` }
  }

  // Lookup gudang
  let gudang_id: number | null = null
  const gudangName = String(rawRow['gudang'] || '').trim()
  if (gudangName) {
    const g = referenceService.findGudangByName(gudangName)
    if (!g) {
      return { error: `Baris ${rowNumber}: Gudang '${gudangName}' tidak ditemukan dalam sistem.` }
    }
    gudang_id = g.id
  }

  // Lookup satuan pakai
  let satuan_pakai_id: number | null = null
  const spName = String(rawRow['satuan_pakai'] || '').trim()
  if (spName) {
    const sp = referenceService.findSatuanPakaiByName(spName)
    if (!sp) {
      return {
        error: `Baris ${rowNumber}: Satuan pakai '${spName}' tidak ditemukan dalam referensi.`
      }
    }
    satuan_pakai_id = sp.id
  }

  // Lookup satuan beli
  let satuan_beli_id: number | null = null
  const sbName = String(rawRow['satuan_beli'] || '').trim()
  if (sbName) {
    const sb = referenceService.findSatuanBeliByName(sbName)
    if (!sb) {
      return {
        error: `Baris ${rowNumber}: Satuan beli '${sbName}' tidak ditemukan dalam referensi.`
      }
    }
    satuan_beli_id = sb.id
  }

  const min_qty =
    rawRow['min_qty'] !== '' && rawRow['min_qty'] !== undefined ? Number(rawRow['min_qty']) : 0
  const qty = rawRow['qty'] !== '' && rawRow['qty'] !== undefined ? Number(rawRow['qty']) : 0
  const harga_satuan =
    rawRow['harga_satuan'] !== '' && rawRow['harga_satuan'] !== undefined
      ? Number(rawRow['harga_satuan'])
      : null

  const statusRaw = String(rawRow['status'] || 'Aktif')
    .trim()
    .toLowerCase()
  const status = statusRaw === 'nonaktif' || statusRaw === '0' || statusRaw === 'false' ? 0 : 1

  return {
    data: {
      kode: String(rawRow['kode'] || '').trim() || null,
      nama,
      min_qty: isNaN(min_qty) ? 0 : min_qty,
      qty: isNaN(qty) ? 0 : qty,
      satuan_pakai_id,
      satuan_beli_id,
      gudang_id,
      harga_satuan: harga_satuan !== null && !isNaN(harga_satuan) ? harga_satuan : null,
      deskripsi: String(rawRow['deskripsi'] || '').trim() || null,
      status
    }
  }
}

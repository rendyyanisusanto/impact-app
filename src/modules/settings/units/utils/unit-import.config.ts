import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type {
  CreateSatuanBeliDto,
  CreateSatuanPakaiDto,
  CreateSatuanBarangDto
} from '../types/unit.types'
import { INITIAL_MOCK_SATUAN_BELI } from '../services/unit.service'

export const SATUAN_BELI_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Satuan Beli',
  columns: [
    { key: 'kode', header: 'Kode Satuan', required: false, description: 'Kode (cth: M3, PLT)' },
    { key: 'nama', header: 'Nama Satuan *', required: true, description: 'Nama satuan pembelian' },
    { key: 'default', header: 'Default', required: false, description: 'Ya / Tidak (1 / 0)' },
    { key: 'status', header: 'Status', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    { kode: 'M3', nama: 'Kubik (m3)', default: 'Ya', status: 'Aktif' },
    { kode: 'PLT', nama: 'Palet Kayu', default: 'Tidak', status: 'Aktif' }
  ]
}

export const satuanBeliRowMapper: ImportRowMapper<CreateSatuanBeliDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateSatuanBeliDto; error?: string } {
    const nama = String(row['Nama Satuan *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Satuan Beli wajib diisi` }
    }
    const kode = String(row['Kode Satuan'] || row['kode'] || '').trim() || undefined
    const defStr = String(row['Default'] || row['default'] || '0')
      .trim()
      .toLowerCase()
    const def = defStr === 'ya' || defStr === '1' || defStr === 'true' ? 1 : 0
    const statusStr = String(row['Status'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' ? 0 : 1

    return { data: { kode, nama, default: def, status } }
  }
}

export const SATUAN_PAKAI_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Satuan Pakai',
  columns: [
    { key: 'kode', header: 'Kode Satuan', required: false, description: 'Kode (cth: BTG, LBR)' },
    {
      key: 'nama',
      header: 'Nama Satuan Pakai *',
      required: true,
      description: 'Nama satuan pemakaian produksi'
    },
    {
      key: 'satuan_beli',
      header: 'Satuan Beli Terkait',
      required: false,
      description: 'Nama satuan beli referensi'
    },
    {
      key: 'pembagi',
      header: 'Nilai Pembagi *',
      required: true,
      description: 'Faktor konversi pembagi (desimal > 0)'
    }
  ],
  sampleData: [
    { kode: 'BTG', nama: 'Batang', satuan_beli: 'Kubik (m3)', pembagi: 50 },
    { kode: 'LBR', nama: 'Lembar', satuan_beli: 'Palet', pembagi: 100 }
  ]
}

export const satuanPakaiRowMapper: ImportRowMapper<CreateSatuanPakaiDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateSatuanPakaiDto; error?: string } {
    const nama = String(row['Nama Satuan Pakai *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Satuan Pakai wajib diisi` }
    }

    const pembagiRaw = row['Nilai Pembagi *'] ?? row['pembagi'] ?? 1
    const pembagi = Number(pembagiRaw)
    if (isNaN(pembagi) || pembagi <= 0) {
      return { error: `Baris ${rowNumber}: Nilai Pembagi harus angka lebih besar dari 0` }
    }

    const kode = String(row['Kode Satuan'] || row['kode'] || '').trim() || undefined
    const satuanBeliStr = String(row['Satuan Beli Terkait'] || row['satuan_beli'] || '').trim()
    let satuanBeliId = 1
    if (satuanBeliStr) {
      const match = INITIAL_MOCK_SATUAN_BELI.find(
        b => b.nama?.toLowerCase() === satuanBeliStr.toLowerCase()
      )
      if (match) satuanBeliId = match.id
    }

    return { data: { kode, nama, satuan_beli_id: satuanBeliId, pembagi } }
  }
}

export const SATUAN_BARANG_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Satuan Produk',
  columns: [
    { key: 'kode', header: 'Kode Satuan', required: false, description: 'Kode (cth: PCS, SET)' },
    {
      key: 'nama',
      header: 'Nama Satuan Produk *',
      required: true,
      description: 'Nama satuan unit produk'
    },
    { key: 'status', header: 'Status', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    { kode: 'PCS', nama: 'Pcs', status: 'Aktif' },
    { kode: 'SET', nama: 'Set', status: 'Aktif' }
  ]
}

export const satuanBarangRowMapper: ImportRowMapper<CreateSatuanBarangDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateSatuanBarangDto; error?: string } {
    const nama = String(row['Nama Satuan Produk *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Satuan Produk wajib diisi` }
    }
    const kode = String(row['Kode Satuan'] || row['kode'] || '').trim() || undefined
    const statusStr = String(row['Status'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' ? 0 : 1

    return { data: { kode, nama, status } }
  }
}

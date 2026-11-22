import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateTaxDto } from '../types/tax.types'

export const TAX_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Master PPN',
  columns: [
    { key: 'kode', header: 'Kode PPN', required: false, description: 'Kode unik (cth: PPN-11)' },
    {
      key: 'nama',
      header: 'Tarif PPN (%) *',
      required: true,
      description: 'Persentase nilai integer (cth: 11, 10, 12)'
    },
    {
      key: 'is_active',
      header: 'Status Aktif Digunakan',
      required: false,
      description: 'Ya / Tidak (1 / 0)'
    },
    { key: 'status', header: 'Status Rekord', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    { kode: 'PPN-11', nama: 11, is_active: 'Ya', status: 'Aktif' },
    { kode: 'PPN-12', nama: 12, is_active: 'Tidak', status: 'Aktif' }
  ]
}

export const taxRowMapper: ImportRowMapper<CreateTaxDto> = {
  mapRow(row: Record<string, unknown>, rowNumber: number): { data?: CreateTaxDto; error?: string } {
    const namaRaw = row['Tarif PPN (%) *'] ?? row['nama'] ?? row['Tarif']
    if (namaRaw === undefined || namaRaw === null || String(namaRaw).trim() === '') {
      return { error: `Baris ${rowNumber}: Tarif PPN (%) wajib diisi` }
    }

    const nama = Math.round(Number(namaRaw))
    if (isNaN(nama) || nama < 0 || nama > 100) {
      return { error: `Baris ${rowNumber}: Tarif PPN harus integer antara 0 - 100%` }
    }

    const kode = String(row['Kode PPN'] || row['kode'] || '').trim() || undefined
    const activeStr = String(row['Status Aktif Digunakan'] || row['is_active'] || 'Tidak')
      .trim()
      .toLowerCase()
    const isActive = activeStr === 'ya' || activeStr === '1' || activeStr === 'true' ? 1 : 0
    const statusStr = String(row['Status Rekord'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' ? 0 : 1

    return {
      data: {
        kode,
        nama,
        is_active: isActive,
        status
      }
    }
  }
}

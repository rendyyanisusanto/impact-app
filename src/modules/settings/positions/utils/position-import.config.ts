import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreatePositionDto } from '../types/position.types'

export const POSITION_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Master Jabatan',
  columns: [
    {
      key: 'kode',
      header: 'Kode Jabatan',
      required: false,
      description: 'Kode jabatan (cth: JB-2404-1001)'
    },
    {
      key: 'nama',
      header: 'Nama Jabatan *',
      required: true,
      description: 'Nama posisi/jabatan karyawan'
    },
    {
      key: 'color',
      header: 'Warna Label',
      required: false,
      description: 'Kode warna hex (cth: #000000)'
    },
    { key: 'status', header: 'Status', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    { kode: 'JB-2404-1001', nama: 'Staff Gudang Logistik', color: '#10b981', status: 'Aktif' },
    { kode: 'JB-2404-1002', nama: 'Operator Mesin Kayu', color: '#f59e0b', status: 'Aktif' }
  ]
}

export const positionRowMapper: ImportRowMapper<CreatePositionDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreatePositionDto; error?: string } {
    const nama = String(row['Nama Jabatan *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Jabatan wajib diisi` }
    }

    const kode = String(row['Kode Jabatan'] || row['kode'] || '').trim() || undefined
    const color = String(row['Warna Label'] || row['color'] || '#000000').trim()
    const statusStr = String(row['Status'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' ? 0 : 1

    return {
      data: {
        kode,
        nama,
        color,
        status,
        is_deleted: 1
      }
    }
  }
}

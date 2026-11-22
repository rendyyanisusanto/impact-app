import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateEmployeeStatusDto } from '../types/employee-status.types'

export const EMPLOYEE_STATUS_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Status Karyawan',
  columns: [
    {
      key: 'kode',
      header: 'Kode Status',
      required: false,
      description: 'Kode status (cth: SK2974)'
    },
    {
      key: 'nama',
      header: 'Nama Status Karyawan *',
      required: true,
      description: 'Status hubungan kerja (Harian, Borongan, Tetap)'
    },
    {
      key: 'color',
      header: 'Warna Label',
      required: false,
      description: 'Kode warna hex (cth: #000000)'
    },
    { key: 'status', header: 'Status Rekord', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    { kode: 'SK2974', nama: 'Harian Lepas', color: '#000000', status: 'Aktif' },
    { kode: 'SK690', nama: 'Borongan Proyek', color: '#03b300', status: 'Aktif' }
  ]
}

export const employeeStatusRowMapper: ImportRowMapper<CreateEmployeeStatusDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateEmployeeStatusDto; error?: string } {
    const nama = String(row['Nama Status Karyawan *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Status Karyawan wajib diisi` }
    }

    const kode = String(row['Kode Status'] || row['kode'] || '').trim() || undefined
    const color = String(row['Warna Label'] || row['color'] || '#000000').trim()
    const statusStr = String(row['Status Rekord'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' ? 0 : 1

    return {
      data: {
        kode,
        nama,
        color,
        status
      }
    }
  }
}

import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateMaterialCategoryDto } from '../types/material-category.types'

export const MATERIAL_CATEGORY_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Kategori Bahan',
  columns: [
    {
      key: 'kode',
      header: 'Kode Kategori',
      required: false,
      description: 'Kode kategori (cth: B1)'
    },
    { key: 'nama', header: 'Nama Kategori *', required: true, description: 'Nama kategori bahan' },
    {
      key: 'color',
      header: 'Warna Label',
      required: false,
      description: 'Kode warna hex (cth: #2980b9)'
    },
    { key: 'status', header: 'Status', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    {
      kode: 'B1',
      nama: 'Bahan Utama Kayu',
      color: '#2980b9',
      status: 'Aktif'
    },
    {
      kode: 'B2',
      nama: 'Bahan Pendukung Finishing',
      color: '#c0392b',
      status: 'Aktif'
    }
  ]
}

export const materialCategoryRowMapper: ImportRowMapper<CreateMaterialCategoryDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateMaterialCategoryDto; error?: string } {
    const nama = String(row['Nama Kategori *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Kategori wajib diisi` }
    }

    const kode =
      String(row['Kode Kategori'] || row['kode'] || row['Kode'] || '').trim() || undefined
    const color = String(row['Warna Label'] || row['color'] || '#2980b9').trim()

    const statusStr = String(row['Status'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' || statusStr === 'inactive' ? 0 : 1

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

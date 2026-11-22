import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateProductCategoryDto } from '../types/product-category.types'

export const PRODUCT_CATEGORY_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Kategori Produk',
  columns: [
    {
      key: 'kode',
      header: 'Kode Kategori',
      required: false,
      description: 'Kode kategori produk (cth: SB-1)'
    },
    {
      key: 'nama',
      header: 'Nama Kategori *',
      required: true,
      description: 'Nama kategori produk jadi'
    },
    {
      key: 'color',
      header: 'Warna Label',
      required: false,
      description: 'Kode warna hex (cth: #811818)'
    },
    { key: 'status', header: 'Status', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    {
      kode: 'SB-1',
      nama: 'Kursi',
      color: '#811818',
      status: 'Aktif'
    },
    {
      kode: 'SB-2',
      nama: 'Meja',
      color: '#c0392b',
      status: 'Aktif'
    }
  ]
}

export const productCategoryRowMapper: ImportRowMapper<CreateProductCategoryDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateProductCategoryDto; error?: string } {
    const nama = String(row['Nama Kategori *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Kategori wajib diisi` }
    }

    const kode =
      String(row['Kode Kategori'] || row['kode'] || row['Kode'] || '').trim() || undefined
    const color = String(row['Warna Label'] || row['color'] || '#8e44ad').trim()

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

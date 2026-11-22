import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateWarehouseDto } from '../types/warehouse.types'

export const WAREHOUSE_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Master Gudang',
  columns: [
    {
      key: 'kode',
      header: 'Kode Gudang',
      required: false,
      description: 'Kode unik gudang (cth: GD-7745)'
    },
    {
      key: 'nama',
      header: 'Nama Gudang *',
      required: true,
      description: 'Nama gudang penyimpanan'
    },
    {
      key: 'color',
      header: 'Warna Label',
      required: false,
      description: 'Kode warna hex (cth: #000000)'
    },
    {
      key: 'alamat',
      header: 'Alamat Gudang',
      required: false,
      description: 'Alamat atau lokasi fasilitas'
    },
    { key: 'status', header: 'Status', required: false, description: 'Aktif / Nonaktif' }
  ],
  sampleData: [
    {
      kode: 'GD-7745',
      nama: 'Gudang Utama Pogot',
      color: '#000000',
      alamat: 'Jl. Pogot No. 12, Surabaya',
      status: 'Aktif'
    },
    {
      kode: 'GD-7755',
      nama: 'Gudang Bambe Gresik',
      color: '#16a34a',
      alamat: 'Bambe, Driyorejo Gresik',
      status: 'Aktif'
    }
  ]
}

export const warehouseRowMapper: ImportRowMapper<CreateWarehouseDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateWarehouseDto; error?: string } {
    const nama = String(row['Nama Gudang *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Gudang wajib diisi` }
    }

    const kode = String(row['Kode Gudang'] || row['kode'] || row['Kode'] || '').trim() || undefined
    const color = String(row['Warna Label'] || row['color'] || '#000000').trim()
    const alamat = String(row['Alamat Gudang'] || row['alamat'] || '').trim() || null

    const statusStr = String(row['Status'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' || statusStr === 'inactive' ? 0 : 1

    return {
      data: {
        kode,
        nama,
        color,
        alamat,
        status
      }
    }
  }
}

import type { ExcelImportTemplate, ImportRowMapper } from '@/shared/types/excel-import.types'
import type { CreateProductDto } from '../types/product.types'
import {
  MOCK_PRODUCT_CATEGORIES,
  MOCK_PRODUCT_UNITS,
  MOCK_PRODUCT_WAREHOUSES
} from '../services/product.service'

export const PRODUCT_IMPORT_TEMPLATE: ExcelImportTemplate = {
  sheetName: 'Master Produk',
  columns: [
    {
      key: 'kode',
      header: 'Kode Produk',
      required: false,
      description: 'Kode unik (opsional, auto-generate jika kosong)'
    },
    {
      key: 'nama',
      header: 'Nama Produk *',
      required: true,
      description: 'Nama lengkap barang jadi/produk'
    },
    {
      key: 'kategori',
      header: 'Kategori',
      required: false,
      description: 'Nama kategori (Lainnya, Meja, Kursi)'
    },
    { key: 'gudang', header: 'Gudang', required: false, description: 'Nama gudang penyimpanan' },
    {
      key: 'satuan',
      header: 'Satuan',
      required: false,
      description: 'Satuan barang (Pcs, Set, Unit)'
    },
    {
      key: 'harga',
      header: 'Harga (Rp)',
      required: false,
      description: 'Harga satuan produk dlm rupiah'
    },
    { key: 'qty', header: 'Stok Awal (QTY)', required: false, description: 'Jumlah stok saat ini' },
    { key: 'min_qty', header: 'Min QTY', required: false, description: 'Batas minimal stok' },
    {
      key: 'keterangan',
      header: 'Keterangan',
      required: false,
      description: 'Catatan spesifikasi produk'
    },
    {
      key: 'status',
      header: 'Status',
      required: false,
      description: 'Aktif / Nonaktif (default: Aktif)'
    }
  ],
  sampleData: [
    {
      kode: 'PRD-001',
      nama: 'Kursi Kantor Mesh Ergonomis',
      kategori: 'Kursi',
      gudang: 'Gudang Utama',
      satuan: 'Pcs',
      harga: 450000,
      qty: 20,
      min_qty: 5,
      keterangan: 'Roda nylon tilt lock',
      status: 'Aktif'
    },
    {
      kode: 'PRD-002',
      nama: 'Meja Rapat HPL Modesty 180cm',
      kategori: 'Meja',
      gudang: 'Gudang Utama',
      satuan: 'Set',
      harga: 1750000,
      qty: 10,
      min_qty: 3,
      keterangan: 'Kaki lipat serbaguna',
      status: 'Aktif'
    }
  ]
}

export const productRowMapper: ImportRowMapper<CreateProductDto> = {
  mapRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): { data?: CreateProductDto; error?: string } {
    const nama = String(row['Nama Produk *'] || row['nama'] || row['Nama'] || '').trim()
    if (!nama) {
      return { error: `Baris ${rowNumber}: Nama Produk wajib diisi` }
    }

    const kode = String(row['Kode Produk'] || row['kode'] || row['Kode'] || '').trim() || undefined
    const kategoriStr = String(row['Kategori'] || row['kategori'] || '').trim()
    const gudangStr = String(row['Gudang'] || row['gudang'] || '').trim()
    const satuanStr = String(row['Satuan'] || row['satuan'] || '').trim()

    let kategoriId = 1
    if (kategoriStr) {
      const match = MOCK_PRODUCT_CATEGORIES.find(
        c => c.nama.toLowerCase() === kategoriStr.toLowerCase()
      )
      if (match) kategoriId = match.id
    }

    let gudangId = 1000
    if (gudangStr) {
      const match = MOCK_PRODUCT_WAREHOUSES.find(
        g => g.nama.toLowerCase() === gudangStr.toLowerCase()
      )
      if (match) gudangId = match.id
    }

    let satuanId = 1
    if (satuanStr) {
      const match = MOCK_PRODUCT_UNITS.find(u => u.nama.toLowerCase() === satuanStr.toLowerCase())
      if (match) satuanId = match.id
    }

    const hargaRaw = row['Harga (Rp)'] ?? row['harga'] ?? 0
    const harga = isNaN(Number(hargaRaw)) ? 0 : Math.round(Number(hargaRaw))

    const qtyRaw = row['Stok Awal (QTY)'] ?? row['qty'] ?? 0
    const qty = isNaN(Number(qtyRaw)) ? 0 : Math.round(Number(qtyRaw))

    const minQtyRaw = row['Min QTY'] ?? row['min_qty'] ?? 0
    const min_qty = isNaN(Number(minQtyRaw)) ? 0 : Math.round(Number(minQtyRaw))

    const keterangan = String(row['Keterangan'] || row['keterangan'] || '').trim() || null

    const statusStr = String(row['Status'] || row['status'] || 'Aktif')
      .trim()
      .toLowerCase()
    const status = statusStr === 'nonaktif' || statusStr === '0' || statusStr === 'inactive' ? 0 : 1

    return {
      data: {
        kode,
        nama,
        kategori_barang_id: kategoriId,
        gudang_id: gudangId,
        satuan_barang_id: satuanId,
        harga,
        qty,
        min_qty,
        keterangan,
        status
      }
    }
  }
}

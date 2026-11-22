import type { Gudang } from '@/modules/settings/warehouses/types/warehouse.types'
import type { KategoriBahan } from '@/modules/settings/material-categories/types/material-category.types'
import type { KategoriBarang } from '@/modules/settings/product-categories/types/product-category.types'
import type {
  SatuanBeli,
  SatuanPakai,
  SatuanBarang
} from '@/modules/settings/units/types/unit.types'

export const INITIAL_MOCK_WAREHOUSES: Gudang[] = [
  {
    id: 1000,
    kode: 'GD-7745',
    nama: 'Gudang Utama',
    status: 1,
    color: '#000000',
    alamat: 'Pogot, Surabaya',
    created_at: '2024-01-01 00:00:00',
    created_by: 1,
    updated_at: '2024-07-25 03:53:49',
    updated_by: 1
  },
  {
    id: 1001,
    kode: 'GD-7755',
    nama: 'Gudang Bambe',
    status: 0,
    color: '#64748b',
    alamat: 'Bambe, Driyorejo Gresik',
    created_at: '2024-01-01 00:00:00',
    created_by: 1,
    updated_at: '2025-05-23 03:48:23',
    updated_by: 1
  },
  {
    id: 1002,
    kode: '1',
    nama: 'Gudang Impact - 1',
    status: 1,
    color: '#000000',
    alamat: 'Surabaya',
    created_at: '2026-11-09 19:16:54',
    created_by: 8,
    updated_at: '2026-11-09 19:17:30',
    updated_by: 8
  },
  {
    id: 1003,
    kode: '2',
    nama: 'Gudang Impact - 2',
    status: 1,
    color: '#ff0000',
    alamat: 'Surabaya',
    created_at: '2026-11-09 19:17:14',
    created_by: 8,
    updated_at: null,
    updated_by: null
  }
]

export const INITIAL_MOCK_MATERIAL_CATEGORIES: KategoriBahan[] = [
  {
    id: 1,
    kode: 'B1',
    nama: 'Bahan Utama',
    color: '#2980b9',
    status: 1,
    created_at: '2023-02-06 13:01:15',
    created_by: 1
  },
  {
    id: 2,
    kode: 'B2',
    nama: 'Bahan Pendukung',
    color: '#c0392b',
    status: 1,
    created_at: '2023-02-06 13:01:15',
    created_by: 1
  },
  {
    id: 3,
    kode: 'Bahan8232236',
    nama: 'Bahan Cadangan',
    color: '#000000',
    status: 1,
    created_at: '2023-02-06 13:06:37',
    created_by: 1,
    updated_at: '2023-02-06 13:07:36',
    updated_by: 1
  }
]

export const INITIAL_MOCK_PRODUCT_CATEGORIES: KategoriBarang[] = [
  {
    id: 1,
    kode: 'SB-3',
    nama: 'Lainnya',
    color: '#8e44ad',
    status: 1,
    created_at: '2023-02-06 12:49:29',
    created_by: 1,
    updated_at: '2025-06-25 09:06:53',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'SB-2',
    nama: 'Meja',
    color: '#c0392b',
    status: 1,
    created_at: '2023-02-06 12:49:29',
    created_by: 1,
    updated_at: '2025-06-25 09:07:03',
    updated_by: 1
  },
  {
    id: 3,
    kode: 'SB-1',
    nama: 'Kursi',
    color: '#811818',
    status: 1,
    created_at: '2023-02-06 12:49:29',
    created_by: 1,
    updated_at: '2025-06-25 09:06:37',
    updated_by: 1
  },
  {
    id: 4,
    kode: 'GD/7263129',
    nama: 'Kursi Coba',
    color: '#d31212',
    status: 0,
    created_at: '2023-02-06 12:49:29',
    created_by: 1,
    updated_at: '2025-06-25 09:06:21',
    updated_by: 1
  }
]

export const INITIAL_MOCK_SATUAN_BELI: SatuanBeli[] = [
  { id: 1, kode: 'M3', nama: 'Kubik (m3)', status: 1, default: 1 },
  { id: 2, kode: 'PLT', nama: 'Palet', status: 1, default: 0 },
  { id: 3, kode: 'PAIL', nama: 'Pail (20L)', status: 1, default: 0 },
  { id: 4, kode: 'DRUM', nama: 'Drum (200L)', status: 1, default: 0 },
  { id: 5, kode: 'DUS', nama: 'Dus / Karton', status: 1, default: 0 },
  { id: 6, kode: 'ROLL', nama: 'Roll', status: 1, default: 0 }
]

export const INITIAL_MOCK_SATUAN_PAKAI: SatuanPakai[] = [
  { id: 1, kode: 'BTG', nama: 'Batang', satuan_beli_id: 1, pembagi: 50.0 },
  { id: 2, kode: 'LBR', nama: 'Lembar', satuan_beli_id: 2, pembagi: 100.0 },
  { id: 3, kode: 'KLG', nama: 'Kaleng', satuan_beli_id: 3, pembagi: 20.0 },
  { id: 4, kode: 'PCS', nama: 'Pcs', satuan_beli_id: 5, pembagi: 1000.0 },
  { id: 5, kode: 'MTR', nama: 'Meter', satuan_beli_id: 6, pembagi: 50.5 }
]

export const INITIAL_MOCK_SATUAN_BARANG: SatuanBarang[] = [
  { id: 1, kode: 'PCS', nama: 'Pcs', status: 1 },
  { id: 2, kode: 'SET', nama: 'Set', status: 1 },
  { id: 3, kode: 'UNIT', nama: 'Unit', status: 1 },
  { id: 4, kode: 'BOX', nama: 'Box', status: 1 },
  { id: 5, kode: 'PACK', nama: 'Pack', status: 1 }
]

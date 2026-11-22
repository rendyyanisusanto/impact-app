import type { StockAdjustment, StockAdjustmentDetail } from '../types/stock-adjustment.types'

export const INITIAL_MOCK_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 1,
    kode: 'PS/2026/10/1',
    tanggal: '2026-10-28',
    keterangan: 'Stock opname rutin akhir bulan Oktober',
    status: 1, // Selesai / Posted
    status_aktif: 1,
    created_at: '2026-10-28 10:00:00',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    uuid: 'adj-uuid-001'
  },
  {
    id: 2,
    kode: 'PS/2026/10/2',
    tanggal: '2026-10-30',
    keterangan: 'Penyesuaian stok kaleng cat finishing',
    status: 1, // Selesai / Posted
    status_aktif: 1,
    created_at: '2026-10-30 16:30:00',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    uuid: 'adj-uuid-002'
  },
  {
    id: 3,
    kode: 'PS/2026/11/1',
    tanggal: '2026-11-01',
    keterangan: 'Stock opname berkala gudang utama',
    status: 0, // Draft
    status_aktif: 1,
    created_at: '2026-11-01 08:30:00',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    uuid: 'adj-uuid-003'
  }
]

export const INITIAL_MOCK_STOCK_ADJUSTMENT_DETAILS: StockAdjustmentDetail[] = [
  {
    id: 1,
    penyesuaian_stok_id: 1,
    bahan_id: 1, // Kayu Jati Solid Grade A
    stok_awal: 10,
    stok_akhir: 12,
    keterangan: 'Ditemukan 2 batang di area oven'
  },
  {
    id: 2,
    penyesuaian_stok_id: 1,
    bahan_id: 2, // Busa Density 32
    stok_awal: 10,
    stok_akhir: 8,
    keterangan: '2 lembar rusak saat loading'
  },
  {
    id: 3,
    penyesuaian_stok_id: 2,
    bahan_id: 3, // Cat Finishing Melamine Gloss
    stok_awal: 6,
    stok_akhir: 5,
    keterangan: '1 kaleng rusak / bocor'
  },
  {
    id: 4,
    penyesuaian_stok_id: 3,
    bahan_id: 1, // Kayu Jati Solid Grade A
    stok_awal: 12,
    stok_akhir: 12,
    keterangan: 'Stok fisik sesuai sistem'
  },
  {
    id: 5,
    penyesuaian_stok_id: 3,
    bahan_id: 3, // Cat Finishing Melamine Gloss
    stok_awal: 5,
    stok_akhir: 6,
    keterangan: 'Kelebihan retur sample'
  }
]

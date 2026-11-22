import type { MaterialMutation, MaterialMutationDetail } from '../types/material-mutation.types'

export const INITIAL_MOCK_MATERIAL_MUTATIONS: MaterialMutation[] = [
  {
    id: 1,
    kode: 'MB/202610-0001',
    tanggal: '2026-10-20',
    keterangan: 'Mutasi bahan pembuatan Meja Kantor Executive',
    status: 1, // Selesai / Posted
    created_at: '2026-10-20 09:30:00',
    created_by: 1,
    status_aktif: 1,
    uuid: 'mut-uuid-001'
  },
  {
    id: 2,
    kode: 'MB/202610-0002',
    tanggal: '2026-10-25',
    keterangan: 'Mutasi bahan produksi Kursi Ergonomis',
    status: 1, // Selesai / Posted
    created_at: '2026-10-25 14:15:00',
    created_by: 1,
    status_aktif: 1,
    uuid: 'mut-uuid-002'
  },
  {
    id: 3,
    kode: 'MB/202611-0001',
    tanggal: '2026-11-01',
    keterangan: 'Pengeluaran bahan uji coba finishing baru',
    status: 0, // Draft
    created_at: '2026-11-01 08:45:00',
    created_by: 1,
    status_aktif: 1,
    uuid: 'mut-uuid-003'
  }
]

export const INITIAL_MOCK_MATERIAL_MUTATION_DETAILS: MaterialMutationDetail[] = [
  {
    id: 1,
    mutasi_bahan_id: 1,
    bahan_id: 1, // Kayu Jati Solid Grade A
    qty: 2,
    satuan_beli_id: 1,
    keterangan: 'Bpk. Hendra (Produksi)'
  },
  {
    id: 2,
    mutasi_bahan_id: 1,
    bahan_id: 3, // Cat Finishing Melamine Gloss
    qty: 1,
    satuan_beli_id: 3,
    keterangan: 'Finishing Div.'
  },
  {
    id: 3,
    mutasi_bahan_id: 2,
    bahan_id: 2, // Busa Density 32
    qty: 4,
    satuan_beli_id: 2,
    keterangan: 'Upholstery Dept'
  },
  {
    id: 4,
    mutasi_bahan_id: 3,
    bahan_id: 3, // Cat Finishing Melamine Gloss
    qty: 2,
    satuan_beli_id: 3,
    keterangan: 'R&D Sample Test'
  }
]

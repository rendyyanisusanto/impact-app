/**
 * Material Mutation Types
 * Aligned with MariaDB `mutasi_bahan`, `detail_mutasi_bahan`, and `v_detail_mutasi_bahan`
 */

export interface MaterialMutation {
  id: number
  kode: string
  tanggal: string // YYYY-MM-DD
  keterangan: string | null
  status: number // 0 = Draft, 1 = Selesai / Terverifikasi
  created_at: string
  created_by: number | null
  status_aktif: number // 1 = Active, 0 = Inactive / Cancelled
  uuid: string | null
}

export interface MaterialMutationDetail {
  id: number
  mutasi_bahan_id: number
  bahan_id: number
  qty: number
  satuan_beli_id: number | null
  keterangan: string | null
}

export interface MaterialMutationViewDetail {
  id: number
  mutasi_bahan_id: number
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  gudang_id: number | null
  nama_gudang: string
  satuan_id: number | null
  nama_satuan: string
  qty: number
  harga_satuan: number
  subtotal: number
  keterangan_detail: string
}

export interface MaterialMutationDetailRow {
  id: string // Client row unique ID, e.g. 'row-1'
  bahan_id: number | null
  kode_bahan: string
  nama_bahan: string
  gudang_id: number | null
  nama_gudang: string
  satuan_id: number | null
  nama_satuan: string
  stok_tersedia: number
  qty: number | null
  harga_satuan: number
  subtotal: number
  keterangan: string
}

export interface MaterialMutationListItem {
  id: number
  kode: string
  tanggal: string
  keterangan: string
  status: number
  status_aktif: number
  total_items: number
  total_qty: number
  total_nilai: number
  created_at: string
  created_by: number | null
  created_by_name?: string
}

export interface MaterialMutationDetailWithItems extends MaterialMutation {
  items: MaterialMutationViewDetail[]
  total_items: number
  total_qty: number
  total_nilai: number
  created_by_name?: string
}

export interface MaterialMutationFormValues {
  kode: string
  tanggal: string
  keterangan: string
  status: number
  items: MaterialMutationDetailRow[]
}

export interface MaterialMutationCreatePayload {
  kode?: string
  tanggal: string
  keterangan?: string
  status?: number
  items: Array<{
    bahan_id: number
    qty: number
    satuan_beli_id?: number | null
    keterangan?: string
  }>
}

export interface MaterialMutationUpdatePayload {
  kode?: string
  tanggal?: string
  keterangan?: string
  status?: number
  items?: Array<{
    bahan_id: number
    qty: number
    satuan_beli_id?: number | null
    keterangan?: string
  }>
}

export interface MaterialMutationFilterParams {
  search?: string
  status?: number | 'all'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface MaterialMutationKpiSummary {
  total_mutasi: number
  total_posted: number
  total_draft: number
  total_qty_dimutasi: number
  total_nilai_dimutasi: number
  mutasi_per_satuan: Array<{
    satuan: string
    total_qty: number
  }>
}

export interface SelectableMaterial {
  id: number
  kode: string
  nama: string
  qty: number
  gudang_id: number | null
  gudang_nama: string
  satuan_id?: number | null
  satuan_pakai_id?: number | null
  satuan_nama: string
  harga_satuan: number
}

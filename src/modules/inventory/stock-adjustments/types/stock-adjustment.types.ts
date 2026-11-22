/**
 * Stock Adjustment Types
 * Aligned with MariaDB `penyesuaian_stok` and `detail_penyesuaian_stok`
 */

export interface StockAdjustment {
  id: number
  kode: string
  tanggal: string // YYYY-MM-DD
  keterangan: string | null
  status: number // 0 = Draft, 1 = Selesai / Posted
  status_aktif: number // 1 = Active, 0 = Inactive / Cancelled
  created_at: string
  created_by: number | null
  updated_at: string | null
  updated_by: number | null
  uuid: string | null
}

export interface StockAdjustmentDetail {
  id: number
  penyesuaian_stok_id: number
  bahan_id: number
  stok_awal: number // Stok Sistem saat penyesuaian
  stok_akhir: number // Stok Fisik hasil opname
  keterangan: string | null
}

export interface StockAdjustmentViewDetail {
  id: number
  penyesuaian_stok_id: number
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  gudang_id: number | null
  nama_gudang: string
  satuan_id: number | null
  nama_satuan: string
  stok_awal: number
  stok_akhir: number
  selisih: number // stok_akhir - stok_awal
  harga_satuan: number
  nilai_selisih: number
  keterangan_detail: string
}

export interface StockAdjustmentDetailRow {
  id: string // Client row id, e.g. 'row-1'
  bahan_id: number | null
  kode_bahan: string
  nama_bahan: string
  gudang_id: number | null
  nama_gudang: string
  satuan_id: number | null
  nama_satuan: string
  stok_awal: number // Stok Sistem (read-only)
  stok_akhir: number | null // Stok Fisik (editable)
  selisih: number // stok_akhir - stok_awal
  harga_satuan: number
  nilai_selisih: number
  keterangan: string
}

export interface StockAdjustmentListItem {
  id: number
  kode: string
  tanggal: string
  keterangan: string
  status: number
  status_aktif: number
  total_items: number
  total_positif: number
  total_negatif: number
  net_selisih_qty: number
  total_nilai_selisih: number
  created_at: string
  created_by: number | null
  created_by_name?: string
}

export interface StockAdjustmentDetailWithItems extends StockAdjustment {
  items: StockAdjustmentViewDetail[]
  total_items: number
  total_positif: number
  total_negatif: number
  total_tanpa_selisih: number
  net_selisih_qty: number
  total_nilai_selisih: number
  created_by_name?: string
}

export interface StockAdjustmentCreatePayload {
  kode?: string
  tanggal: string
  keterangan?: string
  status?: number
  items: Array<{
    bahan_id: number
    stok_awal: number
    stok_akhir: number
    keterangan?: string
  }>
}

export interface StockAdjustmentUpdatePayload {
  kode?: string
  tanggal?: string
  keterangan?: string
  status?: number
  items?: Array<{
    bahan_id: number
    stok_awal: number
    stok_akhir: number
    keterangan?: string
  }>
}

export interface StockAdjustmentFilterParams {
  search?: string
  status?: number | 'all' | string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StockAdjustmentKpiSummary {
  total_penyesuaian: number
  total_posted: number
  total_draft: number
  net_selisih_qty: number
  total_item_bertambah: number
  total_item_berkurang: number
  total_item_cocok: number
  total_nilai_selisih: number
  selisih_per_satuan: Array<{
    satuan: string
    net_selisih: number
  }>
}

export interface SelectableMaterial {
  id: number
  kode: string
  nama: string
  qty: number
  gudang_id: number | null
  gudang_nama: string
  satuan_pakai_id: number | null
  satuan_nama: string
  harga_satuan: number
  status?: number
}

export interface StockConflictItem {
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  stok_saat_buka: number
  stok_terkini: number
  satuan: string
}

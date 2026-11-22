/**
 * Bill of Materials (BoM) / Template Produk Types
 * Aligned with MariaDB `template_produk` and `detail_template_produk`
 */

/**
 * Raw Database Model: `template_produk`
 */
export interface TemplateProduk {
  id: number
  kode: string | null
  nama: string | null
  produk_id: number | null
  status_aktif: number | null // 1 = Aktif, 0 = Nonaktif / Dihapus
}

/**
 * Raw Database Model: `detail_template_produk`
 */
export interface DetailTemplateProduk {
  id: number
  template_produk_id: number | null
  produk_id: number | null
  bahan_id: number | null
  satuan_id: number | null // satuan_pakai_id
  qty: number | null // kuantitas per 1 unit produk
}

/**
 * Enriched View Model for Detail Row
 */
export interface BomTemplateViewDetail {
  id: number
  template_produk_id: number
  produk_id: number
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  satuan_id: number
  nama_satuan: string
  qty: number
  harga_satuan: number
  estimasi_biaya: number
  stok_tersedia: number
  keterangan?: string
}

/**
 * Spreadsheet Client Row Model
 */
export interface BomMaterialRow {
  id: string // Client row id, e.g. 'row-1'
  bahan_id: number | null
  kode_bahan: string
  nama_bahan: string
  satuan_id: number | null
  nama_satuan: string
  stok_tersedia: number
  qty: number | null // Qty kebutuhan per 1 unit produk
  harga_satuan: number
  subtotal_biaya: number
  keterangan: string
}

/**
 * List Item Model for AppDataTable
 */
export interface BomListItem {
  id: number
  kode: string
  nama: string
  produk_id: number
  kode_produk: string
  nama_produk: string
  kategori_produk?: string
  total_items: number // Jumlah jenis bahan
  total_estimasi_biaya: number // Estimasi biaya bahan per 1 unit produk
  status_aktif: number
  updated_at?: string
}

/**
 * Full Document Model for Detail View
 */
export interface BomTemplateWithItems extends TemplateProduk {
  kode: string
  nama: string
  produk_id: number
  kode_produk: string
  nama_produk: string
  kategori_produk?: string
  satuan_produk?: string
  items: BomTemplateViewDetail[]
  total_items: number
  total_estimasi_biaya: number
  created_at?: string
  updated_at?: string
}

/**
 * Create Payload for Bom Service
 */
export interface BomCreatePayload {
  kode?: string
  nama: string
  produk_id: number
  status_aktif?: number
  items: Array<{
    bahan_id: number
    satuan_id: number
    qty: number
    keterangan?: string
  }>
}

/**
 * Update Payload for Bom Service
 */
export interface BomUpdatePayload {
  kode?: string
  nama?: string
  produk_id?: number
  status_aktif?: number
  items?: Array<{
    bahan_id: number
    satuan_id: number
    qty: number
    keterangan?: string
  }>
}

/**
 * Filter Parameters for List Query
 */
export interface BomFilterParams {
  search?: string
  produk_id?: number | 'all'
  status_aktif?: number | 'all'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Material Requirement Calculation Item (Simulation Preview)
 */
export interface MaterialRequirementItem {
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  satuan_id: number
  nama_satuan: string
  qty_per_unit: number
  target_produksi: number
  total_kebutuhan: number
  stok_tersedia: number
  selisih_stok: number // stok_tersedia - total_kebutuhan
  status_ketersediaan: 'CUKUP' | 'KURANG'
  kekurangan_qty: number
  harga_satuan: number
  estimasi_total_biaya: number
  konversi_info?: string
}

/**
 * Overall Material Requirement Simulation Result
 */
export interface MaterialRequirementSimulation {
  produk_id: number
  nama_produk: string
  template_id: number
  kode_template: string
  target_produksi: number
  total_jenis_bahan: number
  total_kebutuhan_qty: number
  total_estimasi_biaya: number
  jumlah_bahan_kurang: number
  jumlah_bahan_cukup: number
  status_kelayakan: 'SIAP_PRODUKSI' | 'BAHAN_KURANG'
  items: MaterialRequirementItem[]
}

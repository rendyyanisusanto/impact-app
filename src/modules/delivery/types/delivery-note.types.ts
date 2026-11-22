import type { SalesOrderVariantKey } from '@/modules/sales/config/sales-order-variants'

/* =========================================================================
   1. CONSTANTS & ENUMS (MARIADB MAPPING)
   ========================================================================= */

export const DELIVERY_DOCUMENT_STATUS = {
  DRAFT: 0,
  SUCCEEDED: 1,
  BATAL: 2
} as const

export type DeliveryDocumentStatusCode =
  (typeof DELIVERY_DOCUMENT_STATUS)[keyof typeof DELIVERY_DOCUMENT_STATUS]

export const DELIVERY_SHIPPING_STATUS = {
  BELUM_DIKIRIM: 0,
  TERKIRIM: 1,
  AMBIL_SENDIRI: 2
} as const

export type DeliveryShippingStatusCode =
  (typeof DELIVERY_SHIPPING_STATUS)[keyof typeof DELIVERY_SHIPPING_STATUS]

export const DELIVERY_PICKUP_STATUS = {
  DIKIRIM: 0,
  AMBIL_SENDIRI: 1
} as const

export type DeliveryPickupStatusCode =
  (typeof DELIVERY_PICKUP_STATUS)[keyof typeof DELIVERY_PICKUP_STATUS]

/* =========================================================================
   2. ENTITY INTERFACES (MATCHING MARIADB SCHEMA)
   ========================================================================= */

export interface SuratJalan {
  id: number
  so_id: number
  kode: string
  tanggal: string
  keterangan: string | null
  status: number // 0 = Draft, 1 = Succeeded, 2 = Batal
  status_kirim: number // 0 = Belum Dikirim, 1 = Terkirim, 2 = Ambil Sendiri
  created_at?: string
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
  nama_pengirim: string | null
  penerima: string | null
  foto_bukti: string | null
  alamat: string | null
  no_hp: string | null
  karyawan_id: number | null
  status_ambil: number | null // 1 = Ambil Sendiri, 0 = Dikirim
  note: string | null
  status_aktif: number // 1 = Aktif, 0 = Dihapus / Nonaktif
  is_stock_deducted?: boolean
}

export type DeliveryNote = SuratJalan

export interface DetailSuratJalan {
  id: number
  surat_jalan_id: number
  produk_id: number
  qty: number // Qty ordered from SO
  qty_kirim: number // Qty delivered on this Delivery Note
  detail_sales_order_id: number | null
  keterangan?: string | null
}

export type DeliveryNoteItem = DetailSuratJalan & {
  kode_produk?: string
  nama_produk?: string
  satuan_nama?: string
  stok_saat_ini?: number
  qty_sudah_dikirim?: number
  sisa_qty?: number
}

/* =========================================================================
   3. VIEWMODELS & SUMMARY TYPES
   ========================================================================= */

export interface DriverOption {
  id: number
  nama: string
  nik?: string | null
  no_hp?: string | null
  jabatan_nama?: string | null
  grup_nama?: string | null
}

export interface DeliveryNoteListItem {
  id: number
  tanggal: string
  kode: string
  so_id: number
  so_kode: string
  so_variant?: SalesOrderVariantKey
  customer_id: number
  customer_nama: string
  karyawan_id?: number | null
  keterangan: string
  qty_pemesanan: number
  qty_pengiriman: number
  total_pembelian: number
  status_kirim: number
  status_kirim_label: 'BELUM DIKIRIM' | 'TERKIRIM' | 'AMBIL SENDIRI'
  has_bukti: boolean
  foto_bukti: string | null
  penerima: string | null
  status_dokumen: number
  status_dokumen_label: 'SUCCEEDED' | 'DRAFT' | 'BATAL'
  status_ambil: number
  nama_pengirim: string
}

export interface DeliveryNoteWithDetails extends DeliveryNote {
  items: DeliveryNoteItem[]
  so_kode: string
  so_variant?: SalesOrderVariantKey
  customer_id: number
  customer_nama: string
  customer_alamat?: string
  customer_no_hp?: string
  sales_id?: number
  sales_nama: string
  total_pembelian: number
  qty_pemesanan: number
  qty_pengiriman: number
}

/* =========================================================================
   4. FORM & PAYLOAD TYPES
   ========================================================================= */

export interface DeliveryNoteItemInput {
  produk_id: number
  qty: number // SO ordered qty
  qty_kirim: number // Delivery qty to ship
  detail_sales_order_id?: number | null
  keterangan?: string | null
  kode_produk?: string
  nama_produk?: string
  satuan_nama?: string
  stok_saat_ini?: number
  qty_sudah_dikirim?: number
  sisa_qty?: number
}

export interface CreateDeliveryNotePayload {
  so_id: number
  kode: string
  tanggal: string
  nama_pengirim?: string | null
  karyawan_id?: number | null
  keterangan?: string | null
  status: number // 0 = Draft, 1 = Succeeded
  is_pickup?: boolean
  items: DeliveryNoteItemInput[]
}

export interface UpdateDeliveryNotePayload {
  id: number
  kode?: string
  tanggal?: string
  nama_pengirim?: string | null
  karyawan_id?: number | null
  keterangan?: string | null
  status?: number
  is_pickup?: boolean
  items?: DeliveryNoteItemInput[]
}

export interface DeliveryProofPayload {
  penerima: string
  tanggal_terima?: string
  foto_bukti: string
  note?: string
}

export interface DeliveryNoteFilters {
  search?: string
  startDate?: string
  endDate?: string
  status_kirim?: number | null
  status_dokumen?: number | null
  is_pickup?: boolean | null
}

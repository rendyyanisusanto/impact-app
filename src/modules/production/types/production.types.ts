import type { BaseEntity } from '@/shared/types/crud.types'

/**
 * 1. DATABASE MODELS (Direct mapping from SQL schema u1573701_smm.sql)
 */

/**
 * Header table: `produksi`
 */
export interface Produksi extends BaseEntity {
  id: number
  kode: string | null
  tanggal: string | null // YYYY-MM-DD
  keterangan: string | null
  created_at: string
  created_by: number | null
  updated_at: string | null
  updated_by: number | null
  status: number | null // 0 = Draft, 1 = Successed / Selesai
  status_produksi: number | null // 0 = Pending, 1 = Proses, 2 = Selesai
  so_id: number | null
  customer_id: number | null
  status_aktif: number // 1 = Aktif, 0 = Nonaktif / Dibatalkan
  biaya_produksi: number | null
  jenis_produksi: number // 1 = Pesanan (Default), 0 = Non Pesanan / Stok
  uuid: string | null
}

/**
 * Detail table: `detail_produksi_produk`
 */
export interface DetailProduksiProduk {
  id: number
  produk_id: number | null
  produksi_id: number | null
  qty: number | null
  keterangan: string | null
}

/**
 * Material consumption table: `detail_bahan_produksi`
 */
export interface DetailBahanProduksi {
  id: number
  produk_id: number | null
  produksi_id: number | null
  bahan_id: number | null
  qty: number | null
  satuan_id: number | null
}

/**
 * Finished goods inventory ledger: `kartu_stok_produk`
 */
export interface KartuStokProduk {
  id: number
  tanggal: string | null
  produk_id: number | null
  masuk: number | null
  keluar: number | null
  keterangan: string | null
}

/**
 * 2. DOMAIN ENUMS & CONSTANTS
 */

export const JENIS_PRODUKSI = {
  PESANAN: 1,
  NON_PESANAN: 0
} as const

export type JenisProduksiValue = (typeof JENIS_PRODUKSI)[keyof typeof JENIS_PRODUKSI]

export const STATUS_PRODUKSI = {
  PENDING: 0,
  PROSES: 1,
  SELESAI: 2
} as const

export type StatusProduksiValue = (typeof STATUS_PRODUKSI)[keyof typeof STATUS_PRODUKSI]

export const DOKUMEN_STATUS = {
  DRAFT: 0,
  POSTED: 1
} as const

export type DokumenStatusValue = (typeof DOKUMEN_STATUS)[keyof typeof DOKUMEN_STATUS]

/**
 * 3. SPREADSHEET ROW & VIEW MODELS
 */

export interface ProductionProductRow {
  rowId: string // client-side unique row key
  detailId?: number
  produk_id: number | null
  kode_produk: string
  nama_produk: string
  stok: number // read-only current finished goods stock
  qty: number // editable target quantity
  keterangan: string // editable row notes
  satuan_nama?: string
  has_bom?: boolean
}

export interface ProductionListItem {
  id: number
  kode: string
  tanggal: string
  jenis_produksi: number
  jenis_label: string
  status_produksi: number
  status_produksi_label: string
  status: number
  status_label: string
  status_aktif: number
  jumlah_jenis_produk: number // Calculated count of distinct products
  total_qty: number // Calculated sum of product quantities
  keterangan: string
  so_id: number | null
  so_kode?: string | null
  customer_id: number | null
  customer_nama?: string
  is_posted: boolean
}

export interface CalculatedMaterialRequirement {
  bahan_id: number
  kode_bahan: string
  nama_bahan: string
  satuan_id: number
  satuan_nama: string
  total_kebutuhan: number
  stok_tersedia: number
  selisih: number
  status: 'CUKUP' | 'KURANG'
  kekurangan: number
}

export interface ProductionWithItems extends Produksi {
  items: ProductionProductRow[]
  is_posted: boolean
  customer_nama?: string
  so_kode?: string | null
  sales_order?: {
    id: number
    kode: string
    tanggal: string
    order_type: string
    status: number
    status_produksi: number
    customer_nama?: string
  } | null
  total_qty: number
  jumlah_jenis_produk: number
  material_requirements?: CalculatedMaterialRequirement[]
  has_unassigned_bom?: boolean
}

/**
 * 4. FORM & PAYLOAD TYPES
 */

export interface ProductionFormValues {
  kode: string
  jenis_produksi: number
  tanggal: string
  status_produksi: number
  keterangan: string
}

export interface ProductionItemPayload {
  produk_id: number
  qty: number
  keterangan?: string | null
}

export interface ProductionCreatePayload {
  kode?: string
  jenis_produksi: number
  tanggal: string
  status_produksi: number
  keterangan?: string | null
  items: ProductionItemPayload[]
}

export interface ProductionUpdatePayload {
  id: number
  kode?: string
  jenis_produksi: number
  tanggal: string
  status_produksi: number
  keterangan?: string | null
  items: ProductionItemPayload[]
}

export interface ProductionFilters {
  search?: string
  start_date?: string
  end_date?: string
  jenis_produksi?: number | string
  status_produksi?: number | string
  status_aktif?: number | string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SelectableProduct {
  id: number
  kode: string
  nama: string
  qty: number // current finished goods stock
  satuan_nama: string
  kategori_nama: string
  gudang_nama: string
  harga: number
  has_bom: boolean
}

export interface ProductionPostingResult {
  productionId: number
  kode: string
  posted: boolean
  finishedGoodsAdded: number
  materialsDeducted: number
  message: string
}

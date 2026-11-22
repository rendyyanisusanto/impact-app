import type { BaseEntity } from '@/shared/types/crud.types'

export interface ProdukFoto {
  id: number
  produk_id: number
  foto: string // URL or base64 data URI
}

export interface Produk extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  qty: number | null
  min_qty: number | null
  satuan_barang_id: number | null
  harga: number | null // int(11) in schema, represents currency IDR
  kategori_barang_id: number | null
  gudang_id: number | null
  status: number | null // 1 = Aktif, 0 = Nonaktif
  keterangan: string | null
  uuid: string | null
  foto: string | null // varchar(255) in schema, rendered as image preview

  // Presentation & resolved relations
  satuan_barang_nama?: string
  kategori_barang_nama?: string
  gudang_nama?: string
  harga_formatted?: string
  is_low_stock?: boolean
  fotos?: ProdukFoto[]
}

export interface CreateProductDto {
  kode?: string | null
  nama: string
  qty?: number | null
  min_qty?: number | null
  satuan_barang_id?: number | null
  harga?: number | null
  kategori_barang_id?: number | null
  gudang_id?: number | null
  status?: number
  keterangan?: string | null
  foto?: string | null
  additional_fotos?: string[]
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id?: number
}

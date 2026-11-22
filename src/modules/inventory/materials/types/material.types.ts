import type { BaseEntity } from '@/shared/types/crud.types'

export interface KonversiSatuanBahan {
  id?: number
  bahan_id?: number
  satuan_id: number
  nilai: number
  default: number // 1: default, 0: not default
  satuan_nama?: string
}

export interface MasterDataBahan extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  min_qty: number | null
  qty: number | null
  satuan_pakai_id: number | null
  satuan_beli_id: number | null
  gudang_id: number | null
  created_at: string | null
  created_by: number | null
  updated_at: string | null
  updated_by: number | null
  status: number | null // 1 = aktif, 0 = nonaktif
  harga_satuan: number | null // decimal(20,2)
  foto: string | null
  deskripsi: string | null

  // Resolved presentation attributes
  satuan_pakai_nama?: string
  satuan_beli_nama?: string
  gudang_nama?: string
  harga_satuan_formatted?: string
  konversi_satuan?: KonversiSatuanBahan[]
}

export interface CreateMaterialDto {
  kode?: string | null
  nama: string
  min_qty?: number | null
  qty?: number | null
  satuan_pakai_id?: number | null
  satuan_beli_id?: number | null
  gudang_id?: number | null
  harga_satuan?: number | null
  foto?: string | null
  deskripsi?: string | null
  status?: number
  konversi_satuan?: KonversiSatuanBahan[]
}

export interface UpdateMaterialDto extends Partial<CreateMaterialDto> {
  id?: number
}

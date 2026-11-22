import type { BaseEntity } from '@/shared/types/crud.types'

export interface SatuanBeli extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  status: number | null
  default: number | null // 1 or 0
}

export interface CreateSatuanBeliDto {
  kode?: string | null
  nama: string
  status?: number
  default?: number
}

export interface UpdateSatuanBeliDto extends Partial<CreateSatuanBeliDto> {
  id?: number
}

export interface SatuanPakai extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  satuan_beli_id: number | null
  pembagi: number | null // decimal(20,6)

  // Presentation resolved
  satuan_beli_nama?: string
}

export interface CreateSatuanPakaiDto {
  kode?: string | null
  nama: string
  satuan_beli_id?: number | null
  pembagi?: number | null
}

export interface UpdateSatuanPakaiDto extends Partial<CreateSatuanPakaiDto> {
  id?: number
}

export interface SatuanBarang extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  status: number | null
}

export interface CreateSatuanBarangDto {
  kode?: string | null
  nama: string
  status?: number
}

export interface UpdateSatuanBarangDto extends Partial<CreateSatuanBarangDto> {
  id?: number
}

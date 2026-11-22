import type { BaseEntity } from '@/shared/types/crud.types'

export interface Gudang extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  status: number | null // 1 = Aktif, 0 = Nonaktif
  color: string | null // hex color code e.g. #000000
  alamat: string | null
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
}

export interface CreateWarehouseDto {
  kode?: string | null
  nama: string
  status?: number
  color?: string | null
  alamat?: string | null
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {
  id?: number
}

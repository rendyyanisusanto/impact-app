import type { BaseEntity } from '@/shared/types/crud.types'

export interface Jabatan extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  color: string | null
  status: number | null
  is_deleted: number | null // 1 = active (not deleted), 0 = soft deleted per legacy semantics
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
}

export interface CreatePositionDto {
  kode?: string | null
  nama: string
  color?: string | null
  status?: number
  is_deleted?: number
}

export interface UpdatePositionDto extends Partial<CreatePositionDto> {
  id?: number
}

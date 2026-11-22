import type { BaseEntity } from '@/shared/types/crud.types'

export interface KategoriBahan extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  color: string | null
  status: number | null
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
}

export interface CreateMaterialCategoryDto {
  kode?: string | null
  nama: string
  color?: string | null
  status?: number
}

export interface UpdateMaterialCategoryDto extends Partial<CreateMaterialCategoryDto> {
  id?: number
}

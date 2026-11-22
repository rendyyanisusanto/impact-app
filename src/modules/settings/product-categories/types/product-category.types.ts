import type { BaseEntity } from '@/shared/types/crud.types'

export interface KategoriBarang extends BaseEntity {
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

export interface CreateProductCategoryDto {
  kode?: string | null
  nama: string
  color?: string | null
  status?: number
}

export interface UpdateProductCategoryDto extends Partial<CreateProductCategoryDto> {
  id?: number
}

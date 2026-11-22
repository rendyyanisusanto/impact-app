import type { BaseEntity } from '@/shared/types/crud.types'

export interface Ppn extends BaseEntity {
  id: number
  kode: string | null
  nama: number | null // int(11) in SQL schema: represents percentage, e.g. 11 for 11%
  status: number | null
  is_active: number | null // 1 = Active tax rate, 0 = Inactive
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null

  // Presentation resolved
  percentage_formatted?: string
}

export interface CreateTaxDto {
  kode?: string | null
  nama: number
  status?: number
  is_active?: number
}

export interface UpdateTaxDto extends Partial<CreateTaxDto> {
  id?: number
}

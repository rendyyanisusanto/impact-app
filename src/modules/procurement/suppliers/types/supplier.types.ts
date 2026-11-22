import type { BaseEntity } from '@/shared/types/crud.types'

export interface AdditionalSupplierData {
  id?: number
  supplier_id?: number
  name: string
  value: string
}

export interface MasterDataSuplier extends BaseEntity {
  id: number
  kode: string
  nama: string
  no_hp: string
  city_id: number | null
  alamat: string | null
  email: string
  deskripsi: string | null
  status: number // 1 = aktif, 0 = nonaktif
  created_at: string
  created_by: number
  updated_at: string
  updated_by: number
  province_id: number | null

  // Resolved presentation attributes
  province_name?: string
  city_name?: string
  additional_data?: AdditionalSupplierData[]
}

export interface CreateSupplierDto {
  kode: string
  nama: string
  no_hp: string
  email: string
  province_id?: number | null
  city_id?: number | null
  alamat?: string | null
  deskripsi?: string | null
  status?: number
  additional_data?: AdditionalSupplierData[]
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {
  id?: number
}

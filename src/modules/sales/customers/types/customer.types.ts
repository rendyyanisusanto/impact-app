import type { BaseEntity } from '@/shared/types/crud.types'

export interface AdditionalCustomerData {
  id?: number
  customer_id?: number
  name: string
  value: string
}

export interface MasterDataCustomer extends BaseEntity {
  id: number
  kode: string | null
  nama: string | null
  no_hp: string | null
  alamat: string | null
  province_id: number | null
  city_id: number | null
  email: string | null
  deskripsi: string | null
  status: number | null // 1 = aktif, 0 = nonaktif
  created_at: string | null
  created_by: number | null
  updated_at: string | null
  updated_by: number | null

  // Presentation attributes
  province_name?: string
  city_name?: string
  additional_data?: AdditionalCustomerData[]
}

export interface CreateCustomerDto {
  kode?: string | null
  nama: string
  no_hp?: string | null
  alamat?: string | null
  province_id?: number | null
  city_id?: number | null
  email?: string | null
  deskripsi?: string | null
  status?: number
  additional_data?: AdditionalCustomerData[]
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  id?: number
}

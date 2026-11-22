import type { BaseEntity, ListQuery } from '@/shared/types/crud.types'

/**
 * Gender type based on legacy schema ('Laki-Laki' | 'Perempuan')
 */
export type EmployeeGender = 'Laki-Laki' | 'Perempuan'

/**
 * Verified domain model mapping directly to MariaDB `karyawan` table
 */
export interface Employee extends BaseEntity {
  id: number
  kode: string | null
  nik: string | null
  nama: string
  jk: EmployeeGender | string | null
  no_hp: string | null
  alamat: string | null
  province_id: number | null
  city_id: number | null
  email: string | null
  jabatan_id: number | null
  tanggal_masuk: string | null
  status: number // 1 = Aktif, 0 = Nonaktif
  status_karyawan_id: number | null
  uid_fingerprint: number | null
  grup_karyawan_id: number | null
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null

  // UI Derived Reference Fields
  jabatan_nama?: string | null
  jabatan_color?: string | null
  status_karyawan_nama?: string | null
  status_karyawan_color?: string | null
  grup_karyawan_nama?: string | null
  grup_karyawan_color?: string | null
  province_name?: string | null
  city_name?: string | null
  creator_name?: string | null
  updater_name?: string | null
}

export interface CreateEmployeeDto {
  kode: string
  nik?: string | null
  nama: string
  jk?: EmployeeGender | string | null
  no_hp?: string | null
  alamat?: string | null
  province_id?: number | null
  city_id?: number | null
  email?: string | null
  jabatan_id: number
  tanggal_masuk?: string | null
  status: number
  status_karyawan_id: number
  uid_fingerprint: number
  grup_karyawan_id?: number | null
  created_by?: number | null
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  id?: number
  updated_by?: number | null
}

export interface EmployeeFilterQuery extends ListQuery {
  jabatan_id?: number | 'all'
  status_karyawan_id?: number | 'all'
  grup_karyawan_id?: number | 'all'
  status?: number | 'all' | string
}

export interface EmployeeValidationErrors {
  kode?: string
  nik?: string
  nama?: string
  uid_fingerprint?: string
  jabatan_id?: string
  status_karyawan_id?: string
  email?: string
  no_hp?: string
  [key: string]: string | undefined
}

import type { BaseEntity, ListQuery } from '@/shared/types/crud.types'

/**
 * Verified domain model mapping directly to MariaDB `grup_karyawan` table
 */
export interface EmployeeGroup extends BaseEntity {
  id: number
  kode: string | null
  nama: string
  color: string | null
  status_aktif: number // 1 = Aktif, 0 = Nonaktif
  created_at?: string | null
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null

  // Derived attributes
  member_count?: number
  creator_name?: string | null
  updater_name?: string | null
}

export interface CreateEmployeeGroupDto {
  kode: string
  nama: string
  color?: string | null
  status_aktif: number
  created_by?: number | null
}

export interface UpdateEmployeeGroupDto extends Partial<CreateEmployeeGroupDto> {
  id?: number
  updated_by?: number | null
}

export interface EmployeeGroupFilterQuery extends ListQuery {
  status_aktif?: number | 'all' | string
}

export interface EmployeeGroupValidationErrors {
  kode?: string
  nama?: string
  color?: string
  status_aktif?: string
  [key: string]: string | undefined
}

/**
 * Group Membership payload for bulk or individual employee group assignment
 */
export interface AssignGroupMembershipDto {
  employee_id: number
  target_group_id: number | null // null or 0 means remove from group
}

export interface BulkAssignGroupMembershipDto {
  employee_ids: number[]
  target_group_id: number | null
}

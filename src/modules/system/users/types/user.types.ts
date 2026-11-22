import type { SubmenuPermissionFlag } from '@/modules/system/groups/types/group.types'

/**
 * Verified domain model for Employee reference from table `karyawan`
 */
export interface EmployeeReference {
  id: number
  kode: string | null
  nama: string
  email: string | null
  status: number
  jabatan_id: number | null
  jabatan_nama: string | null
}

/**
 * Status of User account: 1 = Aktif, 0 = Nonaktif
 */
export type UserStatus = 1 | 0

/**
 * Internal entity representation of User (includes credential metadata internally)
 */
export interface User {
  id: number
  username: string
  email: string
  firstName: string // Legacy 'first_name' used as Nama Lengkap
  active: UserStatus
  employeeId: number | null // Legacy 'anggota_id'
  table: string // Legacy 'table' ('karyawan')
  groupId: number // Linked via 'users_groups'
  ipAddress: string
  pin: string | null // Masked internally
  passwordHash: string // Never exposed to client UI
  createdOn: string // Formatted YYYY-MM-DD HH:mm:ss
  lastLogin: string | null // Formatted YYYY-MM-DD HH:mm:ss or null
}

/**
 * Safe User model for table list presentation (strictly no password/pin)
 */
export interface UserListItem {
  id: number
  username: string
  email: string
  firstName: string
  employeeId: number | null
  employeeCode: string | null
  employeeName: string | null
  employeePosition: string | null
  groupId: number
  groupName: string
  groupDescription: string
  active: UserStatus
  statusLabel: 'AKTIF' | 'NON AKTIF'
  ipAddress: string
  lastLogin: string | null
  createdOn: string
}

/**
 * Safe User detail model for detail view
 */
export interface UserDetail extends UserListItem {
  employee: {
    id: number
    kode: string
    nama: string
    jabatan: string
    status: number
    statusLabel: string
    no_hp: string
    alamat: string
  } | null
  group: {
    id: number
    name: string
    description: string
  }
  isPinSet: boolean
  accessibleWidgets: (string | number)[]
  permissions: Record<string, SubmenuPermissionFlag>
}

/**
 * DTO for creating a new user
 */
export interface CreateUserPayload {
  employeeId: number | null
  firstName: string
  username: string
  email: string
  password: string
  passwordConfirm?: string
  pin: string
  groupId: number
  active?: UserStatus
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserPayload {
  firstName: string
  username: string
  email: string
  employeeId?: number | null
  groupId: number
  active?: UserStatus
  password?: string // Optional on edit
  pin?: string // Optional on edit
}

/**
 * Filter and pagination query parameters
 */
export interface UserFilterDto {
  search?: string
  groupId?: number | 'all'
  status?: number | 'all'
  page?: number
  pageSize?: number
  sortBy?: 'id' | 'username' | 'firstName' | 'email' | 'groupName' | 'active'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated response for user list
 */
export interface UserPaginatedResult {
  items: UserListItem[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

/**
 * Validation error mapping
 */
export interface UserValidationError {
  field: string
  message: string
}

/**
 * Summary of effective permissions for preview
 */
export interface UserPermissionSummary {
  groupName: string
  groupDescription: string
  totalMenus: number
  createCount: number
  readCount: number
  updateCount: number
  deleteCount: number
  dashboardWidgetsCount: number
}
export type PermissionAction = 'create' | 'read' | 'update' | 'delete'

export interface Permission {
  resource: string
  actions: PermissionAction[]
}

export type RoleType =
  | 'superadmin'
  | 'staff_penjualan'
  | 'staff_gudang'
  | 'staff_pengadaan'
  | 'staff_persediaan'
  | 'staff_produksi'
  | 'staff_keuangan'
  | 'staff_hr'
  | 'viewer'

export interface AuthUser {
  id: string | number
  name: string
  username: string
  roleId: string
  roleName: string
  role?: RoleType
  email?: string
  avatar?: string
  permissions: Permission[]
}

// User alias for backward compatibility
export type User = AuthUser

export interface MockLoginInput {
  username: string
  password?: string
}

export interface AuthState {
  currentUser: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

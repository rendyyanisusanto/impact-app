import type { AuthUser } from '@/shared/types/auth.types'

export const MOCK_USERS: AuthUser[] = [
  {
    id: '1',
    name: 'Superadmin',
    username: 'superadmin',
    roleId: 'role-superadmin',
    roleName: 'Super Administrator',
    role: 'superadmin',
    email: 'admin@impactfurniture.co.id',
    permissions: [
      {
        resource: '*',
        actions: ['create', 'read', 'update', 'delete']
      }
    ]
  },
  {
    id: '2',
    name: 'Ahmad Fauzi (Staff Penjualan)',
    username: 'staff.penjualan',
    roleId: 'role-penjualan',
    roleName: 'Staff Penjualan',
    role: 'staff_penjualan',
    email: 'ahmad@impactfurniture.co.id',
    permissions: [
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'sales', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sales.customers', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sales.orders.impact', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sales.orders.pola', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sales.orders.ks', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sales.invoice-payments', actions: ['read', 'create'] },
      { resource: 'sales.other-income', actions: ['read', 'create'] },
      { resource: 'delivery', actions: ['read', 'create'] }
    ]
  },
  {
    id: '3',
    name: 'Budi Santoso (Staff Gudang)',
    username: 'staff.gudang',
    roleId: 'role-gudang',
    roleName: 'Staff Gudang & Logistik',
    role: 'staff_gudang',
    email: 'budi@impactfurniture.co.id',
    permissions: [
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'inventory.materials', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'inventory.products', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'inventory.stock-adjustments', actions: ['create', 'read'] },
      { resource: 'inventory.material-mutations', actions: ['create', 'read'] },
      { resource: 'delivery', actions: ['create', 'read', 'update'] },
      { resource: 'delivery.notes', actions: ['create', 'read', 'update'] }
    ]
  },
  {
    id: '4',
    name: 'Dewi Lestari (Internal Auditor)',
    username: 'auditor',
    roleId: 'role-viewer',
    roleName: 'Internal Auditor (Read-Only)',
    role: 'viewer',
    email: 'dewi@impactfurniture.co.id',
    permissions: [
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'procurement', actions: ['read'] },
      { resource: 'inventory', actions: ['read'] },
      { resource: 'sales', actions: ['read'] },
      { resource: 'delivery', actions: ['read'] },
      { resource: 'settings', actions: ['read'] },
      { resource: 'hr', actions: ['read'] }
    ]
  },
  {
    id: '5',
    name: 'Siti Rahmawati (Staff HR & Personalia)',
    username: 'staff.hr',
    roleId: 'role-hr',
    roleName: 'Staff HR & Personalia',
    role: 'staff_hr',
    email: 'hr@impactfurniture.co.id',
    permissions: [
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'hr', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'hr.employees', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'hr.employee-groups', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'hr.schedules', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'hr.holidays', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'hr.attendance', actions: ['create', 'read', 'update', 'delete'] }
    ]
  }
]

export const mockUser = {
  id: 1,
  name: 'Superadmin',
  role: 'Superadmin',
  initials: 'SA',
  email: 'admin@impactfurniture.co.id'
}

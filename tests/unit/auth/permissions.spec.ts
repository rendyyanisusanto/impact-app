import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  filterNavigationByPermissions,
  isValidReturnUrl
} from '@/shared/utils/permissions'
import { usePermission } from '@/shared/composables/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'
import type { NavigationItem } from '@/shared/types/navigation.types'

describe('Sprint 2 — Task 4: Role-Based Access Control (RBAC) & Navigation Filtering', () => {
  const superadmin = MOCK_USERS[0]
  const staffPenjualan = MOCK_USERS[1]
  const staffGudang = MOCK_USERS[2]

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // 1. Superadmin full access
  it('1. Grants full wildcard access to Superadmin for any resource and action', () => {
    expect(hasPermission(superadmin, 'sales.orders.impact', 'read')).toBe(true)
    expect(hasPermission(superadmin, 'accounting.journals', 'delete')).toBe(true)
    expect(hasPermission(superadmin, 'system.users', 'create')).toBe(true)
    expect(hasPermission(superadmin, 'any-unregistered-resource', 'read')).toBe(true)
  })

  // 2. Staff Penjualan limited access
  it('2. Restricts Staff Penjualan to sales resources only', () => {
    expect(hasPermission(staffPenjualan, 'sales.customers', 'read')).toBe(true)
    expect(hasPermission(staffPenjualan, 'sales.orders.impact', 'create')).toBe(true)
    expect(hasPermission(staffPenjualan, 'dashboard', 'read')).toBe(true)

    // Forbidden
    expect(hasPermission(staffPenjualan, 'inventory.materials', 'read')).toBe(false)
    expect(hasPermission(staffPenjualan, 'accounting.journals', 'read')).toBe(false)
    expect(hasPermission(staffPenjualan, 'system.users', 'read')).toBe(false)
  })

  // 3. Staff Gudang limited access
  it('3. Restricts Staff Gudang to inventory and delivery resources only', () => {
    expect(hasPermission(staffGudang, 'inventory.materials', 'read')).toBe(true)
    expect(hasPermission(staffGudang, 'inventory.stock-adjustments', 'create')).toBe(true)
    expect(hasPermission(staffGudang, 'delivery.notes', 'read')).toBe(true)

    // Forbidden
    expect(hasPermission(staffGudang, 'sales.customers', 'read')).toBe(false)
    expect(hasPermission(staffGudang, 'accounting.journals', 'read')).toBe(false)
  })

  // 4. Permission read
  it('4. Correctly verifies read permission action', () => {
    expect(hasPermission(staffPenjualan, 'sales.customers', 'read')).toBe(true)
    expect(hasPermission(staffGudang, 'inventory.materials', 'read')).toBe(true)
  })

  // 5. Permission create
  it('5. Correctly verifies create permission action', () => {
    expect(hasPermission(staffPenjualan, 'sales.orders.impact', 'create')).toBe(true)
    expect(hasPermission(staffGudang, 'inventory.stock-adjustments', 'create')).toBe(true)
  })

  // 6. Permission update
  it('6. Correctly verifies update permission action', () => {
    expect(hasPermission(staffPenjualan, 'sales.orders.impact', 'update')).toBe(true)
    expect(hasPermission(staffGudang, 'delivery.notes', 'update')).toBe(true)
  })

  // 7. Permission delete
  it('7. Correctly verifies delete permission action', () => {
    expect(hasPermission(staffPenjualan, 'sales.orders.impact', 'delete')).toBe(true)
    // Delivery notes only has ['create', 'read', 'update'] for staff gudang
    expect(hasPermission(staffGudang, 'delivery.notes', 'delete')).toBe(false)
  })

  // 8. Missing permission
  it('8. Denies access when permission is missing from user record', () => {
    expect(hasPermission(staffPenjualan, 'procurement.suppliers', 'read')).toBe(false)
    expect(hasPermission(staffGudang, 'system.users', 'read')).toBe(false)
    expect(hasPermission(null, 'dashboard', 'read')).toBe(false)
  })

  // 9. Unknown resource
  it('9. Denies access to unknown or unregistered resources for standard roles', () => {
    expect(hasPermission(staffPenjualan, 'nonexistent.resource.xyz', 'read')).toBe(false)
    expect(hasPermission(staffGudang, 'secret.financial.data', 'read')).toBe(false)
  })

  // 10. Parent navigation filtering
  it('10. Retains parent navigation item if at least one child is permitted', () => {
    const nav: NavigationItem[] = [
      {
        id: 'penjualan',
        label: 'Penjualan',
        children: [
          {
            id: 'sales-customers',
            label: 'Customer',
            route: '/sales/customers',
            permission: 'sales.customers:read'
          },
          {
            id: 'secret-sales',
            label: 'Rahasia',
            route: '/sales/secret',
            permission: 'secret:read'
          }
        ]
      }
    ]

    const filtered = filterNavigationByPermissions(nav, staffPenjualan)
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('penjualan')
    expect(filtered[0].children?.length).toBe(1)
    expect(filtered[0].children?.[0].id).toBe('sales-customers')
  })

  // 11. Child navigation filtering
  it('11. Removes parent navigation item if all child items are forbidden', () => {
    const nav: NavigationItem[] = [
      {
        id: 'procurement',
        label: 'Pengadaan',
        children: [
          {
            id: 'procurement-suppliers',
            label: 'Suplier',
            route: '/procurement/suppliers',
            permission: 'procurement.suppliers:read'
          }
        ]
      }
    ]

    const filtered = filterNavigationByPermissions(nav, staffPenjualan)
    expect(filtered.length).toBe(0)
  })

  // 12. Route permission enforcement
  it('12. Enforces route permission via canAccessRoute pure function', () => {
    expect(canAccessRoute(staffPenjualan, 'sales.orders.impact:read')).toBe(true)
    expect(canAccessRoute(staffPenjualan, 'procurement.suppliers:read')).toBe(false)
    expect(canAccessRoute(null, 'dashboard:read')).toBe(false)
    expect(canAccessRoute(null, undefined)).toBe(true) // Public route without permission requirement
  })

  // 13. Permission composable
  it('13. usePermission composable exposes helper methods reactively', async () => {
    const authStore = useAuthStore()
    await authStore.switchUser('2') // Staff Penjualan

    const { canRead, canCreate, canDelete, hasPermission } = usePermission()

    expect(canRead('sales.customers')).toBe(true)
    expect(canCreate('sales.orders.impact')).toBe(true)
    expect(hasPermission('sales.orders.impact', 'update')).toBe(true)
    expect(canRead('procurement.suppliers')).toBe(false)
    expect(canDelete('procurement.suppliers')).toBe(false)
  })

  // 14. No mutation of navigation config
  it('14. Never mutates the original navigation array (pure function)', () => {
    const originalNav: NavigationItem[] = [
      {
        id: 'pengadaan',
        label: 'Pengadaan',
        children: [
          {
            id: 'procurement-suppliers',
            label: 'Suplier',
            route: '/procurement/suppliers',
            permission: 'procurement:read'
          }
        ]
      }
    ]

    const deepCloneOriginal = JSON.parse(JSON.stringify(originalNav))

    // Run filter
    filterNavigationByPermissions(originalNav, staffPenjualan)

    // Original must remain intact
    expect(originalNav).toEqual(deepCloneOriginal)
    expect(originalNav[0].children?.length).toBe(1)
  })

  // 15. Helper utilities: hasAnyPermission, hasAllPermissions, isValidReturnUrl
  it('15. Validates multiple permissions and return URLs', () => {
    expect(hasAnyPermission(staffPenjualan, ['sales.customers', 'inventory.materials'])).toBe(true)
    expect(hasAllPermissions(staffPenjualan, ['sales.customers', 'dashboard'])).toBe(true)
    expect(hasAllPermissions(staffPenjualan, ['sales.customers', 'inventory.materials'])).toBe(
      false
    )

    expect(isValidReturnUrl('/dashboard')).toBe(true)
    expect(isValidReturnUrl('//evil.com')).toBe(false)
  })
})

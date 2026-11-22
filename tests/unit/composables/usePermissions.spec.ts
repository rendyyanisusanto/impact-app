import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissions } from '@/shared/composables/usePermissions'
import type { NavigationItem } from '@/shared/types/navigation.types'

describe('usePermissions.ts — Navigation Filtering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockNav: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      permission: 'dashboard:read'
    },
    {
      id: 'penjualan',
      label: 'Penjualan',
      permission: 'sales:read',
      children: [
        {
          id: 'so',
          label: 'Sales Order',
          path: '/sales/orders/impact',
          permission: 'sales:read'
        }
      ]
    },
    {
      id: 'system',
      label: 'System Setting',
      permission: 'system:read',
      children: [
        {
          id: 'users',
          label: 'Users',
          path: '/system/users',
          permission: 'system:read'
        }
      ]
    }
  ]

  it('keeps all navigation items for superadmin', () => {
    const { filterNavigation } = usePermissions()
    const filtered = filterNavigation(mockNav)
    expect(filtered).toHaveLength(3)
    expect(filtered.map(i => i.id)).toEqual(['dashboard', 'penjualan', 'system'])
  })

  it('filters out unauthorized items for restricted role', async () => {
    const auth = useAuthStore()
    const { filterNavigation } = usePermissions()

    // Switch to Staff Penjualan (id: '2', has dashboard and sales)
    await auth.switchUser('2')

    const filtered = filterNavigation(mockNav)
    expect(filtered.map(i => i.id)).toEqual(['dashboard', 'penjualan'])
    expect(filtered.some(i => i.id === 'system')).toBe(false)
  })

  it('filters out sales and system for Staff Gudang', async () => {
    const auth = useAuthStore()
    const { filterNavigation } = usePermissions()

    // Switch to Staff Gudang (id: '3', has dashboard and inventory, not sales or system)
    await auth.switchUser('3')

    const filtered = filterNavigation(mockNav)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('dashboard')
  })
})

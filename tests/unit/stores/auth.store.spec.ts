import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

describe('auth.store.ts — State Management & Mock Authentication', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default superadmin user and authenticated state', () => {
    const auth = useAuthStore()
    expect(auth.currentUser).not.toBeNull()
    expect(auth.user?.role).toBe('superadmin')
    expect(auth.isSuperadmin).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isInitialized).toBe(true)
  })

  it('handles successful mock login', async () => {
    const auth = useAuthStore()
    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)

    const user = await auth.login('staff.penjualan', 'secret123')
    expect(user.username).toBe('staff.penjualan')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.currentUser?.role).toBe('staff_penjualan')
    expect(auth.error).toBeNull()
  })

  it('handles failed mock login when user is not found', async () => {
    const auth = useAuthStore()
    await auth.logout()

    await expect(auth.login('unknown.user', 'wrongpass')).rejects.toThrow('Kredensial tidak valid')
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.error).toContain('Kredensial tidak valid')
  })

  it('clears session on logout', async () => {
    const auth = useAuthStore()
    await auth.logout()

    expect(auth.currentUser).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.hasPermission('dashboard:read')).toBe(false)
  })

  it('initializes auth from mock service', async () => {
    const auth = useAuthStore()
    // Login to mock service
    await auth.login('superadmin')
    expect(auth.isAuthenticated).toBe(true)

    // Reset local store state
    auth.currentUser = null
    auth.isAuthenticated = false
    auth.isInitialized = false

    // Initialize from service
    await auth.initializeAuth()
    expect(auth.isInitialized).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.username).toBe('superadmin')
  })

  it('switches between mock roles and updates permissions correctly', async () => {
    const auth = useAuthStore()

    // Switch to Staff Gudang (id: '3')
    await auth.switchUser('3')
    expect(auth.currentUser?.id).toBe('3')
    expect(auth.currentUser?.role).toBe('staff_gudang')
    expect(auth.isSuperadmin).toBe(false)

    // Has inventory and delivery
    expect(auth.hasPermission('inventory.materials')).toBe(true)
    expect(auth.hasPermission('delivery.notes')).toBe(true)

    // Does NOT have sales or accounting
    expect(auth.hasPermission('sales.orders.impact')).toBe(false)
    expect(auth.hasPermission('accounting.journals')).toBe(false)
  })

  it('prevents double submission when login is already in progress', async () => {
    const auth = useAuthStore()
    auth.isLoading = true

    await expect(auth.login('superadmin', 'password')).rejects.toThrow(
      'Proses login sedang berjalan'
    )
  })

  it('clears error with clearError action', () => {
    const auth = useAuthStore()
    auth.error = 'Ada kesalahan'
    expect(auth.error).toBe('Ada kesalahan')

    auth.clearError()
    expect(auth.error).toBeNull()
  })

  it('restores user session from localStorage on refresh/reload', () => {
    const store: Record<string, string> = {}
    const storageMock = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = String(v)
      },
      removeItem: (k: string) => {
        delete store[k]
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k]
      }
    }
    Object.defineProperty(window, 'localStorage', { value: storageMock, writable: true, configurable: true })

    const fakeSuperadmin = {
      id: 1,
      username: 'superadmin',
      name: 'Administrator',
      role: 'superadmin',
      roleName: 'Superadmin',
      roleId: '1',
      permissions: [{ resource: '*', actions: ['read', 'create', 'update', 'delete'] }]
    }
    window.localStorage.setItem('smm_user', JSON.stringify(fakeSuperadmin))

    setActivePinia(createPinia())
    const auth = useAuthStore()

    expect(auth.currentUser).not.toBeNull()
    expect(auth.currentUser?.role).toBe('superadmin')
    expect(auth.userRole).toMatch(/Super/i)
    expect(auth.isSuperadmin).toBe(true)
    expect(auth.hasPermission('procurement:read')).toBe(true)
    expect(auth.hasPermission('anything')).toBe(true)
  })
})

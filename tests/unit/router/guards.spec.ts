import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouteGuards } from '@/app/router/guards'
import { useAuthStore } from '@/stores/auth.store'
import { isValidReturnUrl } from '@/shared/utils/permissions'

describe('router/guards.ts — Sprint 2 Task 3: Route Protection & Security', () => {
  let router: ReturnType<typeof createRouter>

  const testRoutes: RouteRecordRaw[] = [
    {
      path: '/login',
      name: 'login',
      component: { template: '<div>Login</div>' },
      meta: { requiresAuth: false, title: 'Login' }
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: { template: '<div>403 Unauthorized</div>' },
      meta: { requiresAuth: true, title: '403 - Akses Ditolak' }
    },
    {
      path: '/403',
      name: 'forbidden',
      component: { template: '<div>403 Forbidden</div>' },
      meta: { requiresAuth: true, title: '403 - Akses Ditolak' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: { template: '<div>Dashboard</div>' },
      meta: { requiresAuth: true, permission: 'dashboard:read', title: 'Dashboard' }
    },
    {
      path: '/sales/orders',
      name: 'sales.orders',
      component: { template: '<div>Sales Orders</div>' },
      meta: { requiresAuth: true, permission: 'sales:read', title: 'Sales Orders' }
    },
    {
      path: '/system/users',
      name: 'system.users',
      component: { template: '<div>System Users</div>' },
      meta: { requiresAuth: true, permission: 'system:read', title: 'System Users' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: { template: '<div>404 Not Found</div>' },
      meta: { requiresAuth: false, title: '404' }
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: testRoutes
    })
    setupRouteGuards(router)
  })

  // 1. Guest membuka dashboard
  it('1. Redirects guest accessing /dashboard to /login', async () => {
    const auth = useAuthStore()
    await auth.logout()

    await router.push('/dashboard')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  // 2. Guest membuka submenu
  it('2. Redirects guest accessing protected submenu to /login with redirect query', async () => {
    const auth = useAuthStore()
    await auth.logout()

    await router.push('/sales/orders')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/sales/orders')
  })

  // 3. Guest membuka login
  it('3. Allows guest to access public /login route', async () => {
    const auth = useAuthStore()
    await auth.logout()

    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  // 4. Authenticated user membuka login
  it('4. Redirects authenticated user accessing /login to /dashboard', async () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(true)

    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  // 5. Authenticated user membuka dashboard
  it('5. Allows authenticated user with dashboard permission to access /dashboard', async () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(true)

    await router.push('/dashboard')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  // 6. User tanpa permission membuka protected route
  it('6. Redirects user lacking permission to /unauthorized without causing loops', async () => {
    const auth = useAuthStore()
    // Switch to Staff Penjualan who does NOT have system:read
    await auth.switchUser('2')

    await router.push('/system/users')
    expect(router.currentRoute.value.path).toBe('/unauthorized')

    // Visiting /unauthorized directly stays on /unauthorized
    await router.push('/unauthorized')
    expect(router.currentRoute.value.path).toBe('/unauthorized')
  })

  // 7. User dengan permission membuka protected route
  it('7. Allows user with specific permission to access permitted route', async () => {
    const auth = useAuthStore()
    // Switch to Staff Penjualan who HAS sales:read
    await auth.switchUser('2')

    await router.push('/sales/orders')
    expect(router.currentRoute.value.path).toBe('/sales/orders')
  })

  // 8. Invalid redirect target validation
  it('8. Validates return URL and rejects invalid internal paths', () => {
    expect(isValidReturnUrl('')).toBe(false)
    expect(isValidReturnUrl('dashboard')).toBe(false) // Must start with '/'
    expect(isValidReturnUrl('/\\evil.com')).toBe(false)
  })

  // 9. External redirect target prevention (open redirect protection)
  it('9. Prevents open redirects: blocks protocol URLs and protocol-relative // URLs', () => {
    expect(isValidReturnUrl('https://evil-phishing.com')).toBe(false)
    expect(isValidReturnUrl('http://malicious.org')).toBe(false)
    expect(isValidReturnUrl('//attacker.com/steal')).toBe(false)
    expect(isValidReturnUrl('javascript:alert(1)')).toBe(false)
    expect(isValidReturnUrl('/dashboard')).toBe(true)
    expect(isValidReturnUrl('/sales/orders?page=2')).toBe(true)
  })

  // 10. Unknown route handling
  it('10. Renders 404 catch-all for unknown routes without auth redirects', async () => {
    await router.push('/non-existent-module-path')
    expect(router.currentRoute.value.path).toBe('/non-existent-module-path')
    expect(router.currentRoute.value.name).toBe('not-found')
  })

  // 11. Logout lalu membuka protected route
  it('11. Prevents access to protected route immediately after user logs out', async () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(true)

    // User logs out
    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)

    // Attempt navigating to protected route
    await router.push('/dashboard')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  // 12. Browser refresh dengan mock session
  it('12. Restores authenticated session on initialization after refresh simulation', async () => {
    const auth = useAuthStore()
    await auth.login('staff.penjualan', 'password')
    expect(auth.isAuthenticated).toBe(true)

    // Simulate page refresh (store state reset before guard executes)
    auth.currentUser = null
    auth.isAuthenticated = false
    auth.isInitialized = false

    // Router guard automatically calls initializeAuth()
    await router.push('/sales/orders')
    expect(auth.isInitialized).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.path).toBe('/sales/orders')
  })
})

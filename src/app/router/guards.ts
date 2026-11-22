import type { Router, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export function setupRouteGuards(router: Router) {
  router.beforeEach(async (to: RouteLocationNormalized) => {
    const authStore = useAuthStore()

    // 1. Set document title
    const appTitle = import.meta.env.VITE_APP_TITLE || 'Impact Furniture ERP'
    const pageTitle = to.meta.title as string | undefined
    if (pageTitle) {
      document.title = `${pageTitle} — ${appTitle}`
    } else {
      document.title = appTitle
    }

    // 2. Ensure mock auth state initialization before routing decisions
    if (!authStore.isInitialized) {
      await authStore.initializeAuth()
    }

    const isPublicOnly = to.meta.publicOnly === true
    const requiresAuth = to.meta.requiresAuth !== false && !isPublicOnly

    // 3. Authenticated user visiting /login
    if (to.path === '/login' && authStore.isAuthenticated) {
      if (authStore.hasPermission('dashboard') || authStore.hasPermission('dashboard:read')) {
        return { path: '/dashboard' }
      }
      return { path: '/unauthorized' }
    }

    // 4. Guest visiting protected route
    if (requiresAuth && !authStore.isAuthenticated) {
      const hasRedirect = to.fullPath !== '/dashboard' && to.fullPath !== '/'
      return {
        path: '/login',
        query: hasRedirect ? { redirect: to.fullPath } : undefined
      }
    }

    // 5. Permission-protected route checking
    const requiredPermission = to.meta.permission as string | undefined
    if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
      // Prevent redirect loop if target is already /403 or /unauthorized
      if (to.path !== '/403' && to.path !== '/unauthorized') {
        return { path: '/unauthorized' }
      }
    }

    return true
  })
}

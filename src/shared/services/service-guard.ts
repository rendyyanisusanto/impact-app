import { useAuthStore } from '@/stores/auth.store'
import type { PermissionAction } from '@/shared/types/auth.types'

/**
 * Service-level RBAC boundary enforcement:
 * Simulates backend authorization at the mock service boundary.
 * Throws when an active authenticated session lacks required action on resource.
 */
export function assertPermission(resource: string, action: PermissionAction = 'read'): void {
  try {
    const authStore = useAuthStore()
    if (authStore && authStore.isAuthenticated && authStore.currentUser) {
      if (!authStore.hasPermission(resource, action)) {
        throw new Error(
          `Akses ditolak: Pengguna '${authStore.currentUser.name}' tidak memiliki izin '${action}' pada resource '${resource}'.`
        )
      }
    }
  } catch (err: unknown) {
    if ((err as Error).message?.includes('Akses ditolak:')) {
      throw err
    }
    // Safe fallback if called outside active Pinia context
  }
}

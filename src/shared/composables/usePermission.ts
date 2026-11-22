import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import type { PermissionAction } from '@/shared/types/auth.types'
import type { NavigationItem } from '@/shared/types/navigation.types'
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  filterNavigationByPermissions
} from '@/shared/utils/permissions'

export function usePermission() {
  const authStore = useAuthStore()

  const currentUser = computed(() => authStore.currentUser)

  function hasPermission(resource: string, action?: PermissionAction): boolean {
    return checkPermission(currentUser.value, resource, action)
  }

  function canRead(resource: string): boolean {
    return hasPermission(resource, 'read')
  }

  function canCreate(resource: string): boolean {
    return hasPermission(resource, 'create')
  }

  function canUpdate(resource: string): boolean {
    return hasPermission(resource, 'update')
  }

  function canDelete(resource: string): boolean {
    return hasPermission(resource, 'delete')
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return checkAnyPermission(currentUser.value, permissions)
  }

  function hasAllPermissions(permissions: string[]): boolean {
    return checkAllPermissions(currentUser.value, permissions)
  }

  function filterNavigation(items: NavigationItem[]): NavigationItem[] {
    return filterNavigationByPermissions(items, currentUser.value)
  }

  // Backward-compatibility aliases
  const can = (permission: string) => hasPermission(permission, 'read')
  const canAny = (permissions: string[]) => hasAnyPermission(permissions)

  return {
    currentUser,
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    hasAnyPermission,
    hasAllPermissions,
    filterNavigation,
    can,
    canAny
  }
}

// Re-export plural naming for backward compatibility
export const usePermissions = usePermission

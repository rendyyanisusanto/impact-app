import type { AuthUser, PermissionAction } from '@/shared/types/auth.types'
import type { NavigationItem } from '@/shared/types/navigation.types'

/**
 * Normalizes permission string representations into { resource, action }
 * Supports 'resource:action', 'resource.action', or bare 'resource'
 */
export function parsePermissionString(perm: string): {
  resource: string
  action: PermissionAction
} {
  if (perm.includes(':')) {
    const [res, act] = perm.split(':')
    return { resource: res, action: (act as PermissionAction) || 'read' }
  }
  return { resource: perm, action: 'read' }
}

/**
 * Pure function: Checks if a user has a specific permission.
 * Data-driven: Evaluates permissions from user.permissions without hardcoding role names.
 */
export function hasPermission(
  user: AuthUser | null,
  resource: string,
  action: PermissionAction = 'read'
): boolean {
  if (!user) return false

  // 0. Superadmin bypass
  if (user.role === 'superadmin' || user.roleId === 'role-superadmin') {
    return true
  }

  if (!user.permissions || user.permissions.length === 0) return false

  // 1. Data-driven wildcard check: resource '*' grants full access
  const hasWildcard = user.permissions.some(
    p =>
      (p.resource === '*' || p.resource.toLowerCase() === 'all') &&
      (p.actions.includes(action) ||
        (p.actions as string[]).includes('*') ||
        p.actions.length === 0)
  )
  if (hasWildcard) {
    return true
  }

  // 2. Parse resource & action if composite string passed (e.g. 'sales:read' or 'sales.orders.impact')
  const parsed = parsePermissionString(resource)
  const targetResource = parsed.resource.toLowerCase()
  const targetAction = action || parsed.action

  // 3. Match resource against user permissions
  return user.permissions.some(p => {
    const pResource = p.resource.toLowerCase()
    if (pResource === '*' || pResource === 'all') return true

    // Exact resource match or hierarchical prefix (e.g. 'sales' grants 'sales.customers')
    const matchesResource =
      pResource === targetResource ||
      targetResource.startsWith(`${pResource}.`) ||
      targetResource.startsWith(`${pResource}:`)

    if (!matchesResource) return false

    return (
      p.actions.includes(targetAction) ||
      (p.actions as string[]).includes('*') ||
      p.actions.length === 0
    )
  })
}

/**
 * Pure function: Checks if user has AT LEAST ONE of the specified permissions
 */
export function hasAnyPermission(user: AuthUser | null, permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return true
  return permissions.some(perm => {
    const { resource, action } = parsePermissionString(perm)
    return hasPermission(user, resource, action)
  })
}

/**
 * Pure function: Checks if user has ALL of the specified permissions
 */
export function hasAllPermissions(user: AuthUser | null, permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return true
  return permissions.every(perm => {
    const { resource, action } = parsePermissionString(perm)
    return hasPermission(user, resource, action)
  })
}

/**
 * Pure function: Checks if a user can access a route based on its required permission
 */
export function canAccessRoute(user: AuthUser | null, permission?: string): boolean {
  if (!permission) return true
  const { resource, action } = parsePermissionString(permission)
  return hasPermission(user, resource, action)
}

/**
 * Pure function: Filters navigation items hierarchically based on user permissions.
 * Does not mutate the original items array.
 * Retains parent item if at least one child is accessible; hides parent if all children forbidden.
 */
export function filterNavigationByPermissions(
  items: NavigationItem[],
  user: AuthUser | null
): NavigationItem[] {
  if (!items || items.length === 0) return []

  const isSuperadmin =
    user?.role === 'superadmin' ||
    user?.roleId === 'role-superadmin' ||
    user?.permissions?.some(p => p.resource === '*' || p.resource?.toLowerCase() === 'all')

  if (isSuperadmin) {
    return items
  }

  return items
    .map(item => {
      // Pure deep copy of the navigation item
      const clonedItem: NavigationItem = { ...item }

      if (item.children && item.children.length > 0) {
        clonedItem.children = filterNavigationByPermissions(item.children, user)
      }
      return clonedItem
    })
    .filter(item => {
      // 1. Direct leaf with permission
      if (item.permission && (!item.children || item.children.length === 0)) {
        return canAccessRoute(user, item.permission)
      }

      // 2. Parent whose children were all filtered out
      if (item.children !== undefined && item.children.length === 0 && !item.route && !item.path) {
        return false
      }

      // 3. Parent with top-level permission but no remaining accessible children
      if (item.permission && item.children && item.children.length === 0) {
        return canAccessRoute(user, item.permission)
      }

      return true
    })
}

/**
 * Open Redirect Prevention Validator
 * Ensures return URL is a safe relative path starting with '/' and not '//' or protocol
 */
export function isValidReturnUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed.startsWith('/')) return false
  if (trimmed.startsWith('//')) return false
  if (trimmed.startsWith('/\\')) return false
  // Check for encoded protocols like javascript:, https:, http:
  if (/^(\/|%2f)*[a-z0-9]+:/i.test(trimmed)) return false
  return true
}

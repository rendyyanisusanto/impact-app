import type { NavigationItem, BreadcrumbItem } from './navigation.types'

/**
 * Checks whether a navigation item or one of its descendants matches the current path.
 */
export function determineActiveState(item: NavigationItem, currentPath: string): boolean {
  const itemPath = item.route || item.path

  if (itemPath) {
    if (
      currentPath === itemPath ||
      (itemPath === '/sales/orders/impact' &&
        (currentPath === '/sales/so-impact' || currentPath.startsWith('/sales/so-impact/'))) ||
      (itemPath === '/sales/orders/pola' &&
        (currentPath === '/sales/so-pola' || currentPath.startsWith('/sales/so-pola/'))) ||
      (itemPath === '/sales/orders/ks' &&
        (currentPath === '/sales/so-ks' || currentPath.startsWith('/sales/so-ks/')))
    ) {
      return true
    }
    // Deep route matching, avoiding false positives on root or base routes
    if (itemPath !== '/' && itemPath !== '/dashboard') {
      if (currentPath.startsWith(itemPath + '/')) {
        return true
      }
    }
  }

  if (item.children && item.children.length > 0) {
    return item.children.some(child => determineActiveState(child, currentPath))
  }

  return false
}

/**
 * Recursively finds a navigation item by its route or path.
 */
export function findNavigationItemByRoute(
  items: NavigationItem[],
  path: string
): NavigationItem | null {
  for (const item of items) {
    const itemPath = item.route || item.path
    if (
      itemPath === path ||
      (itemPath === '/sales/orders/impact' && path === '/sales/so-impact') ||
      (itemPath === '/sales/orders/pola' && path === '/sales/so-pola') ||
      (itemPath === '/sales/orders/ks' && path === '/sales/so-ks')
    ) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findNavigationItemByRoute(item.children, path)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * Finds the top-level parent menu item that contains the specified route.
 */
export function findActiveParentMenu(items: NavigationItem[], path: string): NavigationItem | null {
  for (const item of items) {
    if (determineActiveState(item, path)) {
      return item
    }
  }
  return null
}

/**
 * Generates structured breadcrumbs from current route and navigation configuration.
 */
export function generateBreadcrumbData(items: NavigationItem[], path: string): BreadcrumbItem[] {
  if (path === '/' || path === '/dashboard') {
    return [{ label: 'Dashboard', to: '/dashboard', current: true }]
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', to: '/dashboard', current: false }]

  for (const parent of items) {
    if (determineActiveState(parent, path)) {
      if (parent.children && parent.children.length > 0) {
        // Add parent (not clickable if no direct route)
        breadcrumbs.push({
          label: parent.label,
          to: parent.route || parent.path,
          current: false
        })

        // Find matching child
        const child = parent.children.find(
          c =>
            (c.route || c.path) === path ||
            path.startsWith((c.route || c.path || '') + '/') ||
            (c.route === '/sales/orders/impact' && path.startsWith('/sales/so-impact')) ||
            (c.route === '/sales/orders/pola' && path.startsWith('/sales/so-pola')) ||
            (c.route === '/sales/orders/ks' && path.startsWith('/sales/so-ks'))
        )

        if (child) {
          breadcrumbs.push({
            label: child.label,
            to: child.route || child.path,
            current: true
          })
        }
      } else {
        breadcrumbs.push({
          label: parent.label,
          to: parent.route || parent.path,
          current: true
        })
      }
      return breadcrumbs
    }
  }

  // Fallback if not matched directly in navigation items
  const cleanPath = path.replace(/^\//, '')
  const segments = cleanPath.split('/').filter(Boolean)
  segments.forEach((seg, idx) => {
    const isLast = idx === segments.length - 1
    const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
    breadcrumbs.push({
      label: formatted,
      to: isLast ? undefined : `/${segments.slice(0, idx + 1).join('/')}`,
      current: isLast
    })
  })

  return breadcrumbs
}

/**
 * Pure function to filter navigation items based on user permissions.
 */
export function filterNavigationItems(
  items: NavigationItem[],
  permissions?: string[]
): NavigationItem[] {
  if (!permissions || permissions.includes('*')) {
    return items
  }

  return items
    .filter(item => {
      if (!item.permission) return true
      return permissions.includes(item.permission)
    })
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: filterNavigationItems(item.children, permissions)
        }
      }
      return item
    })
}

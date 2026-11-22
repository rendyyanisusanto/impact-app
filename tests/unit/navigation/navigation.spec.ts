import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { NAVIGATION_ITEMS } from '@/app/navigation/navigation.config'
import {
  findNavigationItemByRoute,
  findActiveParentMenu,
  generateBreadcrumbData,
  filterNavigationItems
} from '@/app/navigation/navigation.utils'
import { routes } from '@/app/router/routes'
import AppNavigationDropdown from '@/app/layouts/components/AppNavigationDropdown.vue'
import type { RouteRecordRaw } from 'vue-router'

describe('Sprint 1 — Task 4: Navigation Configuration & Routing Hardening', () => {
  it('contains all 11 main menu items in the exact required enterprise order', () => {
    const expectedLabels = [
      'Dashboard',
      'Pengadaan',
      'Persediaan',
      'Produksi',
      'Penjualan',
      'Pengiriman',
      'Keuangan',
      'Laporan',
      'HR',
      'Setting',
      'System Setting'
    ]

    expect(NAVIGATION_ITEMS).toHaveLength(11)
    NAVIGATION_ITEMS.forEach((item, index) => {
      expect(item.label).toBe(expectedLabels[index])
    })
  })

  it('guarantees all navigation IDs are globally unique', () => {
    const allIds: string[] = []

    function collectIds(items: typeof NAVIGATION_ITEMS) {
      for (const item of items) {
        allIds.push(item.id)
        if (item.children) {
          collectIds(item.children)
        }
      }
    }

    collectIds(NAVIGATION_ITEMS)
    const uniqueIds = new Set(allIds)
    expect(allIds.length).toBe(uniqueIds.size)
  })

  it('guarantees all route names in route definitions are unique', () => {
    const names: string[] = []

    function collectRouteNames(routeList: RouteRecordRaw[]) {
      for (const r of routeList) {
        if (r.name) {
          names.push(String(r.name))
        }
        if (r.children) {
          collectRouteNames(r.children)
        }
      }
    }

    collectRouteNames(routes)
    const uniqueNames = new Set(names)
    expect(names.length).toBe(uniqueNames.size)
  })

  it('ensures all submenus have valid defined routes', () => {
    const allPaths: string[] = []

    function collectPaths(items: typeof NAVIGATION_ITEMS) {
      for (const item of items) {
        const path = item.route || item.path
        if (path) {
          allPaths.push(path)
        }
        if (item.children) {
          collectPaths(item.children)
        }
      }
    }

    collectPaths(NAVIGATION_ITEMS)

    // Flat list of defined routes (including children)
    const definedPaths: string[] = []
    function collectDefinedRoutePaths(routeList: RouteRecordRaw[]) {
      for (const r of routeList) {
        if (r.path) {
          definedPaths.push(r.path.startsWith('/') ? r.path : `/${r.path}`)
        }
        if (r.children) {
          collectDefinedRoutePaths(r.children)
        }
      }
    }
    collectDefinedRoutePaths(routes)

    allPaths.forEach(path => {
      expect(findNavigationItemByRoute(NAVIGATION_ITEMS, path)).not.toBeNull()
      expect(definedPaths).toContain(path)
    })
  })

  it('correctly determines active state and active parent menu', () => {
    const parentPenjualan = findActiveParentMenu(NAVIGATION_ITEMS, '/sales/orders/impact')
    expect(parentPenjualan).not.toBeNull()
    expect(parentPenjualan?.id).toBe('penjualan')
    expect(parentPenjualan?.label).toBe('Penjualan')

    const parentKeuangan = findActiveParentMenu(NAVIGATION_ITEMS, '/accounting/general-journal')
    expect(parentKeuangan?.id).toBe('keuangan')
    expect(parentKeuangan?.label).toBe('Keuangan')

    const parentPengadaan = findActiveParentMenu(NAVIGATION_ITEMS, '/procurement/suppliers')
    expect(parentPengadaan?.id).toBe('pengadaan')

    // Dashboard root
    const parentDashboard = findActiveParentMenu(NAVIGATION_ITEMS, '/dashboard')
    expect(parentDashboard?.id).toBe('dashboard')
  })

  it('correctly generates dynamic breadcrumb metadata for nested routes', () => {
    // 1. Dashboard root
    const bcDashboard = generateBreadcrumbData(NAVIGATION_ITEMS, '/dashboard')
    expect(bcDashboard).toHaveLength(1)
    expect(bcDashboard[0].label).toBe('Dashboard')
    expect(bcDashboard[0].current).toBe(true)

    // 2. Sales Order Impact
    const bcSales = generateBreadcrumbData(NAVIGATION_ITEMS, '/sales/orders/impact')
    expect(bcSales).toHaveLength(3)
    expect(bcSales[0].label).toBe('Dashboard')
    expect(bcSales[0].to).toBe('/dashboard')
    expect(bcSales[1].label).toBe('Penjualan')
    expect(bcSales[2].label).toBe('Sales Order (IMPACT)')
    expect(bcSales[2].current).toBe(true)

    // 3. Procurement Suppliers
    const bcProc = generateBreadcrumbData(NAVIGATION_ITEMS, '/procurement/suppliers')
    expect(bcProc).toHaveLength(3)
    expect(bcProc[1].label).toBe('Pengadaan')
    expect(bcProc[2].label).toBe('Master Data Suplier')
    expect(bcProc[2].current).toBe(true)
  })

  it('filters navigation items safely based on permission roles', () => {
    // Superadmin has '*' permission
    const all = filterNavigationItems(NAVIGATION_ITEMS, ['*'])
    expect(all).toHaveLength(11)

    // Limited role with only procurement permissions
    const restricted = filterNavigationItems(NAVIGATION_ITEMS, ['procurement:read'])
    expect(restricted).toHaveLength(1)
    expect(restricted[0].id).toBe('pengadaan')
    expect(restricted[0].children).toHaveLength(4)
  })

  it('correctly handles duplicate labels across different modules with unique routes and parents', () => {
    // Both Penjualan and Keuangan have a submenu called "Pemasukan Lain"
    const salesOtherIncome = findNavigationItemByRoute(NAVIGATION_ITEMS, '/sales/other-income')
    expect(salesOtherIncome).not.toBeNull()
    expect(salesOtherIncome?.label).toBe('Pemasukan Lain')
    expect(salesOtherIncome?.id).toBe('sales-other-income')

    const parentSales = findActiveParentMenu(NAVIGATION_ITEMS, '/sales/other-income')
    expect(parentSales?.id).toBe('penjualan')

    const accountingOtherIncome = findNavigationItemByRoute(
      NAVIGATION_ITEMS,
      '/accounting/other-income'
    )
    expect(accountingOtherIncome).not.toBeNull()
    expect(accountingOtherIncome?.label).toBe('Pemasukan Lain')
    expect(accountingOtherIncome?.id).toBe('accounting-other-income')

    const parentAccounting = findActiveParentMenu(NAVIGATION_ITEMS, '/accounting/other-income')
    expect(parentAccounting?.id).toBe('keuangan')

    // Confirm their paths and IDs are completely distinct
    expect(salesOtherIncome?.id).not.toBe(accountingOtherIncome?.id)
    expect(salesOtherIncome?.path).not.toBe(accountingOtherIncome?.path)

    // Check specific audited submenus
    const orderImpact = findNavigationItemByRoute(NAVIGATION_ITEMS, '/sales/orders/impact')
    const orderPola = findNavigationItemByRoute(NAVIGATION_ITEMS, '/sales/orders/pola')
    const orderKs = findNavigationItemByRoute(NAVIGATION_ITEMS, '/sales/orders/ks')
    expect(orderImpact?.label).toBe('Sales Order (IMPACT)')
    expect(orderPola?.label).toBe('Sales Order (POLA)')
    expect(orderKs?.label).toBe('Sales Order (KS)')
    expect(orderImpact?.id).not.toBe(orderPola?.id)
    expect(orderPola?.id).not.toBe(orderKs?.id)

    // Master Data Groups (Role) & Master Data User & Import Data
    const groups = findNavigationItemByRoute(NAVIGATION_ITEMS, '/system/groups')
    const users = findNavigationItemByRoute(NAVIGATION_ITEMS, '/system/users')
    const importData = findNavigationItemByRoute(NAVIGATION_ITEMS, '/system/import')
    expect(groups?.label).toBe('Master Data Groups (Role)')
    expect(users?.label).toBe('Master Data User')
    expect(importData?.label).toBe('Import Data')
  })

  it('routes unknown paths to the catch-all 404 route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    await router.push('/non-existent-erp-route')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('not-found')
    expect(router.currentRoute.value.meta.title).toContain('404')
  })

  it('handles direct navigation to any valid submenu URL with correct parent and breadcrumbs', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    await router.push('/sales/orders/pola')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/sales/orders/pola')
    expect(router.currentRoute.value.name).toBe('sales-orders-pola')

    const parent = findActiveParentMenu(NAVIGATION_ITEMS, '/sales/orders/pola')
    expect(parent?.id).toBe('penjualan')

    const breadcrumbs = generateBreadcrumbData(NAVIGATION_ITEMS, '/sales/orders/pola')
    expect(breadcrumbs.map(b => b.label)).toEqual(['Dashboard', 'Penjualan', 'Sales Order (POLA)'])
  })

  it('supports dropdown keyboard interaction and closing via Escape key', async () => {
    const pengadaanItem = NAVIGATION_ITEMS.find(i => i.id === 'pengadaan')!
    expect(pengadaanItem).toBeDefined()

    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    const wrapper = mount(AppNavigationDropdown, {
      props: {
        item: pengadaanItem,
        isOpen: true
      },
      global: {
        plugins: [router]
      }
    })

    const trigger = wrapper.find('button')
    expect(trigger.attributes('aria-expanded')).toBe('true')

    // Press Escape
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

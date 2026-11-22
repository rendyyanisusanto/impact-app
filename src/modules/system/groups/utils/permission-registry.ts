import type {
  MenuCategoryDefinition,
  DashboardWidgetDefinition,
  SubmenuPermissionFlag,
  GroupPermissionSummary
} from '../types/group.types'
import type { Permission, PermissionAction } from '@/shared/types/auth.types'

/**
 * Registry 3 Dashboard Widgets sesuai screenshot legacy
 */
export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    id: 1,
    name: 'All Top Spender',
    keterangan: 'Top 50 customer dengan akumulasi penjualan terbesar',
    column: 6
  },
  {
    id: 2,
    name: 'All Stock Limit',
    keterangan: 'Daftar bahan baku di bawah batas minimum stok',
    column: 6
  },
  {
    id: 3,
    name: 'Get Recent Mutation',
    keterangan: 'Log mutasi bahan terbaru secara real-time',
    column: 6
  }
]

const FULL_ACTIONS = { c: true, r: true, u: true, d: true }
const REPORT_ACTIONS = { c: true, r: true, u: false, d: false } // Laporan tidak mendukung Update & Delete

/**
 * Registry 10 Menu Kategori dan seluruh Submenu aplikasi sesuai legacy & V2 navigation
 */
export const MENU_REGISTRY: MenuCategoryDefinition[] = [
  {
    id: 1,
    name: 'Menu Pengadaan',
    submenus: [
      {
        id: 1,
        menuId: 1,
        name: 'Master Data Suplier',
        resource: 'procurement.suppliers',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 4,
        menuId: 1,
        name: 'Purchase Order',
        resource: 'procurement.purchase-orders',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 5,
        menuId: 1,
        name: 'Penerimaan Barang',
        resource: 'procurement.goods-receipts',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 6,
        menuId: 1,
        name: 'Pembayaran Tagihan',
        resource: 'procurement.bill-payments',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 2,
    name: 'Menu Persediaan',
    submenus: [
      {
        id: 29,
        menuId: 2,
        name: 'Master Data Bahan',
        resource: 'inventory.materials',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 30,
        menuId: 2,
        name: 'Master Data Produk',
        resource: 'inventory.products',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 31,
        menuId: 2,
        name: 'Penyesuaian Stok Bahan',
        resource: 'inventory.stock-adjustments',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 34,
        menuId: 2,
        name: 'Mutasi Bahan',
        resource: 'inventory.material-mutations',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 3,
    name: 'Menu Produksi',
    submenus: [
      {
        id: 7,
        menuId: 3,
        name: 'Proses Produksi',
        resource: 'production.orders',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 8,
        menuId: 3,
        name: 'Template Produk (BoM)',
        resource: 'production.bom',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 4,
    name: 'Menu Penjualan',
    submenus: [
      {
        id: 9,
        menuId: 4,
        name: 'Master Data Customer',
        resource: 'sales.customers',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 10,
        menuId: 4,
        name: 'Sales Order (IMPACT)',
        resource: 'sales.orders.impact',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 101,
        menuId: 4,
        name: 'Sales Order (POLA)',
        resource: 'sales.orders.pola',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 102,
        menuId: 4,
        name: 'Sales Order (KS)',
        resource: 'sales.orders.ks',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 11,
        menuId: 4,
        name: 'Pembayaran Invoice',
        resource: 'sales.invoice-payments',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 103,
        menuId: 4,
        name: 'Pemasukan Lain',
        resource: 'sales.other-income',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 5,
    name: 'Menu Pengiriman',
    submenus: [
      {
        id: 12,
        menuId: 5,
        name: 'Form Surat Jalan',
        resource: 'delivery.notes',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 6,
    name: 'Menu Keuangan',
    submenus: [
      {
        id: 13,
        menuId: 6,
        name: 'Chart Of Account',
        resource: 'accounting.chart-of-accounts',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 14,
        menuId: 6,
        name: 'Pemasukan Lain',
        resource: 'accounting.other-income',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 15,
        menuId: 6,
        name: 'Pengeluaran Lain',
        resource: 'accounting.other-expenses',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 194,
        menuId: 6,
        name: 'Jurnal Umum',
        resource: 'accounting.general-journal',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 7,
    name: 'Menu Laporan',
    submenus: [
      {
        id: 16,
        menuId: 7,
        name: 'Pembelian',
        resource: 'reporting.purchases',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 17,
        menuId: 7,
        name: 'Penjualan',
        resource: 'reporting.sales',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 221,
        menuId: 7,
        name: 'Laporan Per Produk',
        resource: 'reporting.per-product',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 227,
        menuId: 7,
        name: 'Laporan Per Customer',
        resource: 'reporting.per-customer',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 234,
        menuId: 7,
        name: 'Penjualan per Customer & Produk',
        resource: 'reporting.sales-by-customer-product',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 18,
        menuId: 7,
        name: 'Kartu Stok',
        resource: 'reporting.stock-card',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 19,
        menuId: 7,
        name: 'Laporan Mutasi Stok',
        resource: 'reporting.stock-mutations',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 256,
        menuId: 7,
        name: 'Laporan Stok Bahan',
        resource: 'reporting.material-stock',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 263,
        menuId: 7,
        name: 'Jurnal Harian',
        resource: 'reporting.daily-journal',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 22,
        menuId: 7,
        name: 'Neraca',
        resource: 'reporting.balance-sheet',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 23,
        menuId: 7,
        name: 'Laba Rugi',
        resource: 'reporting.income-statement',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 24,
        menuId: 7,
        name: 'Buku Besar',
        resource: 'reporting.general-ledger',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 290,
        menuId: 7,
        name: 'Statistic Sales',
        resource: 'reporting.statistic-sales',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 20,
        menuId: 7,
        name: 'Statistic Customer',
        resource: 'reporting.statistic-customer',
        allowedActions: REPORT_ACTIONS
      },
      {
        id: 304,
        menuId: 7,
        name: 'Statistic Driver',
        resource: 'reporting.statistic-driver',
        allowedActions: REPORT_ACTIONS
      }
    ]
  },
  {
    id: 8,
    name: 'Menu HR',
    submenus: [
      {
        id: 26,
        menuId: 8,
        name: 'Master Data Karyawan',
        resource: 'hr.employees',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 326,
        menuId: 8,
        name: 'Master Data Grup Karyawan',
        resource: 'hr.employee-groups',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 33,
        menuId: 8,
        name: 'Setting Jadwal',
        resource: 'hr.schedules',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 340,
        menuId: 8,
        name: 'Setting Hari Libur',
        resource: 'hr.holidays',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 27,
        menuId: 8,
        name: 'Presensi',
        resource: 'hr.attendance',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 9,
    name: 'Menu Setting',
    submenus: [
      {
        id: 360,
        menuId: 9,
        name: 'Master Data Bank',
        resource: 'settings.banks',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 367,
        menuId: 9,
        name: 'Master Data Gudang',
        resource: 'settings.warehouses',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 374,
        menuId: 9,
        name: 'Master Data Jabatan',
        resource: 'settings.positions',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 381,
        menuId: 9,
        name: 'Master Data Status Karyawan',
        resource: 'settings.employee-statuses',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 388,
        menuId: 9,
        name: 'Master Data Kategori Bahan',
        resource: 'settings.material-categories',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 395,
        menuId: 9,
        name: 'Master Data Kategori Barang/Produk',
        resource: 'settings.product-categories',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 402,
        menuId: 9,
        name: 'Master Data Satuan Bahan',
        resource: 'settings.material-units',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 409,
        menuId: 9,
        name: 'Master Data Satuan Produk',
        resource: 'settings.product-units',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 416,
        menuId: 9,
        name: 'Master Data PPN',
        resource: 'settings.tax',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 423,
        menuId: 9,
        name: 'Setting Aplikasi',
        resource: 'settings.app',
        allowedActions: FULL_ACTIONS
      }
    ]
  },
  {
    id: 10,
    name: 'Menu System Setting',
    submenus: [
      {
        id: 437,
        menuId: 10,
        name: 'Master Data Groups (Role)',
        resource: 'system.groups',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 444,
        menuId: 10,
        name: 'Master Data User',
        resource: 'system.users',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 451,
        menuId: 10,
        name: 'Setting Status',
        resource: 'system.status',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 458,
        menuId: 10,
        name: 'Import Data',
        resource: 'system.import',
        allowedActions: FULL_ACTIONS
      },
      {
        id: 465,
        menuId: 10,
        name: 'Edit Akun',
        resource: 'system.edit-account',
        allowedActions: FULL_ACTIONS
      }
    ]
  }
]

/**
 * Creates empty permissions map with all false
 */
export function createDefaultPermissions(): Record<string, SubmenuPermissionFlag> {
  const result: Record<string, SubmenuPermissionFlag> = {}
  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      result[String(sub.id)] = {
        c: false,
        r: false,
        u: false,
        d: false
      }
    }
  }
  return result
}

/**
 * Creates full permissions map for Superadmin with all allowed actions true
 */
export function createSuperadminPermissions(): Record<string, SubmenuPermissionFlag> {
  const result: Record<string, SubmenuPermissionFlag> = {}
  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      result[String(sub.id)] = {
        c: sub.allowedActions.c,
        r: sub.allowedActions.r,
        u: sub.allowedActions.u,
        d: sub.allowedActions.d
      }
    }
  }
  return result
}

/**
 * Calculates summary metrics for UX counters
 */
export function calculatePermissionSummary(
  permissions: Record<string, SubmenuPermissionFlag>,
  dashboardIds: (number | string)[] = []
): GroupPermissionSummary {
  let submenusWithReadCount = 0
  let createCount = 0
  let updateCount = 0
  let deleteCount = 0
  let totalSelectedFlags = 0

  const activeCategoryIds = new Set<string | number>()
  let totalSubmenusCount = 0

  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      totalSubmenusCount++
      const p = permissions[String(sub.id)]
      if (!p) continue

      let hasAnyInSub = false
      if (p.r && sub.allowedActions.r) {
        submenusWithReadCount++
        totalSelectedFlags++
        hasAnyInSub = true
      }
      if (p.c && sub.allowedActions.c) {
        createCount++
        totalSelectedFlags++
        hasAnyInSub = true
      }
      if (p.u && sub.allowedActions.u) {
        updateCount++
        totalSelectedFlags++
        hasAnyInSub = true
      }
      if (p.d && sub.allowedActions.d) {
        deleteCount++
        totalSelectedFlags++
        hasAnyInSub = true
      }

      if (hasAnyInSub) {
        activeCategoryIds.add(cat.id)
      }
    }
  }

  return {
    activeCategoriesCount: activeCategoryIds.size,
    totalCategoriesCount: MENU_REGISTRY.length,
    submenusWithReadCount,
    totalSubmenusCount,
    createCount,
    updateCount,
    deleteCount,
    totalSelectedFlags,
    dashboardWidgetsCount: dashboardIds.length
  }
}

/**
 * Serializes UI permissions map into V2 `Permission[]` array for `AuthUser.permissions`
 */
export function serializePermissionsToV2(
  permissions: Record<string, SubmenuPermissionFlag>
): Permission[] {
  const result: Permission[] = []

  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      const p = permissions[String(sub.id)]
      if (!p) continue

      const actions: PermissionAction[] = []
      if (p.c && sub.allowedActions.c) actions.push('create')
      if (p.r && sub.allowedActions.r) actions.push('read')
      if (p.u && sub.allowedActions.u) actions.push('update')
      if (p.d && sub.allowedActions.d) actions.push('delete')

      if (actions.length > 0) {
        result.push({
          resource: sub.resource,
          actions
        })
      }
    }
  }

  return result
}

/**
 * Helper to find submenu definition by ID
 */
export function findSubmenuById(id: number | string) {
  for (const cat of MENU_REGISTRY) {
    for (const sub of cat.submenus) {
      if (String(sub.id) === String(id)) return { category: cat, submenu: sub }
    }
  }
  return null
}


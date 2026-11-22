import type { NavigationItem } from './navigation.types'

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    path: '/dashboard',
    permission: 'dashboard:read'
  },
  {
    id: 'pengadaan',
    label: 'Pengadaan',
    permission: 'procurement:read',
    children: [
      {
        id: 'procurement-suppliers',
        label: 'Master Data Suplier',
        route: '/procurement/suppliers',
        path: '/procurement/suppliers',
        permission: 'procurement:read'
      },
      {
        id: 'procurement-purchase-orders',
        label: 'Purchase Order',
        route: '/procurement/purchase-orders',
        path: '/procurement/purchase-orders',
        permission: 'procurement:read'
      },
      {
        id: 'procurement-goods-receipts',
        label: 'Penerimaan Barang',
        route: '/procurement/goods-receipts',
        path: '/procurement/goods-receipts',
        permission: 'procurement:read'
      },
      {
        id: 'procurement-bill-payments',
        label: 'Pembayaran Tagihan',
        route: '/procurement/bill-payments',
        path: '/procurement/bill-payments',
        permission: 'procurement:read'
      }
    ]
  },
  {
    id: 'persediaan',
    label: 'Persediaan',
    permission: 'inventory:read',
    children: [
      {
        id: 'inventory-materials',
        label: 'Master Data Bahan',
        route: '/inventory/materials',
        path: '/inventory/materials',
        permission: 'inventory:read'
      },
      {
        id: 'inventory-products',
        label: 'Master Data Produk',
        route: '/inventory/products',
        path: '/inventory/products',
        permission: 'inventory:read'
      },
      {
        id: 'inventory-stock-adjustments',
        label: 'Penyesuaian Stok Bahan',
        route: '/inventory/stock-adjustments',
        path: '/inventory/stock-adjustments',
        permission: 'inventory:read'
      },
      {
        id: 'inventory-material-mutations',
        label: 'Mutasi Bahan',
        route: '/inventory/material-mutations',
        path: '/inventory/material-mutations',
        permission: 'inventory:read'
      }
    ]
  },
  {
    id: 'produksi',
    label: 'Produksi',
    permission: 'production:read',
    children: [
      {
        id: 'production-orders',
        label: 'Proses Produksi',
        route: '/production/orders',
        path: '/production/orders',
        permission: 'production:read'
      },
      {
        id: 'production-bom',
        label: 'Template Produk (BoM)',
        route: '/production/bom',
        path: '/production/bom',
        permission: 'production:read'
      }
    ]
  },
  {
    id: 'penjualan',
    label: 'Penjualan',
    permission: 'sales:read',
    children: [
      {
        id: 'sales-customers',
        label: 'Master Data Customer',
        route: '/sales/customers',
        path: '/sales/customers',
        permission: 'sales:read'
      },
      {
        id: 'sales-orders-impact',
        label: 'Sales Order (IMPACT)',
        route: '/sales/orders/impact',
        path: '/sales/orders/impact',
        permission: 'sales:read'
      },
      {
        id: 'sales-orders-pola',
        label: 'Sales Order (POLA)',
        route: '/sales/orders/pola',
        path: '/sales/orders/pola',
        permission: 'sales:read'
      },
      {
        id: 'sales-orders-ks',
        label: 'Sales Order (KS)',
        route: '/sales/orders/ks',
        path: '/sales/orders/ks',
        permission: 'sales:read'
      },
      {
        id: 'sales-invoice-payments',
        label: 'Pembayaran Invoice',
        route: '/sales/invoice-payments',
        path: '/sales/invoice-payments',
        permission: 'sales:read'
      },
      {
        id: 'sales-other-income',
        label: 'Pemasukan Lain',
        route: '/sales/other-income',
        path: '/sales/other-income',
        permission: 'sales:read'
      }
    ]
  },
  {
    id: 'pengiriman',
    label: 'Pengiriman',
    permission: 'delivery:read',
    children: [
      {
        id: 'delivery-notes',
        label: 'Form Surat Jalan',
        route: '/delivery/notes',
        path: '/delivery/notes',
        permission: 'delivery:read'
      }
    ]
  },
  {
    id: 'keuangan',
    label: 'Keuangan',
    permission: 'accounting:read',
    children: [
      {
        id: 'accounting-chart-of-accounts',
        label: 'Chart Of Account',
        route: '/accounting/chart-of-accounts',
        path: '/accounting/chart-of-accounts',
        permission: 'accounting:read'
      },
      {
        id: 'accounting-other-income',
        label: 'Pemasukan Lain',
        route: '/accounting/other-income',
        path: '/accounting/other-income',
        permission: 'accounting:read'
      },
      {
        id: 'accounting-other-expenses',
        label: 'Pengeluaran Lain',
        route: '/accounting/other-expenses',
        path: '/accounting/other-expenses',
        permission: 'accounting:read'
      },
      {
        id: 'accounting-general-journal',
        label: 'Jurnal Umum',
        route: '/accounting/general-journal',
        path: '/accounting/general-journal',
        permission: 'accounting:read'
      }
    ]
  },
  {
    id: 'laporan',
    label: 'Laporan',
    permission: 'reporting:read',
    children: [
      {
        id: 'reporting-purchases',
        label: 'Pembelian',
        route: '/reporting/purchases',
        path: '/reporting/purchases',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-sales',
        label: 'Penjualan',
        route: '/reporting/sales',
        path: '/reporting/sales',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-per-product',
        label: 'Laporan Per Produk',
        route: '/reporting/per-product',
        path: '/reporting/per-product',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-per-customer',
        label: 'Laporan Per Customer',
        route: '/reporting/per-customer',
        path: '/reporting/per-customer',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-sales-by-customer-product',
        label: 'Penjualan per Customer & Produk',
        route: '/reporting/sales-by-customer-product',
        path: '/reporting/sales-by-customer-product',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-stock-card',
        label: 'Kartu Stok',
        route: '/reporting/stock-card',
        path: '/reporting/stock-card',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-stock-mutations',
        label: 'Laporan Mutasi Stok',
        route: '/reporting/stock-mutations',
        path: '/reporting/stock-mutations',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-material-stock',
        label: 'Laporan Stok Bahan',
        route: '/reporting/material-stock',
        path: '/reporting/material-stock',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-daily-journal',
        label: 'Jurnal Harian',
        route: '/reporting/daily-journal',
        path: '/reporting/daily-journal',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-balance-sheet',
        label: 'Neraca',
        route: '/reporting/balance-sheet',
        path: '/reporting/balance-sheet',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-income-statement',
        label: 'Laba Rugi',
        route: '/reporting/income-statement',
        path: '/reporting/income-statement',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-general-ledger',
        label: 'Buku Besar',
        route: '/reporting/general-ledger',
        path: '/reporting/general-ledger',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-statistic-sales',
        label: 'Statistic Sales',
        route: '/reporting/statistic-sales',
        path: '/reporting/statistic-sales',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-statistic-customer',
        label: 'Statistic Customer',
        route: '/reporting/statistic-customer',
        path: '/reporting/statistic-customer',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-statistic-driver',
        label: 'Statistic Driver',
        route: '/reporting/statistic-driver',
        path: '/reporting/statistic-driver',
        permission: 'reporting:read'
      }
    ]
  },
  {
    id: 'hr',
    label: 'HR',
    permission: 'hr:read',
    children: [
      {
        id: 'hr-employees',
        label: 'Master Data Karyawan',
        route: '/hr/employees',
        path: '/hr/employees',
        permission: 'hr:read'
      },
      {
        id: 'hr-employee-groups',
        label: 'Master Data Grup Karyawan',
        route: '/hr/employee-groups',
        path: '/hr/employee-groups',
        permission: 'hr:read'
      },
      {
        id: 'hr-schedules',
        label: 'Setting Jadwal',
        route: '/hr/schedules',
        path: '/hr/schedules',
        permission: 'hr:read'
      },
      {
        id: 'hr-holidays',
        label: 'Setting Hari Libur',
        route: '/hr/holidays',
        path: '/hr/holidays',
        permission: 'hr:read'
      },
      {
        id: 'hr-attendance',
        label: 'Presensi',
        route: '/hr/attendance',
        path: '/hr/attendance',
        permission: 'hr:read'
      }
    ]
  },
  {
    id: 'setting',
    label: 'Setting',
    permission: 'settings:read',
    children: [
      {
        id: 'settings-banks',
        label: 'Master Data Bank',
        route: '/settings/banks',
        path: '/settings/banks',
        permission: 'settings:read'
      },
      {
        id: 'settings-warehouses',
        label: 'Master Data Gudang',
        route: '/settings/warehouses',
        path: '/settings/warehouses',
        permission: 'settings:read'
      },
      {
        id: 'settings-positions',
        label: 'Master Data Jabatan',
        route: '/settings/positions',
        path: '/settings/positions',
        permission: 'settings:read'
      },
      {
        id: 'settings-employee-statuses',
        label: 'Master Data Status Karyawan',
        route: '/settings/employee-statuses',
        path: '/settings/employee-statuses',
        permission: 'settings:read'
      },
      {
        id: 'settings-material-categories',
        label: 'Master Data Kategori Bahan',
        route: '/settings/material-categories',
        path: '/settings/material-categories',
        permission: 'settings:read'
      },
      {
        id: 'settings-product-categories',
        label: 'Master Data Kategori Barang/Produk',
        route: '/settings/product-categories',
        path: '/settings/product-categories',
        permission: 'settings:read'
      },
      {
        id: 'settings-material-units',
        label: 'Master Data Satuan Bahan',
        route: '/settings/material-units',
        path: '/settings/material-units',
        permission: 'settings:read'
      },
      {
        id: 'settings-product-units',
        label: 'Master Data Satuan Produk',
        route: '/settings/product-units',
        path: '/settings/product-units',
        permission: 'settings:read'
      },
      {
        id: 'settings-tax',
        label: 'Master Data PPN',
        route: '/settings/tax',
        path: '/settings/tax',
        permission: 'settings:read'
      },
      {
        id: 'settings-app',
        label: 'Setting Aplikasi',
        route: '/settings/app',
        path: '/settings/app',
        permission: 'settings:read'
      }
    ]
  },
  {
    id: 'system',
    label: 'System Setting',
    permission: 'system:read',
    children: [
      {
        id: 'system-groups',
        label: 'Master Data Groups (Role)',
        route: '/system/groups',
        path: '/system/groups',
        permission: 'system:read'
      },
      {
        id: 'system-users',
        label: 'Master Data User',
        route: '/system/users',
        path: '/system/users',
        permission: 'system:read'
      },
      {
        id: 'system-status',
        label: 'Setting Status',
        route: '/system/status',
        path: '/system/status',
        permission: 'system:read'
      },
      {
        id: 'system-import',
        label: 'Import Data',
        route: '/system/import',
        path: '/system/import',
        permission: 'system:read'
      },
      {
        id: 'system-edit-account',
        label: 'Edit Akun',
        route: '/system/edit-account',
        path: '/system/edit-account',
        permission: 'system:read'
      },
      {
        id: 'system-monitoring-dashboard',
        label: 'Monitoring Dashboard',
        route: '/system/monitoring-dashboard',
        path: '/system/monitoring-dashboard',
        permission: 'system:read'
      },
      {
        id: 'system-audit-trail',
        label: 'Audit Trail',
        route: '/system/audit-trail',
        path: '/system/audit-trail',
        permission: 'system:read'
      },
      {
        id: 'system-error-monitoring',
        label: 'Error Tracking',
        route: '/system/error-monitoring',
        path: '/system/error-monitoring',
        permission: 'system:read'
      },
      {
        id: 'system-bug-reports',
        label: 'Laporan Bug & Masalah',
        route: '/system/bug-reports',
        path: '/system/bug-reports',
        permission: 'system:read'
      }
    ]
  }
]

export default NAVIGATION_ITEMS

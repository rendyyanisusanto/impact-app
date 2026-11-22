import type { NavigationItem } from '@/shared/types/navigation.types'

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
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
        path: '/procurement/suppliers',
        permission: 'procurement:read'
      },
      {
        id: 'procurement-po',
        label: 'Purchase Order',
        path: '/procurement/purchase-orders',
        permission: 'procurement:read'
      },
      {
        id: 'procurement-receiving',
        label: 'Penerimaan Barang',
        path: '/procurement/receiving',
        permission: 'procurement:read'
      },
      {
        id: 'procurement-bills',
        label: 'Pembayaran Tagihan',
        path: '/procurement/bills',
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
        path: '/inventory/materials',
        permission: 'inventory:read'
      },
      {
        id: 'inventory-products',
        label: 'Master Data Produk',
        path: '/inventory/products',
        permission: 'inventory:read'
      },
      {
        id: 'inventory-adjustments',
        label: 'Penyesuaian Stok Bahan',
        path: '/inventory/stock-adjustments',
        permission: 'inventory:read'
      },
      {
        id: 'inventory-mutations',
        label: 'Mutasi Bahan',
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
        path: '/production/orders',
        permission: 'production:read'
      },
      {
        id: 'production-bom',
        label: 'Template Produk (BoM)',
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
        path: '/sales/customers',
        permission: 'sales:read'
      },
      {
        id: 'sales-orders-impact',
        label: 'Sales Order (IMPACT)',
        path: '/sales/orders/impact',
        permission: 'sales:read'
      },
      {
        id: 'sales-orders-pola',
        label: 'Sales Order (POLA)',
        path: '/sales/orders/pola',
        permission: 'sales:read'
      },
      {
        id: 'sales-orders-ks',
        label: 'Sales Order (KS)',
        path: '/sales/orders/ks',
        permission: 'sales:read'
      },
      {
        id: 'sales-invoice-payments',
        label: 'Pembayaran Invoice',
        path: '/sales/invoice-payments',
        permission: 'sales:read'
      },
      {
        id: 'sales-other-income',
        label: 'Pemasukan Lain',
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
        id: 'accounting-coa',
        label: 'Chart Of Account',
        path: '/accounting/chart-of-accounts',
        permission: 'accounting:read'
      },
      {
        id: 'accounting-other-income',
        label: 'Pemasukan Lain',
        path: '/accounting/other-income',
        permission: 'accounting:read'
      },
      {
        id: 'accounting-other-expenses',
        label: 'Pengeluaran Lain',
        path: '/accounting/other-expenses',
        permission: 'accounting:read'
      },
      {
        id: 'accounting-general-ledger-journal',
        label: 'Jurnal Umum',
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
        path: '/reporting/purchases',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-sales',
        label: 'Penjualan',
        path: '/reporting/sales',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-per-product',
        label: 'Laporan Per Produk',
        path: '/reporting/per-product',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-per-customer',
        label: 'Laporan Per Customer',
        path: '/reporting/per-customer',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-sales-by-customer-product',
        label: 'Penjualan per Customer & Produk',
        path: '/reporting/sales-by-customer-product',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-stock-card',
        label: 'Kartu Stok',
        path: '/reporting/stock-card',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-stock-mutation',
        label: 'Laporan Mutasi Stok',
        path: '/reporting/stock-mutations',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-material-stock',
        label: 'Laporan Stok Bahan',
        path: '/reporting/material-stock',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-daily-journal',
        label: 'Jurnal Harian',
        path: '/reporting/daily-journal',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-balance-sheet',
        label: 'Neraca',
        path: '/reporting/balance-sheet',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-income-statement',
        label: 'Laba Rugi',
        path: '/reporting/income-statement',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-general-ledger',
        label: 'Buku Besar',
        path: '/reporting/general-ledger',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-sales-stats',
        label: 'Statistic Sales',
        path: '/reporting/statistic-sales',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-customer-stats',
        label: 'Statistic Customer',
        path: '/reporting/statistic-customer',
        permission: 'reporting:read'
      },
      {
        id: 'reporting-driver-stats',
        label: 'Statistic Driver',
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
        path: '/hr/employees',
        permission: 'hr:read'
      },
      {
        id: 'hr-employee-groups',
        label: 'Master Data Grup Karyawan',
        path: '/hr/employee-groups',
        permission: 'hr:read'
      },
      {
        id: 'hr-schedules',
        label: 'Setting Jadwal',
        path: '/hr/schedules',
        permission: 'hr:read'
      },
      {
        id: 'hr-holidays',
        label: 'Setting Hari Libur',
        path: '/hr/holidays',
        permission: 'hr:read'
      },
      {
        id: 'hr-attendance',
        label: 'Presensi',
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
        id: 'setting-banks',
        label: 'Master Data Bank',
        path: '/settings/banks',
        permission: 'settings:read'
      },
      {
        id: 'setting-warehouses',
        label: 'Master Data Gudang',
        path: '/settings/warehouses',
        permission: 'settings:read'
      },
      {
        id: 'setting-positions',
        label: 'Master Data Jabatan',
        path: '/settings/positions',
        permission: 'settings:read'
      },
      {
        id: 'setting-employee-status',
        label: 'Master Data Status Karyawan',
        path: '/settings/employee-statuses',
        permission: 'settings:read'
      },
      {
        id: 'setting-material-categories',
        label: 'Master Data Kategori Bahan',
        path: '/settings/material-categories',
        permission: 'settings:read'
      },
      {
        id: 'setting-product-categories',
        label: 'Master Data Kategori Barang/Produk',
        path: '/settings/product-categories',
        permission: 'settings:read'
      },
      {
        id: 'setting-material-units',
        label: 'Master Data Satuan Bahan',
        path: '/settings/material-units',
        permission: 'settings:read'
      },
      {
        id: 'setting-product-units',
        label: 'Master Data Satuan Produk',
        path: '/settings/product-units',
        permission: 'settings:read'
      },
      {
        id: 'setting-tax',
        label: 'Master Data PPN',
        path: '/settings/tax',
        permission: 'settings:read'
      },
      {
        id: 'setting-app',
        label: 'Setting Aplikasi',
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
        path: '/system/groups',
        permission: 'system:read'
      },
      {
        id: 'system-users',
        label: 'Master Data User',
        path: '/system/users',
        permission: 'system:read'
      },
      {
        id: 'system-status',
        label: 'Setting Status',
        path: '/system/status',
        permission: 'system:read'
      },
      {
        id: 'system-import',
        label: 'Import Data',
        path: '/system/import',
        permission: 'system:read'
      },
      {
        id: 'system-edit-account',
        label: 'Edit Akun',
        path: '/system/edit-account',
        permission: 'system:read'
      }
    ]
  }
]

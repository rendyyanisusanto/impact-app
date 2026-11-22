import type { RouteRecordRaw } from 'vue-router'

const placeholder = () => import('@/shared/pages/ModulePlaceholderPage.vue')

export const mainAppRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/',
    component: () => import('@/app/layouts/AppLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
        meta: { title: 'Dashboard', module: 'Dashboard' }
      },
      /* Pengadaan */
      {
        path: 'procurement/suppliers',
        name: 'procurement-suppliers',
        component: () => import('@/modules/procurement/suppliers/pages/SupplierListPage.vue'),
        meta: { title: 'Master Data Suplier', module: 'Pengadaan', permission: 'procurement:read' }
      },
      {
        path: 'procurement/purchase-orders',
        name: 'procurement-purchase-orders',
        component: () =>
          import('@/modules/procurement/purchase-orders/pages/PurchaseOrderListPage.vue'),
        meta: { title: 'Purchase Order', module: 'Pengadaan', permission: 'procurement:read' }
      },
      {
        path: 'procurement/purchase-orders/create',
        name: 'procurement-purchase-orders-create',
        component: () =>
          import('@/modules/procurement/purchase-orders/pages/PurchaseOrderCreatePage.vue'),
        meta: {
          title: 'Tambah Purchase Order',
          module: 'Pengadaan',
          permission: 'procurement:create'
        }
      },
      {
        path: 'procurement/purchase-orders/:id/edit',
        name: 'procurement-purchase-orders-edit',
        component: () =>
          import('@/modules/procurement/purchase-orders/pages/PurchaseOrderEditPage.vue'),
        meta: {
          title: 'Edit Purchase Order',
          module: 'Pengadaan',
          permission: 'procurement:update'
        }
      },
      {
        path: 'procurement/purchase-orders/:id',
        name: 'procurement-purchase-orders-detail',
        component: placeholder,
        meta: {
          title: 'Detail Purchase Order',
          module: 'Pengadaan',
          permission: 'procurement:read'
        }
      },
      {
        path: 'procurement/goods-receipts',
        name: 'procurement-goods-receipts',
        component: () =>
          import('@/modules/procurement/goods-receipts/pages/GoodsReceiptListPage.vue'),
        meta: { title: 'Penerimaan Barang', module: 'Pengadaan', permission: 'procurement:read' }
      },
      {
        path: 'procurement/goods-receipts/create',
        name: 'procurement-goods-receipts-create',
        component: () =>
          import('@/modules/procurement/goods-receipts/pages/GoodsReceiptCreatePage.vue'),
        meta: {
          title: 'Tambah Penerimaan Barang',
          module: 'Pengadaan',
          permission: 'procurement:create'
        }
      },
      {
        path: 'procurement/goods-receipts/:id/edit',
        name: 'procurement-goods-receipts-edit',
        component: () =>
          import('@/modules/procurement/goods-receipts/pages/GoodsReceiptEditPage.vue'),
        meta: {
          title: 'Edit Penerimaan Barang',
          module: 'Pengadaan',
          permission: 'procurement:update'
        }
      },
      {
        path: 'procurement/goods-receipts/:id',
        name: 'procurement-goods-receipts-detail',
        component: () =>
          import('@/modules/procurement/goods-receipts/pages/GoodsReceiptDetailPage.vue'),
        meta: {
          title: 'Detail Penerimaan Barang',
          module: 'Pengadaan',
          permission: 'procurement:read'
        }
      },
      {
        path: 'procurement/bill-payments',
        name: 'procurement-bill-payments',
        component: () =>
          import('@/modules/procurement/bill-payments/pages/BillPaymentListPage.vue'),
        meta: { title: 'Pembayaran Tagihan', module: 'Pengadaan', permission: 'procurement:read' }
      },
      {
        path: 'procurement/bill-payments/create',
        name: 'procurement-bill-payments-create',
        component: () =>
          import('@/modules/procurement/bill-payments/pages/BillPaymentCreatePage.vue'),
        meta: {
          title: 'Tambah Pembayaran Tagihan',
          module: 'Pengadaan',
          permission: 'procurement:create'
        }
      },
      {
        path: 'procurement/bill-payments/:id/edit',
        name: 'procurement-bill-payments-edit',
        component: () =>
          import('@/modules/procurement/bill-payments/pages/BillPaymentEditPage.vue'),
        meta: {
          title: 'Edit Pembayaran Tagihan',
          module: 'Pengadaan',
          permission: 'procurement:update'
        }
      },
      {
        path: 'procurement/bill-payments/:id',
        name: 'procurement-bill-payments-detail',
        component: () =>
          import('@/modules/procurement/bill-payments/pages/BillPaymentDetailPage.vue'),
        meta: {
          title: 'Detail Pembayaran Tagihan',
          module: 'Pengadaan',
          permission: 'procurement:read'
        }
      },
      /* Compatibility redirects for legacy tests/links */
      {
        path: 'procurement/receiving',
        redirect: '/procurement/goods-receipts'
      },
      {
        path: 'procurement/bills',
        redirect: '/procurement/bill-payments'
      },

      /* Persediaan */
      {
        path: 'inventory/materials',
        name: 'inventory-materials',
        component: () => import('@/modules/inventory/materials/pages/MaterialListPage.vue'),
        meta: { title: 'Master Data Bahan', module: 'Persediaan', permission: 'inventory:read' }
      },
      {
        path: 'inventory/products',
        name: 'inventory-products',
        component: () => import('@/modules/inventory/products/pages/ProductListPage.vue'),
        meta: { title: 'Master Data Produk', module: 'Persediaan', permission: 'inventory:read' }
      },
      {
        path: 'inventory/stock-adjustments',
        name: 'inventory-stock-adjustments',
        component: () =>
          import('@/modules/inventory/stock-adjustments/pages/StockAdjustmentListPage.vue'),
        meta: {
          title: 'Penyesuaian Stok Bahan',
          module: 'Persediaan',
          permission: 'inventory:read'
        }
      },
      {
        path: 'inventory/stock-adjustments/create',
        name: 'inventory-stock-adjustments-create',
        component: () =>
          import('@/modules/inventory/stock-adjustments/pages/StockAdjustmentCreatePage.vue'),
        meta: {
          title: 'Tambah Penyesuaian Stok',
          module: 'Persediaan',
          permission: 'inventory:create'
        }
      },
      {
        path: 'inventory/stock-adjustments/:id/edit',
        name: 'inventory-stock-adjustments-edit',
        component: () =>
          import('@/modules/inventory/stock-adjustments/pages/StockAdjustmentEditPage.vue'),
        meta: {
          title: 'Edit Penyesuaian Stok',
          module: 'Persediaan',
          permission: 'inventory:update'
        }
      },
      {
        path: 'inventory/stock-adjustments/:id',
        name: 'inventory-stock-adjustments-detail',
        component: () =>
          import('@/modules/inventory/stock-adjustments/pages/StockAdjustmentDetailPage.vue'),
        meta: {
          title: 'Detail Penyesuaian Stok',
          module: 'Persediaan',
          permission: 'inventory:read'
        }
      },
      {
        path: 'inventory/material-mutations',
        name: 'inventory-material-mutations',
        component: () =>
          import('@/modules/inventory/material-mutations/pages/MaterialMutationListPage.vue'),
        meta: { title: 'Mutasi Bahan', module: 'Persediaan', permission: 'inventory:read' }
      },
      {
        path: 'inventory/material-mutations/create',
        name: 'inventory-material-mutations-create',
        component: () =>
          import('@/modules/inventory/material-mutations/pages/MaterialMutationCreatePage.vue'),
        meta: {
          title: 'Tambah Mutasi Bahan',
          module: 'Persediaan',
          permission: 'inventory:create'
        }
      },
      {
        path: 'inventory/material-mutations/:id/edit',
        name: 'inventory-material-mutations-edit',
        component: () =>
          import('@/modules/inventory/material-mutations/pages/MaterialMutationEditPage.vue'),
        meta: {
          title: 'Edit Mutasi Bahan',
          module: 'Persediaan',
          permission: 'inventory:update'
        }
      },
      {
        path: 'inventory/material-mutations/:id',
        name: 'inventory-material-mutations-detail',
        component: () =>
          import('@/modules/inventory/material-mutations/pages/MaterialMutationDetailPage.vue'),
        meta: {
          title: 'Detail Mutasi Bahan',
          module: 'Persediaan',
          permission: 'inventory:read'
        }
      },

      /* Produksi */
      {
        path: 'production/orders',
        name: 'production-orders',
        component: () => import('@/modules/production/pages/ProductionListPage.vue'),
        meta: {
          title: 'Proses Produksi',
          module: 'Produksi',
          permission: 'production:read'
        }
      },
      {
        path: 'production/orders/create',
        name: 'production-orders-create',
        component: () => import('@/modules/production/pages/ProductionCreatePage.vue'),
        meta: {
          title: 'Tambah Produksi',
          module: 'Produksi',
          permission: 'production:create'
        }
      },
      {
        path: 'production/orders/:id/edit',
        name: 'production-orders-edit',
        component: () => import('@/modules/production/pages/ProductionEditPage.vue'),
        meta: {
          title: 'Edit Produksi',
          module: 'Produksi',
          permission: 'production:update'
        }
      },
      {
        path: 'production/orders/:id',
        name: 'production-orders-detail',
        component: () => import('@/modules/production/pages/ProductionDetailPage.vue'),
        meta: {
          title: 'Detail Produksi',
          module: 'Produksi',
          permission: 'production:read'
        }
      },
      {
        path: 'production/transactions',
        redirect: '/production/orders'
      },
      {
        path: 'production/transactions/create',
        redirect: '/production/orders/create'
      },
      {
        path: 'production/transactions/:id/edit',
        redirect: to => `/production/orders/${to.params.id}/edit`
      },
      {
        path: 'production/transactions/:id',
        redirect: to => `/production/orders/${to.params.id}`
      },
      {
        path: 'production/bom',
        name: 'production-bom',
        component: () => import('@/modules/production/pages/BomListPage.vue'),
        meta: {
          title: 'Template Produk (BoM)',
          module: 'Produksi',
          permission: 'production:read'
        }
      },
      {
        path: 'production/bom/create',
        name: 'production-bom-create',
        component: () => import('@/modules/production/pages/BomCreatePage.vue'),
        meta: {
          title: 'Tambah Template Produk',
          module: 'Produksi',
          permission: 'production:create'
        }
      },
      {
        path: 'production/bom/:id/edit',
        name: 'production-bom-edit',
        component: () => import('@/modules/production/pages/BomEditPage.vue'),
        meta: {
          title: 'Edit Template Produk',
          module: 'Produksi',
          permission: 'production:update'
        }
      },
      {
        path: 'production/bom/:id',
        name: 'production-bom-detail',
        component: () => import('@/modules/production/pages/BomDetailPage.vue'),
        meta: {
          title: 'Detail Template Produk',
          module: 'Produksi',
          permission: 'production:read'
        }
      },

      /* Penjualan */
      {
        path: 'sales/customers',
        name: 'sales-customers',
        component: () => import('@/modules/sales/customers/pages/CustomerListPage.vue'),
        meta: { title: 'Master Data Customer', module: 'Penjualan', permission: 'sales:read' }
      },
      /* Penjualan — SO Impact (PPN) */
      {
        path: 'sales/so-impact',
        name: 'sales-orders-so-impact',
        component: () => import('@/modules/sales/pages/SalesOrderListPage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Sales Order Impact', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/orders/impact',
        name: 'sales-orders-impact',
        component: () => import('@/modules/sales/pages/SalesOrderListPage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Sales Order (IMPACT)', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-impact/create',
        name: 'sales-orders-impact-create',
        component: () => import('@/modules/sales/pages/SalesOrderCreatePage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Tambah SO Impact', module: 'Penjualan', permission: 'sales:create' }
      },
      {
        path: 'sales/so-impact/:id',
        name: 'sales-orders-impact-detail',
        component: () => import('@/modules/sales/pages/SalesOrderDetailPage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Detail SO Impact', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-impact/:id/edit',
        name: 'sales-orders-impact-edit',
        component: () => import('@/modules/sales/pages/SalesOrderEditPage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Edit SO Impact', module: 'Penjualan', permission: 'sales:update' }
      },
      {
        path: 'sales/so-impact/:id/nota',
        name: 'sales-orders-impact-nota',
        component: () => import('@/modules/sales/pages/SalesOrderNotaPage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Nota SO Impact', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-impact/:id/print',
        name: 'sales-orders-impact-print',
        component: () => import('@/modules/sales/pages/SalesOrderPrintPage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Cetak Faktur SO Impact', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-impact/:id/invoices',
        name: 'sales-orders-impact-invoices',
        component: () => import('@/modules/sales/pages/SalesInvoicePage.vue'),
        props: { variant: 'impact' },
        meta: { title: 'Sales Invoice SO Impact', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-impact/:id/invoices/:invoiceId/payments',
        name: 'sales-orders-impact-invoice-payments',
        component: () => import('@/modules/sales/pages/SalesInvoicePaymentPage.vue'),
        props: { variant: 'impact' },
        meta: {
          title: 'Pembayaran Invoice SO Impact',
          module: 'Penjualan',
          permission: 'sales:read'
        }
      },
      {
        path: 'sales/orders/impact/:id/invoices',
        redirect: to => `/sales/so-impact/${to.params.id}/invoices`
      },
      {
        path: 'sales/orders/:id',
        redirect: to => `/sales/so-impact/${to.params.id}`
      },

      /* Penjualan — SO Pola (Non-PPN) */
      {
        path: 'sales/so-pola',
        name: 'sales-orders-so-pola',
        component: () => import('@/modules/sales/pages/SalesOrderListPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Sales Order Pola', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/orders/pola',
        name: 'sales-orders-pola',
        component: () => import('@/modules/sales/pages/SalesOrderListPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Sales Order (POLA)', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-pola/create',
        name: 'sales-orders-pola-create',
        component: () => import('@/modules/sales/pages/SalesOrderCreatePage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Tambah SO Pola', module: 'Penjualan', permission: 'sales:create' }
      },
      {
        path: 'sales/so-pola/:id',
        name: 'sales-orders-pola-detail',
        component: () => import('@/modules/sales/pages/SalesOrderDetailPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Detail SO Pola', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-pola/:id/edit',
        name: 'sales-orders-pola-edit',
        component: () => import('@/modules/sales/pages/SalesOrderEditPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Edit SO Pola', module: 'Penjualan', permission: 'sales:update' }
      },
      {
        path: 'sales/so-pola/:id/nota',
        name: 'sales-orders-pola-nota',
        component: () => import('@/modules/sales/pages/SalesOrderNotaPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Nota SO Pola', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-pola/:id/print',
        name: 'sales-orders-pola-print',
        component: () => import('@/modules/sales/pages/SalesOrderPrintPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Cetak Faktur SO Pola', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-pola/:id/invoices',
        name: 'sales-orders-pola-invoices',
        component: () => import('@/modules/sales/pages/SalesInvoicePage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Sales Invoice SO Pola', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-pola/:id/invoices/:invoiceId/payments',
        name: 'sales-orders-pola-invoice-payments',
        component: () => import('@/modules/sales/pages/SalesInvoicePaymentPage.vue'),
        props: { variant: 'pola' },
        meta: { title: 'Pembayaran Invoice SO Pola', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/orders/pola/:id/invoices',
        redirect: to => `/sales/so-pola/${to.params.id}/invoices`
      },

      /* Penjualan — SO KS (Non-PPN) */
      {
        path: 'sales/so-ks',
        name: 'sales-orders-so-ks',
        component: () => import('@/modules/sales/pages/SalesOrderListPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Sales Order KS', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/orders/ks',
        name: 'sales-orders-ks',
        component: () => import('@/modules/sales/pages/SalesOrderListPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Sales Order (KS)', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-ks/create',
        name: 'sales-orders-ks-create',
        component: () => import('@/modules/sales/pages/SalesOrderCreatePage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Tambah SO KS', module: 'Penjualan', permission: 'sales:create' }
      },
      {
        path: 'sales/so-ks/:id',
        name: 'sales-orders-ks-detail',
        component: () => import('@/modules/sales/pages/SalesOrderDetailPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Detail SO KS', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-ks/:id/edit',
        name: 'sales-orders-ks-edit',
        component: () => import('@/modules/sales/pages/SalesOrderEditPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Edit SO KS', module: 'Penjualan', permission: 'sales:update' }
      },
      {
        path: 'sales/so-ks/:id/nota',
        name: 'sales-orders-ks-nota',
        component: () => import('@/modules/sales/pages/SalesOrderNotaPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Nota SO KS', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-ks/:id/print',
        name: 'sales-orders-ks-print',
        component: () => import('@/modules/sales/pages/SalesOrderPrintPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Cetak Faktur SO KS', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-ks/:id/invoices',
        name: 'sales-orders-ks-invoices',
        component: () => import('@/modules/sales/pages/SalesInvoicePage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Sales Invoice SO KS', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/so-ks/:id/invoices/:invoiceId/payments',
        name: 'sales-orders-ks-invoice-payments',
        component: () => import('@/modules/sales/pages/SalesInvoicePaymentPage.vue'),
        props: { variant: 'ks' },
        meta: { title: 'Pembayaran Invoice SO KS', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/orders/ks/:id/invoices',
        redirect: to => `/sales/so-ks/${to.params.id}/invoices`
      },
      {
        path: 'sales/invoices/:invoiceId/payments',
        name: 'sales-invoice-payments-direct',
        component: () => import('@/modules/sales/pages/SalesInvoicePaymentPage.vue'),
        meta: { title: 'Pembayaran Sales Invoice', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/invoice-payments',
        name: 'sales-invoice-payments',
        component: () => import('@/modules/sales/pages/InvoicePaymentListPage.vue'),
        meta: { title: 'Pembayaran Invoice', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/invoice-payments/create',
        name: 'sales-invoice-payments-create',
        component: () => import('@/modules/sales/pages/InvoicePaymentCreatePage.vue'),
        meta: { title: 'Catat Pembayaran Invoice', module: 'Penjualan', permission: 'sales:create' }
      },
      {
        path: 'sales/invoice-payments/:id',
        name: 'sales-invoice-payments-detail',
        component: () => import('@/modules/sales/pages/InvoicePaymentDetailPage.vue'),
        meta: { title: 'Detail Pembayaran Invoice', module: 'Penjualan', permission: 'sales:read' }
      },
      {
        path: 'sales/invoice-payments/:id/edit',
        name: 'sales-invoice-payments-edit',
        component: () => import('@/modules/sales/pages/InvoicePaymentEditPage.vue'),
        meta: { title: 'Edit Pembayaran Invoice', module: 'Penjualan', permission: 'sales:update' }
      },
      {
        path: 'sales/other-income',
        redirect: '/accounting/other-income'
      },

      /* Pengiriman */
      {
        path: 'delivery/notes',
        name: 'delivery-notes',
        component: () => import('@/modules/delivery/pages/DeliveryNoteListPage.vue'),
        meta: { title: 'Surat Jalan', module: 'Pengiriman', permission: 'delivery:read' }
      },
      {
        path: 'delivery/notes/create',
        name: 'delivery-notes-create',
        component: () => import('@/modules/delivery/pages/DeliveryNoteCreatePage.vue'),
        meta: { title: 'Tambah Surat Jalan', module: 'Pengiriman', permission: 'delivery:create' }
      },
      {
        path: 'delivery/notes/pickup/create',
        name: 'delivery-notes-pickup-create',
        component: () => import('@/modules/delivery/pages/DeliveryNotePickupPage.vue'),
        meta: {
          title: 'Pengambilan Sendiri',
          module: 'Pengiriman',
          permission: 'delivery:create'
        }
      },
      {
        path: 'delivery/notes/:id',
        name: 'delivery-notes-detail',
        component: () => import('@/modules/delivery/pages/DeliveryNoteDetailPage.vue'),
        meta: { title: 'Detail Surat Jalan', module: 'Pengiriman', permission: 'delivery:read' }
      },
      {
        path: 'delivery/notes/:id/edit',
        name: 'delivery-notes-edit',
        component: () => import('@/modules/delivery/pages/DeliveryNoteEditPage.vue'),
        meta: { title: 'Edit Surat Jalan', module: 'Pengiriman', permission: 'delivery:update' }
      },
      {
        path: 'delivery/notes/:id/print',
        name: 'delivery-notes-print',
        component: () => import('@/modules/delivery/pages/DeliveryNotePrintPage.vue'),
        meta: { title: 'Cetak Surat Jalan', module: 'Pengiriman', permission: 'delivery:read' }
      },

      /* Keuangan */
      {
        path: 'accounting/chart-of-accounts',
        name: 'accounting-chart-of-accounts',
        component: () => import('@/modules/accounting/chart-of-accounts/pages/ChartOfAccountsPage.vue'),
        meta: {
          title: 'Chart Of Account',
          module: 'Keuangan',
          permission: 'accounting.chart-of-accounts'
        }
      },
      {
        path: 'accounting/other-income',
        name: 'accounting-other-income',
        component: () =>
          import('@/modules/accounting/other-income/pages/OtherIncomeListPage.vue'),
        meta: { title: 'Pemasukan Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-income/create',
        name: 'accounting-other-income-create',
        component: () =>
          import('@/modules/accounting/other-income/pages/OtherIncomeCreatePage.vue'),
        meta: { title: 'Tambah Pemasukan Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-income/:id/edit',
        name: 'accounting-other-income-edit',
        component: () =>
          import('@/modules/accounting/other-income/pages/OtherIncomeEditPage.vue'),
        meta: { title: 'Edit Pemasukan Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-income/:id',
        name: 'accounting-other-income-detail',
        component: () =>
          import('@/modules/accounting/other-income/pages/OtherIncomeDetailPage.vue'),
        meta: { title: 'Detail Pemasukan Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-expenses',
        name: 'accounting-other-expenses',
        component: () =>
          import('@/modules/accounting/other-expenses/pages/OtherExpenseListPage.vue'),
        meta: { title: 'Pengeluaran Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-expenses/create',
        name: 'accounting-other-expenses-create',
        component: () =>
          import('@/modules/accounting/other-expenses/pages/OtherExpenseCreatePage.vue'),
        meta: { title: 'Tambah Pengeluaran Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-expenses/:id/edit',
        name: 'accounting-other-expenses-edit',
        component: () =>
          import('@/modules/accounting/other-expenses/pages/OtherExpenseEditPage.vue'),
        meta: { title: 'Edit Pengeluaran Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/other-expenses/:id',
        name: 'accounting-other-expenses-detail',
        component: () =>
          import('@/modules/accounting/other-expenses/pages/OtherExpenseDetailPage.vue'),
        meta: { title: 'Detail Pengeluaran Lain', module: 'Keuangan' }
      },
      {
        path: 'accounting/general-journal',
        name: 'accounting-general-journal',
        component: () =>
          import('@/modules/accounting/general-journal/pages/GeneralJournalListPage.vue'),
        meta: {
          title: 'Jurnal Umum',
          module: 'Keuangan',
          permission: 'reports.general-journal'
        }
      },
      {
        path: 'accounting/general-journal/create',
        name: 'accounting-general-journal-create',
        component: () =>
          import('@/modules/accounting/general-journal/pages/GeneralJournalCreatePage.vue'),
        meta: {
          title: 'Tambah Jurnal Umum',
          module: 'Keuangan',
          permission: 'reports.general-journal'
        }
      },
      {
        path: 'accounting/general-journal/edit/:id',
        name: 'accounting-general-journal-edit',
        component: () =>
          import('@/modules/accounting/general-journal/pages/GeneralJournalCreatePage.vue'),
        meta: {
          title: 'Edit Draft Jurnal Umum',
          module: 'Keuangan',
          permission: 'reports.general-journal'
        }
      },
      {
        path: 'accounting/general-journal/:id',
        name: 'accounting-general-journal-detail',
        component: () =>
          import('@/modules/accounting/general-journal/pages/GeneralJournalDetailPage.vue'),
        meta: {
          title: 'Detail Jurnal Umum',
          module: 'Keuangan',
          permission: 'reports.general-journal'
        }
      },

      /* Laporan */
      {
        path: 'reporting/purchases',
        name: 'reporting-purchases',
        component: () => import('@/modules/procurement/reports/pages/PurchaseReportPage.vue'),
        meta: { title: 'Pembelian', module: 'Laporan' }
      },
      {
        path: 'reporting/sales',
        name: 'reporting-sales',
        component: () => import('@/modules/sales/reports/pages/SalesReportPage.vue'),
        meta: { title: 'Penjualan', module: 'Laporan' }
      },
      {
        path: 'laporan/penjualan',
        redirect: '/reporting/sales'
      },
      {
        path: 'reporting/per-product',
        name: 'reporting-per-product',
        component: () =>
          import('@/modules/sales/product-report/pages/SalesProductReportPage.vue'),
        meta: { title: 'Penjualan Per Produk', module: 'Laporan', permission: 'reporting:read' }
      },
      {
        path: 'laporan/per_produk',
        redirect: '/reporting/per-product'
      },
      {
        path: 'laporan/per-produk',
        redirect: '/reporting/per-product'
      },
      {
        path: 'reporting/sales-by-product',
        redirect: '/reporting/per-product'
      },
      {
        path: 'reporting/per-customer',
        name: 'reporting-per-customer',
        component: () =>
          import('@/modules/sales/customer-report/pages/SalesCustomerReportPage.vue'),
        meta: { title: 'Laporan Per Customer', module: 'Laporan', permission: 'reporting:read' }
      },
      {
        path: 'laporan/per_customer',
        redirect: '/reporting/per-customer'
      },
      {
        path: 'laporan/per-customer',
        redirect: '/reporting/per-customer'
      },
      {
        path: 'reporting/sales-by-customer',
        redirect: '/reporting/per-customer'
      },
      {
        path: 'reporting/sales-by-customer-product',
        name: 'reporting-sales-by-customer-product',
        component: placeholder,
        meta: {
          title: 'Penjualan per Customer & Produk',
          module: 'Laporan'
        }
      },
      {
        path: 'reporting/stock-card',
        name: 'reporting-stock-card',
        component: placeholder,
        meta: { title: 'Kartu Stok', module: 'Laporan' }
      },
      {
        path: 'reporting/stock-mutations',
        name: 'reporting-stock-mutations',
        component: placeholder,
        meta: { title: 'Laporan Mutasi Stok', module: 'Laporan' }
      },
      {
        path: 'reporting/material-stock',
        name: 'reporting-material-stock',
        component: placeholder,
        meta: { title: 'Laporan Stok Bahan', module: 'Laporan' }
      },
      {
        path: 'reporting/daily-journal',
        name: 'reporting-daily-journal',
        component: placeholder,
        meta: { title: 'Jurnal Harian', module: 'Laporan' }
      },
      {
        path: 'reporting/balance-sheet',
        name: 'reporting-balance-sheet',
        component: placeholder,
        meta: { title: 'Neraca', module: 'Laporan' }
      },
      {
        path: 'reporting/income-statement',
        name: 'reporting-income-statement',
        component: placeholder,
        meta: { title: 'Laba Rugi', module: 'Laporan' }
      },
      {
        path: 'reporting/general-ledger',
        name: 'reporting-general-ledger',
        component: placeholder,
        meta: { title: 'Buku Besar', module: 'Laporan' }
      },
      {
        path: 'reporting/statistic-sales',
        name: 'reporting-statistic-sales',
        component: placeholder,
        meta: { title: 'Statistic Sales', module: 'Laporan' }
      },
      {
        path: 'reporting/statistic-customer',
        name: 'reporting-statistic-customer',
        component: placeholder,
        meta: { title: 'Statistic Customer', module: 'Laporan' }
      },
      {
        path: 'reporting/statistic-driver',
        name: 'reporting-statistic-driver',
        component: placeholder,
        meta: { title: 'Statistic Driver', module: 'Laporan' }
      },

      /* HR */
      {
        path: 'hr/employees',
        name: 'hr-employees',
        component: () => import('@/modules/hr/pages/EmployeeListPage.vue'),
        meta: { title: 'Master Data Karyawan', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/employees/create',
        name: 'hr-employees-create',
        component: () => import('@/modules/hr/pages/EmployeeCreatePage.vue'),
        meta: { title: 'Tambah Karyawan', module: 'HR', permission: 'hr:create' }
      },
      {
        path: 'hr/employees/:id',
        name: 'hr-employees-detail',
        component: () => import('@/modules/hr/pages/EmployeeDetailPage.vue'),
        meta: { title: 'Detail Karyawan', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/employees/:id/edit',
        name: 'hr-employees-edit',
        component: () => import('@/modules/hr/pages/EmployeeEditPage.vue'),
        meta: { title: 'Ubah Karyawan', module: 'HR', permission: 'hr:update' }
      },
      {
        path: 'hr/employee-groups',
        name: 'hr-employee-groups',
        component: () => import('@/modules/hr/pages/EmployeeGroupListPage.vue'),
        meta: { title: 'Master Data Grup Karyawan', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/employee-groups/create',
        name: 'hr-employee-groups-create',
        component: () => import('@/modules/hr/pages/EmployeeGroupCreatePage.vue'),
        meta: { title: 'Tambah Grup Karyawan', module: 'HR', permission: 'hr:create' }
      },
      {
        path: 'hr/employee-groups/:id',
        name: 'hr-employee-groups-detail',
        component: () => import('@/modules/hr/pages/EmployeeGroupDetailPage.vue'),
        meta: { title: 'Detail Grup Karyawan', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/employee-groups/:id/edit',
        name: 'hr-employee-groups-edit',
        component: () => import('@/modules/hr/pages/EmployeeGroupEditPage.vue'),
        meta: { title: 'Ubah Grup Karyawan', module: 'HR', permission: 'hr:update' }
      },
      {
        path: 'hr/employee-groups/:id/members',
        name: 'hr-employee-groups-members',
        component: () => import('@/modules/hr/pages/EmployeeGroupMembersPage.vue'),
        meta: { title: 'Kelola Anggota Grup', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/schedules',
        name: 'hr-schedules',
        component: () => import('@/modules/hr/pages/ScheduleSettingsPage.vue'),
        meta: { title: 'Setting Jadwal', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/schedules/settings',
        redirect: { name: 'hr-schedules' }
      },
      {
        path: 'hr/holidays',
        name: 'hr-holidays',
        component: () => import('@/modules/hr/pages/HolidaySettingsPage.vue'),
        meta: { title: 'Setting Hari Libur', module: 'HR', permission: 'hr:read' }
      },
      {
        path: 'hr/holidays/settings',
        redirect: { name: 'hr-holidays' }
      },
      {
        path: 'hr/attendance',
        name: 'hr-attendance',
        component: () => import('@/modules/hr/pages/AttendancePage.vue'),
        meta: { title: 'Presensi', module: 'HR', permission: 'hr:read' }
      },

      /* Setting */
      {
        path: 'settings/banks',
        name: 'settings-banks',
        component: () => import('@/modules/settings/banks/pages/BankListPage.vue'),
        meta: { title: 'Master Data Bank', module: 'Setting', permission: 'settings:read' }
      },
      {
        path: 'settings/warehouses',
        name: 'settings-warehouses',
        component: () => import('@/modules/settings/warehouses/pages/WarehouseListPage.vue'),
        meta: { title: 'Master Data Gudang', module: 'Setting', permission: 'settings:read' }
      },
      {
        path: 'settings/positions',
        name: 'settings-positions',
        component: () => import('@/modules/settings/positions/pages/PositionListPage.vue'),
        meta: { title: 'Master Data Jabatan', module: 'Setting', permission: 'settings:read' }
      },
      {
        path: 'settings/employee-statuses',
        name: 'settings-employee-statuses',
        component: () =>
          import('@/modules/settings/employee-statuses/pages/EmployeeStatusListPage.vue'),
        meta: {
          title: 'Master Data Status Karyawan',
          module: 'Setting',
          permission: 'settings:read'
        }
      },
      {
        path: 'settings/material-categories',
        name: 'settings-material-categories',
        component: () =>
          import('@/modules/settings/material-categories/pages/MaterialCategoryListPage.vue'),
        meta: {
          title: 'Master Data Kategori Bahan',
          module: 'Setting',
          permission: 'settings:read'
        }
      },
      {
        path: 'settings/product-categories',
        name: 'settings-product-categories',
        component: () =>
          import('@/modules/settings/product-categories/pages/ProductCategoryListPage.vue'),
        meta: {
          title: 'Master Data Kategori Barang/Produk',
          module: 'Setting',
          permission: 'settings:read'
        }
      },
      {
        path: 'settings/material-units',
        name: 'settings-material-units',
        component: () => import('@/modules/settings/units/pages/MaterialUnitsPage.vue'),
        meta: { title: 'Master Data Satuan Bahan', module: 'Setting', permission: 'settings:read' }
      },
      {
        path: 'settings/product-units',
        name: 'settings-product-units',
        component: () => import('@/modules/settings/units/pages/ProductUnitsPage.vue'),
        meta: { title: 'Master Data Satuan Produk', module: 'Setting', permission: 'settings:read' }
      },
      {
        path: 'settings/tax',
        name: 'settings-tax',
        component: () => import('@/modules/settings/tax/pages/TaxListPage.vue'),
        meta: { title: 'Master Data PPN', module: 'Setting', permission: 'settings:read' }
      },
      {
        path: 'settings/app',
        name: 'settings-app',
        component: () => import('@/modules/settings/app/pages/AppSettingListPage.vue'),
        meta: { title: 'Setting Aplikasi', module: 'Setting', permission: 'settings:read' }
      },

      /* System Setting */
      {
        path: 'system/groups',
        name: 'system-groups',
        component: () => import('@/modules/system/groups/pages/GroupListPage.vue'),
        meta: { title: 'Master Data Groups (Role)', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/groups/create',
        name: 'system-groups-create',
        component: () => import('@/modules/system/groups/pages/GroupCreatePage.vue'),
        meta: { title: 'Tambah Groups', module: 'System Setting', permission: 'system:create' }
      },
      {
        path: 'system/groups/:id',
        name: 'system-groups-detail',
        component: () => import('@/modules/system/groups/pages/GroupDetailPage.vue'),
        meta: { title: 'Detail Groups', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/groups/:id/edit',
        name: 'system-groups-edit',
        component: () => import('@/modules/system/groups/pages/GroupEditPage.vue'),
        meta: { title: 'Edit Groups', module: 'System Setting', permission: 'system:update' }
      },
      {
        path: 'system/users',
        name: 'system-users',
        component: () => import('@/modules/system/users/pages/UserListPage.vue'),
        meta: { title: 'Master Data User', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/users/create',
        name: 'system-users-create',
        component: () => import('@/modules/system/users/pages/UserCreatePage.vue'),
        meta: { title: 'Tambah User Baru', module: 'System Setting', permission: 'system:create' }
      },
      {
        path: 'system/users/:id',
        name: 'system-users-detail',
        component: () => import('@/modules/system/users/pages/UserDetailPage.vue'),
        meta: { title: 'Detail User', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/users/:id/edit',
        name: 'system-users-edit',
        component: () => import('@/modules/system/users/pages/UserEditPage.vue'),
        meta: { title: 'Edit User', module: 'System Setting', permission: 'system:update' }
      },
      {
        path: 'system/status',
        name: 'system-status',
        component: placeholder,
        meta: { title: 'Setting Status', module: 'System Setting' }
      },
      {
        path: 'system/import',
        name: 'system-import',
        component: placeholder,
        meta: { title: 'Import Data', module: 'System Setting' }
      },
      {
        path: 'system/edit-account',
        name: 'system-edit-account',
        component: placeholder,
        meta: { title: 'Edit Akun', module: 'System Setting' }
      },
      /* Sprint 4: Centralized Monitoring Suite */
      {
        path: 'system/audit-trail',
        name: 'system-audit-trail',
        component: () => import('@/modules/system/pages/AuditTrailPage.vue'),
        meta: { title: 'Audit Trail & Perubahan Data', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/error-monitoring',
        name: 'system-error-monitoring',
        component: () => import('@/modules/system/pages/ErrorMonitoringPage.vue'),
        meta: { title: 'Error Tracking & System Errors', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/bug-reports',
        name: 'system-bug-reports',
        component: () => import('@/modules/system/pages/BugReportListPage.vue'),
        meta: { title: 'Pelaporan Masalah & Bug Reporting', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'system/monitoring-dashboard',
        name: 'system-monitoring-dashboard',
        component: () => import('@/modules/system/pages/MonitoringDashboardPage.vue'),
        meta: { title: 'Monitoring Dashboard', module: 'System Setting', permission: 'system:read' }
      },
      {
        path: 'unauthorized',
        name: 'unauthorized',
        component: () => import('@/modules/auth/pages/UnauthorizedPage.vue'),
        meta: { title: '403 - Akses Ditolak', module: 'System', requiresAuth: true }
      },
      {
        path: '403',
        name: 'forbidden',
        component: () => import('@/modules/auth/pages/UnauthorizedPage.vue'),
        meta: { title: '403 - Akses Ditolak', module: 'System', requiresAuth: true }
      },

      /* Dev Design System inside main layout */
      {
        path: 'dev/design-system',
        name: 'dev-design-system',
        component: () => import('@/modules/dev/views/DesignSystemShowcaseView.vue'),
        meta: { title: 'Design System Showcase', module: 'Dev Tools' }
      },
      {
        path: 'dev/components',
        name: 'dev-components',
        component: () => import('@/modules/dev/views/DesignSystemShowcaseView.vue'),
        meta: { title: 'Component Showcase', module: 'Dev Tools' }
      }
    ]
  }
]

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { requiresAuth: false, title: 'Login' }
  }
]

export const devRoutes: RouteRecordRaw[] = import.meta.env.DEV
  ? [
    {
      path: '/dev/theme-preview',
      name: 'dev-theme-preview',
      component: () => import('@/modules/dev/pages/ThemePreviewPage.vue'),
      meta: { title: 'Theme Preview', module: 'Dev Tools' }
    }
  ]
  : []

const catchAllRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/shared/pages/NotFoundPage.vue'),
  meta: { title: '404 - Halaman Tidak Ditemukan' }
}

export const routes: RouteRecordRaw[] = [
  ...mainAppRoutes,
  ...authRoutes,
  ...devRoutes,
  catchAllRoute
]

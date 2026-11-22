# Dashboard Architecture Document

## 1. System Overview

The Impact Furniture v2 Dashboard is the central analytical and operational hub for enterprise furniture manufacturing and sales management. It adheres to the core principle: **"Familiar in workflow, modern in appearance, professional in execution."**

## 2. Component Hierarchy

```text
DashboardPage.vue
├── AppPageHeader.vue
├── DashboardFilters.vue
│   ├── AppSelect.vue (Presets: today, 7d, 30d, month, custom)
│   ├── Date Pickers (Custom range start & end)
│   └── AppButton.vue (Reset & Refresh)
├── KPI Metrics Section (grid cols-1 sm:cols-2 lg:cols-4)
│   ├── DashboardKpiCard.vue (Total Transaksi)
│   ├── DashboardKpiCard.vue (Transaksi Hari Ini)
│   ├── DashboardKpiCard.vue (SPK Produksi Aktif)
│   └── DashboardKpiCard.vue (Bahan di Bawah Limit)
├── Analytics Charts Section (grid cols-1 lg:cols-2)
│   ├── DashboardSalesChart.vue (Pure SVG Line & Area Sales Trend)
│   └── DashboardProductChart.vue (Pure SVG Donut & Top Selling Products)
└── Operational Section (grid cols-1 lg:cols-3)
    ├── DashboardRecentTransactions.vue (lg:col-span-2 Recent Orders Table)
    └── Right Column (lg:col-span-1)
        ├── DashboardTopSpenders.vue (Top Spenders Ranked List)
        └── DashboardLowStock.vue (Low Stock Alert Badges)
```

## 3. Data Flow & Concurrency

- `useDashboard.ts` acts as the single orchestrator.
- When filters change, `useDashboard` generates a new monotonic `requestId` and aborts any active `AbortController`.
- `MockDashboardService` resolves the date range, filters transactions, and dynamically compiles all dashboard widgets from the single transaction fixture dataset.
- Upon completion, the result is accepted only if `requestId === latestRequestId`, eliminating stale response bugs.

## 4. Accessibility & Design Compliance

- Zero external UI libraries: built with Vue 3 and Tailwind CSS tokens.
- Fully accessible SVG graphs with `role="img"`, ARIA labels, hover tooltips, and toggleable accessible tables for screen readers.
- Bottom padding `pb-12` ensures operational widgets do not collide with the application footer on any display size.

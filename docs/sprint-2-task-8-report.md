# Sprint 2 — Task 8 Report: Dashboard Operational Widgets

## 1. Executive Summary

Task 8 delivers the interactive operational widgets for the dashboard: Recent Transactions table, Top Spender ranking, and Low Stock inventory alerts. All widgets derive their data dynamically from the single source of truth in the dashboard service.

## 2. Implemented Features

- **DashboardRecentTransactions Component** (`src/modules/dashboard/components/DashboardRecentTransactions.vue`):
  - Displays 5–10 recent transactions in the filtered period.
  - Columns: Order ID, Pelanggan, Tanggal, Total Nilai, Status.
  - Color-coded badges: Selesai (Success), Diproses (Info), Menunggu (Warning), Dibatalkan (Neutral).
  - Responsive table container with hover highlight.
  - Skeleton loading, empty state, and error handling.
- **DashboardTopSpenders Component** (`src/modules/dashboard/components/DashboardTopSpenders.vue`):
  - Ranks top spending customers in the filtered date range.
  - Shows rank badge (ranked 1st, 2nd, 3rd, etc.), customer name, order volume, and total spending in IDR.
  - Loading skeleton, empty state, and error state.
- **DashboardLowStock Component** (`src/modules/dashboard/components/DashboardLowStock.vue`):
  - Identifies inventory items at or below minimum limit.
  - Displays material name, warehouse name, current stock vs minimum limit, and unit.
  - Urgency categorization:
    - **Kritis** (Red badge): `currentStock <= 50% minimumLimit`.
    - **Rendah** (Amber badge): `currentStock <= minimumLimit`.
  - Empty state with "Semua Stok Aman" when no items are below limit.

## 3. Verification & Test Coverage

- Unit tests in `tests/unit/modules/dashboard/DashboardWidgets.spec.ts`:
  - Recent transactions table column rendering and status badges.
  - Top spenders ranking, total spent formatting, and empty states.
  - Low stock critical vs warning classification and all-safe empty state.
- All 6 tests in `DashboardWidgets.spec.ts` passing.

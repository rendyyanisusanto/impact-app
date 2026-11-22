# Sprint 2 — Task 6 Report: Dashboard KPI & Filters

## 1. Executive Summary

Task 6 modernizes the operational dashboard filters and key performance indicator (KPI) metric cards for Impact Furniture v2. It provides date presets, custom date range pickers with strict validation, timezone indicators, and dynamic KPI cards reflecting live filtered mock data.

## 2. Implemented Features

- **DashboardFilters Component** (`src/modules/dashboard/components/DashboardFilters.vue`):
  - Presets:
    - "Hari Ini" (`today`: 2026-10-31)
    - "7 Hari Terakhir" (`7d`: 2026-10-25 s/d 2026-10-31)
    - "30 Hari Terakhir" (`30d`: 2026-10-02 s/d 2026-10-31)
    - "Bulan Ini" (`this_month` / `month`: 2026-10-01 s/d 2026-10-31)
    - "Rentang Kustom" (`custom`)
  - Custom Range Inputs:
    - HTML5 date pickers (`startDate`, `endDate`).
    - Validation rule: `startDate <= endDate`.
    - Inline error alert in Indonesian if invalid: _"Tanggal awal tidak boleh melebihi tanggal akhir"_.
  - Refresh Action:
    - "Segarkan" button with spinner during async loading.
  - Reset Action:
    - Reverts to "Bulan Ini".
  - Status Badges:
    - "WIB (UTC+7)" and "Simulasi (Mock)".
- **DashboardKpiCard Component** (`src/modules/dashboard/components/DashboardKpiCard.vue`):
  - KPI 1: **Total Transaksi** (Sum of sales in filtered period + transaction count).
  - KPI 2: **Transaksi Hari Ini** (Sales on 2026-10-31 in WIB + confirmed sales orders count).
  - KPI 3: **SPK Produksi Aktif** (Active SPK count: 19 SPK).
  - KPI 4: **Bahan di Bawah Limit** (Low stock alert count: 5 critical/low materials).
  - Skeleton loading states and trend indicators.

## 3. Verification & Test Coverage

- Unit tests in `tests/unit/modules/dashboard/DashboardFilters.spec.ts`:
  - Preset options and default selection.
  - Date emission for `today` and `7d`.
  - Custom range validation preventing `startDate > endDate`.
  - Reset event and model value emission.
- All 4 tests in `DashboardFilters.spec.ts` passing.

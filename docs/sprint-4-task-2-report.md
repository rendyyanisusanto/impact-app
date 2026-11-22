# SPRINT 4 — TASK 2 REPORT

## PURCHASE ORDER LIST & DATATABLE

**Impact Furniture v2 — Frontend Modernization**  
**Sprint 4: Task 2 — Purchase Order List**  
**Date:** 2026-10-31  
**Status:** Completed & Verified

---

### 1. Executive Summary

Task 2 delivers the enterprise Purchase Order List page (`PurchaseOrderListPage.vue`) utilizing the reusable `AppDataTable` component. It provides real-time search, multi-field filters (date range, supplier, transaction status, approval status), column sorting, pagination, skeleton loading states, Excel/PDF exports, and an atomic Excel import pipeline.

---

### 2. Features & Component Architecture

1. **Toolbar Actions**:
   - `Tambah PO`: Navigates to dedicated page `/procurement/purchase-orders/create` (not a modal).
   - `Impor Excel`: Opens `AppImportExcelModal` configured with `PURCHASE_ORDER_IMPORT_TEMPLATE` and `purchaseOrderRowMapper`.
   - `Ekspor Excel`: Downloads sanitized `.xlsx` file adhering to active filters.
   - `Ekspor PDF`: Generates vector landscape PDF report with corporate header and timestamps.
   - `Refresh`: Triggers instant re-fetch with skeleton loading animation.
2. **Filters**:
   - Free text search covering PO code, supplier name, and remarks.
   - Supplier dropdown populated from active suppliers.
   - Transaction Status dropdown (`CASH` vs. `JATUH TEMPO`).
   - Document Status dropdown (`Draft` vs. `Disetujui`).
   - Start Date and End Date range pickers.
3. **Data Columns**:
   - `Kode PO`: With item count pill badge.
   - `Tanggal`: Formatted as `DD/MM/YYYY`.
   - `Supplier`: Resolved display name.
   - `Subtotal`: Formatted IDR.
   - `Diskon`: Formatted IDR nominal discount.
   - `PPN`: Formatted IDR tax.
   - `Total`: Formatted IDR grand total.
   - `Transaksi`: Color badge for `CASH` (info) vs. `JATUH TEMPO` (warning).
   - `Status`: Color badge for `Draft` (warning) vs. `Disetujui` (success).
   - `Aksi`: Edit (`/procurement/purchase-orders/:id/edit`) and Delete (with confirmation dialog).

---

### 3. Verification

All tests in `tests/unit/modules/procurement/PurchaseOrderList.spec.ts` (4 tests) passed with 0 errors.

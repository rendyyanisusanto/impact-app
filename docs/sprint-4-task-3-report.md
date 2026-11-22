# SPRINT 4 — TASK 3 REPORT: PURCHASE ORDER CREATE & EDIT WITH SPREADSHEET EDITOR

## 1. Executive Summary

Task 3 implements the full Purchase Order Creation and Editing pages (`PurchaseOrderCreatePage.vue` and `PurchaseOrderEditPage.vue`), featuring a high-density, desktop-style spreadsheet grid editor (`PurchaseOrderSpreadsheet.vue`) with integrated double-click material selector (`PurchaseOrderMaterialPicker.vue`), keyboard navigation, real-time decimal-safe calculation engine, and dirty-state route leave guards.

## 2. Key Components Implemented

### 2.1 Standalone Pages

- **`PurchaseOrderCreatePage.vue`**:
  - Full-screen view under route `/procurement/purchase-orders/create`.
  - Auto-initializes with 10 empty spreadsheet rows.
  - Auto-generates unique PO Code (`PO-YYYYMMDD-XXXX`) on load with manual refresh option.
  - Pre-binds active PPN setting and default status `1 (CASH)` and status draft (`0`).
  - Guards against accidental navigation if form is dirty via `useConfirmDialog`.
- **`PurchaseOrderEditPage.vue`**:
  - Standalone edit view under route `/procurement/purchase-orders/:id/edit`.
  - Loads PO header and detail rows from `purchaseOrderService.getById(id)`.
  - Allows editing, adding, and removing lines.
  - Recalculates subtotal, global discount, and tax in real time.

### 2.2 Section A: Header Form (`PurchaseOrderHeaderForm.vue`)

- Two-column responsive desktop layout matching legacy ergonomics:
  - **Left Column**:
    - Kode PO with auto-generate button (`Wand2`).
    - Tanggal PO (`type="date"`).
    - Status Transaksi select (Options: `CASH`, `JATUH TEMPO` from legacy `status_transaksi`).
    - Status Dokumen badge/select (Draft vs Disetujui).
  - **Right Column**:
    - Supplier Select (Searchable via `AppCombobox` referencing legacy `suplier_id`).
    - PPN Checkbox with dynamic active tax rate badge.
    - Keterangan / Catatan input text.

### 2.3 Section B: Desktop Spreadsheet Grid (`PurchaseOrderSpreadsheet.vue`)

- High-efficiency tabular data entry grid replacing legacy desktop inputs:
  - **Columns**: `No`, `Nama Bahan / Deskripsi`, `Satuan`, `Stok Gudang`, `Qty`, `Harga Satuan`, `Diskon (%)`, `Subtotal`, `Keterangan`, `Aksi`.
  - **Initial State**: 10 clean rows ready for rapid tab-and-type input.
  - **Double-click Material Selector**:
    - Double-clicking the "Nama Bahan" cell or pressing `F2` / `Enter` summons `PurchaseOrderMaterialPicker.vue`.
    - Floating popover anchored to active cell with immediate input auto-focus.
    - Arrow keys (`ArrowUp`, `ArrowDown`), `Enter` to commit, `Escape` to close.
    - Automatically maps `bahan_id`, `satuan_id`, item name, and default purchase price to the row, then automatically advances focus to the `Qty` column.
  - **Keyboard Navigation**:
    - `Tab` / `Shift+Tab`: Horizontal cell traversal.
    - `ArrowUp` / `ArrowDown`: Vertical cell traversal within the active column.
    - `Enter`: Commits input and advances to the next logical cell.
    - `Delete` / `Backspace` on row action: Clears or deletes line.
  - **Toolbar**:
    - `Tambah Baris`: Appends new blank row at the bottom.
    - `Bersihkan Baris Kosong`: Removes all rows lacking selected materials.

### 2.4 Section C: Summary Panel (`PurchaseOrderSummary.vue`)

- Real-time reactive calculation summary:
  - **Total Bruto (Subtotal)**: Sum of all valid row subtotals (`Qty * Harga * (1 - Diskon% / 100)`).
  - **Diskon Global (%)**: Percentage-based discount affecting total subtotal.
  - **Total Sebelum PPN**: Net subtotal after global discount.
  - **PPN**: Evaluated dynamically based on active tax rate when PPN is enabled.
  - **Total Bayar (Net Grand Total)**: Prominently styled highlight badge in IDR currency.

### 2.5 Section D: Bottom Action Bar & Navigation Guards

- **Save / Simpan**:
  - Validates required fields (Supplier, Date, at least 1 valid line item).
  - Filters out unpopulated empty rows automatically before sending payload.
  - Displays spinner and disables buttons to prevent double submission.
  - Triggers success toast and redirects back to `/procurement/purchase-orders`.
- **Cancel / Batal**:
  - Triggers confirmation modal if form is modified (`isDirty`).
  - Implements `onBeforeRouteLeave` navigation guard to prevent data loss.

## 3. Verification & Test Coverage

- Unit and component tests in `PurchaseOrderSpreadsheet.spec.ts` and `PurchaseOrderForm.spec.ts`:
  - Verified 10 initial rows generation.
  - Verified row addition, deletion, and empty row filtering.
  - Verified live subtotal recalculations on quantity/price changes.
  - Verified validation error display when saving empty documents.
  - Verified double-click material selection and focus handover.

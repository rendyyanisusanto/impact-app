# SPRINT 3 — TASK 11 REPORT

## MASTER DATA INTEGRATION & RBAC

**Impact Furniture v2 — Frontend Modernization**  
**Sprint 3: Task 11 — Integration & RBAC Enforcement**  
**Date:** 2026-10-31  
**Status:** Completed & Verified

---

### 1. Executive Summary

Task 11 focuses on holistic cross-module integration and strict Role-Based Access Control (RBAC) across all 15 master data modules. In previous tasks, modules were built with typed mock services; Task 11 solidifies their interconnectivity, prevents orphaned foreign key references, guarantees cascading deletes where specified in legacy SQL schema, synchronizes live reference updates, and reinforces security at the navigation, router, UI, and service levels.

---

### 2. Architecture & Implementations

#### 2.1 Dynamic Reference Synchronization (`reference.service.ts`)

- **Central Reference Hub**: `ReferenceService` manages reactive lookups and dynamic state for Warehouses (`gudang`), Material Categories (`kategori_bahan`), Product Categories (`kategori_barang`), Purchase Units (`satuan_beli`), Usage Units (`satuan_pakai`), Product Units (`satuan_barang`), Provinces (`provinces`), and Cities (`cities`).
- **Standardized Contract**:
  - `getWarehouses(): Promise<ReferenceOption[]>`
  - `getMaterialCategories(): Promise<ReferenceOption[]>`
  - `getProductCategories(): Promise<ReferenceOption[]>`
  - `getPurchaseUnits(): Promise<ReferenceOption[]>`
  - `getUsageUnits(): Promise<ReferenceOption[]>`
  - `getProductUnits(): Promise<ReferenceOption[]>`
  - `getProvincesAsOptions(): Promise<ReferenceOption[]>`
  - `getCitiesAsOptions(provinceId?: number): Promise<ReferenceOption[]>`
- **Live Event Synchronization**: Whenever a reference entity (such as a warehouse or category) is updated or created via its management service, it calls `referenceService.setWarehouse(...)` or `referenceService.setProductCategory(...)`. Consumer views and services immediately resolve the updated name dynamically without altering stock or prices.

#### 2.2 Referential Integrity & Restricted Deletion Safeguards

To prevent corrupted or broken foreign key states in database migration, restricted deletion policies are enforced with explicit user-friendly error messages:

- **Warehouse Deletion**:
  - Blocked if referenced in `master_data_bahan` (`gudang_id`) or `produk` (`gudang_id`).
  - Error: `"Gudang tidak dapat dihapus karena masih digunakan oleh data bahan atau produk."`
- **Purchase Unit (`satuan_beli`) Deletion**:
  - Blocked if referenced in `satuan_pakai` (`satuan_beli_id`) or `master_data_bahan` (`satuan_beli_id`).
  - Error: `"Satuan Beli tidak dapat dihapus karena masih digunakan oleh satuan pakai atau data bahan."`
- **Usage Unit (`satuan_pakai`) Deletion**:
  - Blocked if referenced in `master_data_bahan` (`satuan_pakai_id`).
  - Error: `"Satuan Pakai tidak dapat dihapus karena masih digunakan oleh data bahan."`
- **Product Unit (`satuan_barang`) Deletion**:
  - Blocked if referenced in `produk` (`satuan_barang_id`).
  - Error: `"Satuan Barang tidak dapat dihapus karena masih digunakan oleh data produk."`
- **Product Category (`kategori_barang`) Deletion**:
  - Blocked if referenced in `produk` (`kategori_barang_id`).
  - Error: `"Kategori Barang tidak dapat dihapus karena masih digunakan oleh data produk."`

#### 2.3 Cascading Deletion Handling

Strict cascading deletion is implemented for subordinate tables as defined by legacy relational constraints:

- **Supplier (`master_data_suplier`)**: Deleting a supplier automatically removes associated `additional_data_suplier` key-value records.
- **Customer (`master_data_customer`)**: Deleting a customer automatically removes associated `additional_data_customer` key-value records.
- **Product (`produk`)**: Deleting a product automatically cascades deletion to child `produk_foto` gallery rows.

#### 2.4 Multi-Tier RBAC Enforcement

RBAC security operates across 4 distinct layers:

1. **Navigation Menu**: Menu items are conditionally rendered based on permissions defined in `navigation.config.ts`.
2. **Router Guards**: `beforeEach` navigation guard evaluates `route.meta.permission` and redirects unauthorized access directly to `/unauthorized`.
3. **UI Action Controls**: Action buttons (Tambah, Edit, Hapus, Import) conditionally render or disable based on `hasPermission(...)`.
4. **Mock Service Boundary (`service-guard.ts`)**:
   - `assertPermission(resource, action)` asserts whether the currently logged-in user possesses the required permission.
   - Throws descriptive security errors (`Akses ditolak: Pengguna '...' tidak memiliki izin '...' pada resource '...'`) if breached.

---

### 3. Role Access Matrix Verification

| Role                              | Module Read Access  | Module Create/Update          | Module Delete                 | Notes                                   |
| :-------------------------------- | :------------------ | :---------------------------- | :---------------------------- | :-------------------------------------- |
| **Superadmin (Admin)**            | All modules allowed | All modules allowed           | All modules allowed           | Full administrative authority           |
| **Auditor (Internal Auditor)**    | All modules allowed | Blocked (`403 Akses ditolak`) | Blocked (`403 Akses ditolak`) | Read-only inspection role               |
| **Staff Penjualan (Sales Staff)** | Customer only       | Customer only                 | Customer only                 | Restricted from Procurement & Inventory |

---

### 4. Verification & Testing

Cross-module integration tests in `tests/unit/modules/integration/MasterDataIntegration.spec.ts` rigorously assert:

- `1.1` Warehouse renaming in `warehouseService` dynamically propagates to `productService.getById(43)` without altering `qty` or `harga`.
- `1.2` Product category renaming dynamically updates product item display name.
- `1.3` Standardized reference contract returns options for asynchronous dropdowns.
- `2.1` Block deletion of warehouses referenced by products.
- `2.2` Block deletion of purchase units referenced by usage units or materials.
- `2.3` Block deletion of product categories referenced by products.
- `2.4` Block deletion of product units referenced by products.
- `3.1` Cascading delete of supplier additional data.
- `3.2` Cascading delete of customer additional data.
- `4.1` Atomic Excel import rollback upon validation failure (0 partial writes).
- `4.2` Atomic Excel import success committing all valid rows.
- `5.1` Superadmin unrestricted CRUD permissions.
- `5.2` Internal Auditor read-only permissions with mutation blocked at service boundaries.
- `5.3` Staff Penjualan redirection to `/unauthorized` on restricted inventory access.
- `6.1` Excel export formula injection prevention (`=,+,-,@` sanitized).

# Sprint 3 — Task 4 Implementation Report: Master Data Bahan

## 1. Executive Summary

Task 4 delivers the Master Data Bahan (Raw Materials) module for **Impact Furniture v2**, migrating material inventory, warehouse designations, purchasing vs. production unit conversions, and unit pricing into Vue 3. Adhering to SQL tables `master_data_bahan` and `konversi_satuan_bahan`, the module introduces unit conversion rules, stock quantity safeguards (locking direct quantity editing during master updates and deferring mutations to Sprint 5 Inventory Transactions), low stock visual indicators, PDF/Excel export, Excel batch import, and RBAC enforcement.

---

## 2. Key Deliverables & Architecture

| Deliverable           | Location                                                                 | Description                                                                                                                                                                                                                           |
| :-------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Domain Types**      | `app/src/modules/inventory/materials/types/material.types.ts`            | TypeScript definitions: `MasterDataBahan`, `KonversiSatuanBahan`, `CreateMaterialDto`, `UpdateMaterialDto`.                                                                                                                           |
| **Mock Service**      | `app/src/modules/inventory/materials/services/material.service.ts`       | Reactive in-memory service implementing `CrudService` with pagination, search, warehouse filter, cascading delete to unit conversions, `exportAll`, and `importBatch`.                                                                |
| **Import Config**     | `app/src/modules/inventory/materials/utils/material-import.config.ts`    | Template definition with warehouse and unit reference sheets and `materialRowMapper`.                                                                                                                                                 |
| **List Page**         | `app/src/modules/inventory/materials/pages/MaterialListPage.vue`         | Master data table with low stock indicator (`Stok Limit`), warehouse filter, search, skeleton loading, pagination, action bar, and modal triggers.                                                                                    |
| **Form Modal**        | `app/src/modules/inventory/materials/components/MaterialFormModal.vue`   | Form for create/edit. **Quantity field is disabled/read-only on edit** with an explicit note explaining that stock mutations must occur via inventory transaction journals in Sprint 5. Supports dynamic unit conversion factor rows. |
| **Detail Modal**      | `app/src/modules/inventory/materials/components/MaterialDetailModal.vue` | Read-only modal displaying stock metrics, minimum stock limit warning badge, unit conversions table, warehouse assignment, and audit timestamps.                                                                                      |
| **Route Integration** | `app/src/app/router/routes.ts`                                           | Live route at `/inventory/materials` with permission requirement `inventory.materials.view`.                                                                                                                                          |
| **Unit Test Suite**   | `app/tests/unit/modules/inventory/MaterialCrud.spec.ts`                  | 9 unit tests covering service CRUD, warehouse filtering, unit conversion creation and cascading delete, locked stock quantity protection, low stock alert badge, and UI modal interactions.                                           |

---

## 3. Database Schema Fidelity

The implementation strictly reflects the MariaDB table structure:

```sql
CREATE TABLE `master_data_bahan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `min_qty` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `satuan_pakai_id` int(10) UNSIGNED DEFAULT NULL,
  `satuan_beli_id` int(10) UNSIGNED DEFAULT NULL,
  `gudang_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `harga_satuan` decimal(20,2) DEFAULT NULL,
  `foto` text DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `konversi_satuan_bahan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `bahan_id` int(10) UNSIGNED NOT NULL,
  `satuan_id` int(10) UNSIGNED NOT NULL,
  `nilai` int(11) NOT NULL,
  `default` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);
```

### Stock Mutation Safeguard (Audit Integrity)

- On initial creation, initial stock quantity (`qty`) can be set.
- On edit/update, the `qty` field is **strictly disabled and read-only**.
- An informative badge informs operators: _"Kuantitas stok tidak dapat diubah langsung dari form master data. Mutasi stok masuk, keluar, dan penyesuaian opname dilakukan melalui modul Transaksi Gudang pada Sprint 5."_

---

## 4. Verification & Testing

- `npm run typecheck`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors.
- `npm run format:check`: Passed with 0 errors.
- Vitest unit tests: 9 tests in `MaterialCrud.spec.ts` passing.

# Sprint 3 — Task 6 Implementation Report: Master Data Gudang & Bank

## 1. Executive Summary

Task 6 implements two essential setting modules in Impact Furniture v2:

1. **Master Data Gudang (Warehouses)**: Physical warehouse facilities with color markers, addresses, and active status.
2. **Master Data Bank (Bank Accounts)**: Corporate banking accounts with strict preservation of string account numbers (maintaining leading zeros).

Both modules provide full CRUD, PDF export, Excel export, Excel import, and table skeleton loading, syncing seamlessly with the centralized `referenceService`.

---

## 2. Key Deliverables & Architecture

| Deliverable                  | Location                                                                                                                | Description                                                                                                     |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Warehouse Types**          | `app/src/modules/settings/warehouses/types/warehouse.types.ts`                                                          | Types: `Gudang`, `CreateWarehouseDto`, `UpdateWarehouseDto`.                                                    |
| **Warehouse Service**        | `app/src/modules/settings/warehouses/services/warehouse.service.ts`                                                     | CRUD service with search, pagination, color picker defaults, sync with `referenceService`.                      |
| **Warehouse Pages & Modals** | `app/src/modules/settings/warehouses/pages/WarehouseListPage.vue`, `WarehouseFormModal.vue`, `WarehouseDetailModal.vue` | Color preview pills, address inputs, export/import modal triggers, skeleton loaders.                            |
| **Bank Types**               | `app/src/modules/settings/banks/types/bank.types.ts`                                                                    | Types: `Bank`, `CreateBankDto`, `UpdateBankDto`. Account number (`rekening`) is strictly typed as `string`.     |
| **Bank Service**             | `app/src/modules/settings/banks/services/bank.service.ts`                                                               | CRUD service maintaining leading zero preservation, search by bank name and account number, export/import.      |
| **Bank Pages & Modals**      | `app/src/modules/settings/banks/pages/BankListPage.vue`, `BankFormModal.vue`, `BankDetailModal.vue`                     | Bank listing, account masking options, export/import modal triggers.                                            |
| **Route Integration**        | `app/src/app/router/routes.ts`                                                                                          | Wired at `/settings/warehouses` and `/settings/banks`.                                                          |
| **Unit Test Suite**          | `app/tests/unit/modules/settings/WarehouseAndBankCrud.spec.ts`                                                          | 10 unit tests verifying warehouse CRUD, color coding, bank account string preservation, and import row mappers. |

---

## 3. Database Schema Fidelity

Directly extracted from `u1573701_smm.sql`:

```sql
CREATE TABLE `gudang` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `kode` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `bank` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `bank` varchar(255) DEFAULT NULL,
  `rekening` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### Critical Implementation Notes

- **Bank Schema Simplicity**: The `bank` table in legacy MariaDB only has 3 columns: `id`, `bank`, and `rekening`. No artificial status, account holder, or branch columns were fabricated.
- **Leading Zeros**: `rekening` is handled as `string` across all layers (DTO, service, Excel import/export) to prevent integer truncation of leading zeros (e.g., `'0145293817'`).
- **Gudang Color Coding**: Stored as hex strings (`color`) and visualized using badge markers throughout inventory modules.

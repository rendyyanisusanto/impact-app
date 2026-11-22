# Sprint 3 — Task 2 Implementation Report: Master Data Supplier

## 1. Executive Summary

Task 2 delivers the full Master Data Supplier module for **Impact Furniture v2**, migrating legacy vendor management into a modern, responsive Vue 3 CRUD interface. The module adheres to SQL tables `master_data_suplier` and `additional_master_data_supplier`, incorporating cascading province-city lookups, multiple contact persons/additional data rows, full search and status filters, PDF/Excel export, Excel batch import, and RBAC permission enforcement.

---

## 2. Key Deliverables & Architecture

| Deliverable           | Location                                                                   | Description                                                                                                                                                               |
| :-------------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Domain Types**      | `app/src/modules/procurement/suppliers/types/supplier.types.ts`            | TypeScript definitions: `MasterDataSuplier`, `AdditionalSupplierData`, `CreateSupplierDto`, `UpdateSupplierDto`.                                                          |
| **Mock Service**      | `app/src/modules/procurement/suppliers/services/supplier.service.ts`       | Reactive in-memory service implementing `CrudService` with pagination, search, status filtering, cascading delete to additional contacts, `exportAll`, and `importBatch`. |
| **Import Config**     | `app/src/modules/procurement/suppliers/utils/supplier-import.config.ts`    | Template definition with city reference sheet and `supplierRowMapper`.                                                                                                    |
| **List Page**         | `app/src/modules/procurement/suppliers/pages/SupplierListPage.vue`         | Master data table with search, status dropdown, sorting, skeleton loading, pagination, action bar, and modal triggers.                                                    |
| **Form Modal**        | `app/src/modules/procurement/suppliers/components/SupplierFormModal.vue`   | Form for create/edit with auto-generated code option, cascading province-city selection, and dynamic additional contact rows.                                             |
| **Detail Modal**      | `app/src/modules/procurement/suppliers/components/SupplierDetailModal.vue` | Read-only drawer/modal displaying supplier overview, contact info, audit trail timestamps, and additional contacts table.                                                 |
| **Route Integration** | `app/src/app/router/routes.ts`                                             | Live route at `/procurement/suppliers` with permission requirement `procurement.suppliers.view`.                                                                          |
| **Unit Test Suite**   | `app/tests/unit/modules/procurement/SupplierCrud.spec.ts`                  | 10 unit tests covering service CRUD, search, status filter, cascading delete, batch import, and UI modal interactions.                                                    |

---

## 3. Database Schema Fidelity

The implementation strictly reflects the MariaDB table structure:

```sql
CREATE TABLE `master_data_suplier` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `no_hp` varchar(255) NOT NULL,
  `city_id` int(10) UNSIGNED DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(10) UNSIGNED NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `additional_master_data_supplier` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `supplier_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### Cascading Province & City Lookup

- `city_id` points to master city reference. In the UI, users first select a Province, dynamically filtering available Cities.
- Resolves presentation names (`province_name`, `city_name`) without altering underlying storage attributes.

---

## 4. Verification & Testing

- `npm run typecheck`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors.
- `npm run format:check`: Passed with 0 errors.
- Vitest unit tests: 10 tests in `SupplierCrud.spec.ts` passing.

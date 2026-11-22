# Sprint 3 — Task 3 Implementation Report: Master Data Customer

## 1. Executive Summary

Task 3 delivers the Master Data Customer module for **Impact Furniture v2**, migrating client and ordering institution records into the new ERP architecture. Adhering to SQL tables `master_data_customer` and `additional_master_data_customer`, the module handles nullable database columns gracefully while applying intuitive business rules in the user interface (e.g. customer name required for ERP operational integrity).

---

## 2. Key Deliverables & Architecture

| Deliverable           | Location                                                             | Description                                                                                                                                                                    |
| :-------------------- | :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain Types**      | `app/src/modules/sales/customers/types/customer.types.ts`            | TypeScript definitions: `MasterDataCustomer`, `AdditionalCustomerData`, `CreateCustomerDto`, `UpdateCustomerDto`. Supports nullable schema fields.                             |
| **Mock Service**      | `app/src/modules/sales/customers/services/customer.service.ts`       | Reactive in-memory service implementing `CrudService` with pagination, search, status filtering, cascading delete to additional customer data, `exportAll`, and `importBatch`. |
| **Import Config**     | `app/src/modules/sales/customers/utils/customer-import.config.ts`    | Template definition with city reference sheets and `customerRowMapper`.                                                                                                        |
| **List Page**         | `app/src/modules/sales/customers/pages/CustomerListPage.vue`         | Master data table with search, status dropdown, sorting, skeleton loading, pagination, action bar, and modal triggers.                                                         |
| **Form Modal**        | `app/src/modules/sales/customers/components/CustomerFormModal.vue`   | Form for create/edit supporting nullable optional fields while requiring customer name, cascading province-city dropdowns, and additional contact rows.                        |
| **Detail Modal**      | `app/src/modules/sales/customers/components/CustomerDetailModal.vue` | Read-only modal displaying customer overview, contact info, audit trail timestamps, and additional contact records table.                                                      |
| **Route Integration** | `app/src/app/router/routes.ts`                                       | Live route at `/sales/customers` with permission requirement `sales.customers.view`.                                                                                           |
| **Unit Test Suite**   | `app/tests/unit/modules/sales/CustomerCrud.spec.ts`                  | 9 unit tests covering service CRUD, search, status filter, cascading delete, nullable schema support, and UI modal interactions.                                               |

---

## 3. Database Schema Fidelity & UX Handling

The MariaDB schema for customers allows several columns to be nullable:

```sql
CREATE TABLE `master_data_customer` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `no_hp` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `province_id` int(10) UNSIGNED DEFAULT NULL,
  `city_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `additional_master_data_customer` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### UX Enhancement with Schema Preservation

- While the database schema permits `nama` to be `NULL`, from a practical ERP standpoint a customer without an identifiable name causes severe ambiguity in sales orders and invoicing. The frontend form enforces `nama` as a required field for human operators while maintaining nullable types in the TypeScript domain interface to safely read and persist historical legacy database records.
- If `kode` is omitted, the frontend provides auto-generation (`CUST-XXX`), while still accepting explicit null/empty values when legacy records are imported.

---

## 4. Verification & Testing

- `npm run typecheck`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors.
- `npm run format:check`: Passed with 0 errors.
- Vitest unit tests: 9 tests in `CustomerCrud.spec.ts` passing.

# MASTER DATA TESTING STRATEGY & METRICS

**Impact Furniture v2 — Frontend Modernization**  
**Sprint 3 Architecture Documentation**

---

### 1. Test Philosophy & Framework

The frontend testing suite is designed around Vitest 3 and Vue Test Utils, simulating real-world user interactions and data mutations under jsdom.

- **Unit Testing**: Tests individual components, services, and utility functions in isolation.
- **Integration Testing**: Tests cross-module reactivity, route navigation guards, referential integrity blocks, and transaction rollback mechanics.

---

### 2. Test Execution Summary

```text
===================================================================
                         VITEST RESULTS
===================================================================
Test Files  : 55 passed (55 files)
Total Tests : 321 passed (0 failed)
Time        : 22.54s
Environment : jsdom
Coverage Target : Master Data, Layouts, Navigation, RBAC, Services
===================================================================
```

---

### 3. Master Data Test Files Inventory

1. `tests/unit/modules/integration/MasterDataIntegration.spec.ts` (15 tests)
   - Cross-module synchronization of warehouses and categories.
   - Referential integrity blocks on delete.
   - Cascading deletes of additional data.
   - Excel atomic import validation and snapshot rollback.
   - Multi-tier RBAC for Superadmin, Auditor, and Sales Staff.
   - Formula injection sanitization.
2. `tests/unit/modules/inventory/ProductCrud.spec.ts` (10 tests)
   - Product list rendering, filtering, sorting, pagination, modals, and export/import.
3. `tests/unit/modules/procurement/SupplierCrud.spec.ts` (10 tests)
   - Supplier CRUD, additional key-values, and reactive city cascade.
4. `tests/unit/modules/sales/CustomerCrud.spec.ts` (9 tests)
   - Customer CRUD, search, additional data, and modal forms.
5. `tests/unit/modules/inventory/MaterialCrud.spec.ts` (9 tests)
   - Raw material CRUD, stock threshold alerts, searchable selects, and photo preview.
6. `tests/unit/modules/settings/WarehouseAndBankCrud.spec.ts` (10 tests)
   - Warehouse and Bank CRUD, color pickers, and account formatters.
7. `tests/unit/modules/settings/CategoryCrud.spec.ts` (8 tests)
   - Material and Product Category CRUD, color tags, and modal forms.
8. `tests/unit/modules/settings/UnitCrud.spec.ts` (10 tests)
   - Satuan Beli, Satuan Pakai, and Satuan Barang CRUD and tab switching.
9. `tests/unit/modules/settings/TaxAndSettingCrud.spec.ts` (9 tests)
   - Tax rate percentage handling and application logo upload.
10. `tests/unit/modules/settings/PositionAndStatusCrud.spec.ts` (10 tests)
    - Position and Employee Status active toggling and CRUD operations.
11. `tests/unit/shared/ExcelImportExport.spec.ts` (9 tests)
    - File parsing, template generation, formula injection defense, and progress callback.

# Sprint 3 — Task 8 Implementation Report: Master Data Satuan

## 1. Executive Summary

Task 8 delivers unit measurement management across the manufacturing lifecycle:

1. **Satuan Beli (`satuan_beli`)**: Purchasing units used during procurement (e.g., Kg, Rim, Dus, Sak). Enforces single default unit exclusivity (`default = 1`).
2. **Satuan Pakai (`satuan_pakai`)**: Production consumption units (e.g., Gram, Lembar, Pcs). Links to `satuan_beli_id` and enforces a non-zero, positive conversion divider (`pembagi DECIMAL(20,6)`).
3. **Satuan Barang (`satuan_barang`)**: Finished goods inventory and sales units (e.g., Set, Unit, Pcs).

Modules are structured into two dedicated routes:

- `/settings/material-units`: Tabbed interface housing Satuan Beli and Satuan Pakai.
- `/settings/product-units`: Focused management table for Satuan Barang.

---

## 2. Key Deliverables & Architecture

| Deliverable             | Location                                                     | Description                                                                                                                     |
| :---------------------- | :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Unit Types**          | `app/src/modules/settings/units/types/unit.types.ts`         | Types for `SatuanBeli`, `SatuanPakai`, `SatuanBarang`.                                                                          |
| **Unit Services**       | `app/src/modules/settings/units/services/unit.service.ts`    | `satuanBeliService` (with default flag mutex), `satuanPakaiService` (with mathematical division safety), `satuanBarangService`. |
| **Material Units Page** | `app/src/modules/settings/units/pages/MaterialUnitsPage.vue` | Tabbed view switching seamlessly between purchasing and production units.                                                       |
| **Product Units Page**  | `app/src/modules/settings/units/pages/ProductUnitsPage.vue`  | Dedicated master data table for finished product units.                                                                         |
| **Modals**              | `app/src/modules/settings/units/components/`                 | Form and detail modals for Satuan Beli, Satuan Pakai, and Satuan Barang with field validations.                                 |
| **Route Integration**   | `app/src/app/router/routes.ts`                               | Live routes at `/settings/material-units` and `/settings/product-units`.                                                        |
| **Unit Test Suite**     | `app/tests/unit/modules/settings/UnitCrud.spec.ts`           | 10 unit tests covering single default enforcement, division by zero prevention, decimal precision, and tab navigation.          |

---

## 3. Database Schema Fidelity

Directly extracted from `u1573701_smm.sql`:

```sql
CREATE TABLE `satuan_beli` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `default` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `satuan_pakai` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `satuan_beli_id` int(10) UNSIGNED DEFAULT NULL,
  `pembagi` decimal(20,6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `satuan_barang` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### Critical Mathematical Invariants

- **Exclusive Default**: When setting `default: 1` on a `satuan_beli`, all other records are automatically reset to `default: 0`.
- **Division by Zero Protection**: In `satuan_pakai`, `pembagi` represents how many production units are contained in one purchasing unit. Validations strictly enforce `pembagi > 0` and support up to 6 decimal digits of precision.

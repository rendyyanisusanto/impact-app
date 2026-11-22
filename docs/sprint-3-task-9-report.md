# Sprint 3 — Task 9 Implementation Report: Master Data PPN & Setting Aplikasi

## 1. Executive Summary

Task 9 implements system taxation and application parameter configuration:

1. **Master Data PPN (`ppn`)**: Value-Added Tax configuration. In MariaDB legacy schema, `nama` is an **INT(11)** storing the exact integer percentage (e.g. 11 for 11%, 10 for 10%), while `is_active` enforces that only **one tax rate** is applied system-wide to active transactions.
2. **Setting Aplikasi (`setting_table`)**: Key-value configuration store for ERP application defaults, company metadata, and feature toggles, backed by an allowlist.

---

## 2. Key Deliverables & Architecture

| Deliverable             | Location                                                    | Description                                                                                                                                        |
| :---------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tax Module**          | `app/src/modules/settings/tax/`                             | Types, service, import template, list page, form modal, and detail modal for `ppn`. Supports integer percent validation and active rate mutex.     |
| **App Settings Module** | `app/src/modules/settings/app/`                             | Types, service, import template, list page, form modal, and detail modal for `setting_table`. Supports table categorization and key-value editing. |
| **Route Integration**   | `app/src/app/router/routes.ts`                              | Live routes at `/settings/tax` and `/settings/app`.                                                                                                |
| **Unit Test Suite**     | `app/tests/unit/modules/settings/TaxAndSettingCrud.spec.ts` | 9 unit tests verifying integer `nama` constraint, `is_active` single-rate exclusivity, and key-value CRUD operations.                              |

---

## 3. Database Schema Fidelity

Directly extracted from `u1573701_smm.sql`:

```sql
CREATE TABLE `ppn` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `setting_table` (
  `id_setting_table` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `table` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id_setting_table`)
);
```

### Critical Implementation Notes

- **PPN Integer Field (`ppn.nama`)**: Unlike conventional designs where name is a text string, the legacy SQL stores the numeric percentage in `nama` as an integer (`int(11)`). The UI displays this with a `%` suffix for clarity while storing integer values (`11`, `10`, etc.).
- **Active Tax Mutual Exclusivity**: If a rate has `is_active = 1`, all other rates automatically have `is_active = 0`.
- **Primary Key Mapping**: `setting_table` uses `id_setting_table` as its primary key in SQL, which is mapped transparently to `id` in the frontend domain model.

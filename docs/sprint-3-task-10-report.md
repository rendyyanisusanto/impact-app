# Sprint 3 — Task 10 Implementation Report: Master Data Jabatan & Status Karyawan

## 1. Executive Summary

Task 10 delivers organizational and human resources settings for Impact Furniture v2:

1. **Master Data Jabatan (`jabatan`)**: Organizational positions (e.g., Direktur, Pengiriman, Gudang, Kernet) featuring legacy soft-delete semantics (`is_deleted = 1` active, `0` deleted), badge color tagging, and status toggle.
2. **Master Data Status Karyawan (`status_karyawan`)**: Employment status classifications (e.g., Harian, Borongan, Bulanan/Tetap, Kontrak/PKWT) with color coding and audit tracking.

---

## 2. Key Deliverables & Architecture

| Deliverable                | Location                                                        | Description                                                                                                                                     |
| :------------------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Position Module**        | `app/src/modules/settings/positions/`                           | Types, service, import template, list page, form modal, and detail modal for `jabatan`. Supports soft delete (`is_deleted = 0`) and color tags. |
| **Employee Status Module** | `app/src/modules/settings/employee-statuses/`                   | Types, service, import template, list page, form modal, and detail modal for `status_karyawan`.                                                 |
| **Route Integration**      | `app/src/app/router/routes.ts`                                  | Live routes at `/settings/positions` and `/settings/employee-statuses`.                                                                         |
| **Unit Test Suite**        | `app/tests/unit/modules/settings/PositionAndStatusCrud.spec.ts` | 10 unit tests verifying soft-delete semantics, color badge tokens, import row mapping, and modal validations.                                   |

---

## 3. Database Schema Fidelity

Directly extracted from `u1573701_smm.sql`:

```sql
CREATE TABLE `jabatan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
);

CREATE TABLE `status_karyawan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### Critical Implementation Notes

- **Soft Delete Semantics (`is_deleted`)**: In the legacy MariaDB dump, `is_deleted = 1` indicates an active, visible record, whereas `is_deleted = 0` denotes a soft-deleted record. When deleting a record via UI, the mock service updates `is_deleted: 0`, and all queries strictly filter by `(is_deleted ?? 1) === 1`.
- **Badge Colors**: Both modules store hex codes (e.g. `#000000`, `#03b300`, `#3b82f6`) and render visually distinctive pills in tables and dropdowns.

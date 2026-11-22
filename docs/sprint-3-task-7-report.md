# Sprint 3 — Task 7 Implementation Report: Master Data Kategori Bahan & Kategori Barang

## 1. Executive Summary

Task 7 implements two category classification modules:

1. **Master Data Kategori Bahan** (`kategori_bahan`): Classifies raw materials used in production (e.g. Bahan Utama, Baut, Busa, Kain, Finishing NC).
2. **Master Data Kategori Barang** (`kategori_barang`): Classifies manufactured furniture and merchandise (e.g. Kursi, Meja, Lemari).

Both modules support complete CRUD workflows, custom color tags, status toggle (Aktif / Nonaktif), PDF export, Excel export, Excel batch import, and table skeleton loaders.

---

## 2. Key Deliverables & Architecture

| Deliverable                  | Location                                               | Description                                                                                     |
| :--------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Material Category Module** | `app/src/modules/settings/material-categories/`        | Types, service, import template, list page, form modal, and detail modal for `kategori_bahan`.  |
| **Product Category Module**  | `app/src/modules/settings/product-categories/`         | Types, service, import template, list page, form modal, and detail modal for `kategori_barang`. |
| **Route Integration**        | `app/src/app/router/routes.ts`                         | Wired at `/settings/material-categories` and `/settings/product-categories`.                    |
| **Unit Test Suite**          | `app/tests/unit/modules/settings/CategoryCrud.spec.ts` | 8 unit tests validating category retrieval, creation, color tokens, and import row validation.  |

---

## 3. Database Schema Fidelity

Directly extracted from `u1573701_smm.sql`:

```sql
CREATE TABLE `kategori_bahan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `kategori_barang` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### Key Technical Considerations

- **Separation of Domains**: Materials and finished goods maintain isolated category tables in MariaDB schema. They are maintained separately in distinct pages and services to prevent accidental cross-contamination.
- **Color Coding**: Visual badges render with dynamic inline border and text color matching hex values (e.g. `#2980b9`, `#811818`), enhancing visual identification in tables and dropdowns.

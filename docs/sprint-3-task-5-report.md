# Sprint 3 — Task 5 Implementation Report: Master Data Produk

## 1. Executive Summary

Task 5 implements the **Master Data Produk** (Finished Goods / Products) module for Impact Furniture v2, replacing legacy PHP 5 / CodeIgniter 3 screens. Based directly on SQL tables `produk` and `produk_foto`, the module provides comprehensive CRUD, thumbnail image rendering in the data table, file drag-and-drop simulation for primary product photo and additional multi-photo gallery (`produk_foto`), stock alert indicators (when `qty <= min_qty`), IDR currency formatting, multi-attribute filtering (category, warehouse, status), PDF export, Excel export, and Excel batch import with template generation.

---

## 2. Key Deliverables & Architecture

| Deliverable           | Location                                                               | Description                                                                                                                                                 |
| :-------------------- | :--------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain Types**      | `app/src/modules/inventory/products/types/product.types.ts`            | TypeScript definitions: `Produk`, `ProdukFoto`, `CreateProductDto`, `UpdateProductDto`.                                                                     |
| **Mock Service**      | `app/src/modules/inventory/products/services/product.service.ts`       | Complete in-memory implementation of `CrudService` with search, multi-filter, pagination, cascading photo gallery deletion, `exportAll`, and `importBatch`. |
| **Import Config**     | `app/src/modules/inventory/products/utils/product-import.config.ts`    | Template definition `PRODUCT_IMPORT_TEMPLATE` and row validator `productRowMapper`.                                                                         |
| **List Page**         | `app/src/modules/inventory/products/pages/ProductListPage.vue`         | Responsive data table with product thumbnails, stock badges, stock deficit warning icons, PDF/Excel export, Excel import, and skeleton loading.             |
| **Form Modal**        | `app/src/modules/inventory/products/components/ProductFormModal.vue`   | Modal form featuring photo file upload with live DataURL preview, secondary gallery photo upload, explicit form labels, and validations.                    |
| **Detail Modal**      | `app/src/modules/inventory/products/components/ProductDetailModal.vue` | Read-only modal displaying primary photo, photo gallery, formatted price in IDR, stock status metrics, and audit timestamps.                                |
| **Route Integration** | `app/src/app/router/routes.ts`                                         | Route `/inventory/products` with RBAC permission `inventory.products`.                                                                                      |
| **Unit Test Suite**   | `app/tests/unit/modules/inventory/ProductCrud.spec.ts`                 | 10 unit tests covering service CRUD, stock alerts, cascading photo deletion, Excel import mapping, and UI component rendering.                              |

---

## 3. Database Schema Fidelity

Directly extracted from `u1573701_smm.sql`:

```sql
CREATE TABLE `produk` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `min_qty` int(11) DEFAULT NULL,
  `satuan_barang_id` int(10) UNSIGNED DEFAULT NULL,
  `kategori_barang_id` int(10) UNSIGNED DEFAULT NULL,
  `gudang_id` int(10) UNSIGNED DEFAULT NULL,
  `harga` int(11) DEFAULT NULL,
  `foto` text DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `produk_foto` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `produk_id` int(10) UNSIGNED NOT NULL,
  `foto` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);
```

### Key Technical Considerations

- **Photo Handling (`foto` & `produk_foto`)**: While the database stores path/URL strings in `foto` (text) and `produk_foto.foto` (varchar), the UI provides a real `<input type="file" accept="image/*">` with FileReader DataURL simulation for local preview and instant reactive feedback.
- **Cascading Deletes**: When a product is deleted, all corresponding gallery entries in `produk_foto` are automatically removed to prevent orphaned records.
- **Stock Safeguard**: Products calculate `is_low_stock: qty <= min_qty` dynamically, presenting a warning indicator and restock badge.

---

## 4. Test Verification

- `ProductCrud.spec.ts`: 10/10 tests passed.
- Production build succeeded without TypeScript or lint warnings.

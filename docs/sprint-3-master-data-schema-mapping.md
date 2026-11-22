# Sprint 3 — Master Data Schema Mapping Document

## 1. Overview

This document provides a single source of truth mapping all MariaDB SQL database tables from `u1573701_smm.sql` to their corresponding Vue 3 frontend models, services, routes, and UI components implemented in Sprint 3.

---

## 2. Table-to-Module Mapping

| Task        | Database Table             | Primary Key        | Key Foreign Keys / Relations                          | Frontend Route                  | TypeScript Interface     | Service Class             |
| :---------- | :------------------------- | :----------------- | :---------------------------------------------------- | :------------------------------ | :----------------------- | :------------------------ |
| **Task 2**  | `master_data_suplier`      | `id`               | `province_id`, `city_id`                              | `/procurement/suppliers`        | `MasterDataSuplier`      | `SupplierService`         |
| **Task 2**  | `additional_data_suplier`  | `id`               | `supplier_id` -> `master_data_suplier.id`             | Embedded in Supplier            | `AdditionalDataSuplier`  | `SupplierService`         |
| **Task 3**  | `master_data_customer`     | `id`               | `province_id`, `city_id`                              | `/sales/customers`              | `MasterDataCustomer`     | `CustomerService`         |
| **Task 3**  | `additional_data_customer` | `id`               | `customer_id` -> `master_data_customer.id`            | Embedded in Customer            | `AdditionalDataCustomer` | `CustomerService`         |
| **Task 4**  | `master_data_bahan`        | `id`               | `satuan_pakai_id`, `satuan_beli_id`, `gudang_id`      | `/inventory/materials`          | `MasterDataBahan`        | `MaterialService`         |
| **Task 4**  | `konversi_satuan_bahan`    | `id`               | `bahan_id` -> `master_data_bahan.id`, `satuan_id`     | Embedded in Material            | `KonversiSatuanBahan`    | `MaterialService`         |
| **Task 5**  | `produk`                   | `id`               | `satuan_barang_id`, `kategori_barang_id`, `gudang_id` | `/inventory/products`           | `Produk`                 | `ProductService`          |
| **Task 5**  | `produk_foto`              | `id`               | `produk_id` -> `produk.id`                            | Embedded in Product             | `ProdukFoto`             | `ProductService`          |
| **Task 6**  | `gudang`                   | `id`               | -                                                     | `/settings/warehouses`          | `Gudang`                 | `WarehouseService`        |
| **Task 6**  | `bank`                     | `id`               | -                                                     | `/settings/banks`               | `Bank`                   | `BankService`             |
| **Task 7**  | `kategori_bahan`           | `id`               | -                                                     | `/settings/material-categories` | `KategoriBahan`          | `MaterialCategoryService` |
| **Task 7**  | `kategori_barang`          | `id`               | -                                                     | `/settings/product-categories`  | `KategoriBarang`         | `ProductCategoryService`  |
| **Task 8**  | `satuan_beli`              | `id`               | -                                                     | `/settings/material-units`      | `SatuanBeli`             | `SatuanBeliService`       |
| **Task 8**  | `satuan_pakai`             | `id`               | `satuan_beli_id` -> `satuan_beli.id`                  | `/settings/material-units`      | `SatuanPakai`            | `SatuanPakaiService`      |
| **Task 8**  | `satuan_barang`            | `id`               | -                                                     | `/settings/product-units`       | `SatuanBarang`           | `SatuanBarangService`     |
| **Task 9**  | `ppn`                      | `id`               | -                                                     | `/settings/tax`                 | `Ppn`                    | `TaxService`              |
| **Task 9**  | `setting_table`            | `id_setting_table` | -                                                     | `/settings/app`                 | `AppSetting`             | `AppSettingService`       |
| **Task 10** | `jabatan`                  | `id`               | -                                                     | `/settings/positions`           | `Jabatan`                | `PositionService`         |
| **Task 10** | `status_karyawan`          | `id`               | -                                                     | `/settings/employee-statuses`   | `StatusKaryawan`         | `EmployeeStatusService`   |

---

## 3. Critical Field Rules & Invariants

1. **`bank.rekening`**: Strictly handled as `string` to prevent loss of leading zeros.
2. **`ppn.nama`**: Stored as `INT(11)` representing the tax percentage value (e.g., 11 for 11%). `is_active` enforces a single active tax rate.
3. **`satuan_beli.default`**: Mutual exclusivity flag where only one purchasing unit holds `default: 1`.
4. **`satuan_pakai.pembagi`**: Decimal field `DECIMAL(20,6)` with mandatory validation `pembagi > 0` to prevent division-by-zero errors in inventory stock conversions.
5. **`jabatan.is_deleted`**: In legacy MariaDB semantics, `1` indicates an active record, and `0` indicates a soft-deleted record.
6. **`produk.foto` & `master_data_bahan.foto`**: Image upload utilizes file picker / dropzone with live DataURL simulation for preview and immediate visual feedback.

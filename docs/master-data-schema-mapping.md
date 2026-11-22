# Master Data Database Schema Mapping — Impact Furniture v2

## 1. Overview

This document defines the strict mapping between the legacy MariaDB SQL database tables and the TypeScript domain interfaces implemented in Sprint 3. The frontend is guaranteed not to invent arbitrary business fields or mutate database definitions.

---

## 2. Supplier Mapping

### Table `master_data_suplier`

| MariaDB Column | Type             | Nullable   | TypeScript Attribute        | UI Input / Display Component            |
| :------------- | :--------------- | :--------- | :-------------------------- | :-------------------------------------- |
| `id`           | int(10) unsigned | NO (PK)    | `id: number`                | Read-only in detail / table             |
| `kode`         | varchar(255)     | NO         | `kode: string`              | Text input, required, uppercase         |
| `nama`         | varchar(255)     | NO         | `nama: string`              | Text input, required                    |
| `no_hp`        | varchar(255)     | NO         | `no_hp: string`             | Text input, phone pattern               |
| `city_id`      | int(10) unsigned | YES        | `city_id: number \| null`   | Cascading Select (filtered by province) |
| `alamat`       | text             | YES        | `alamat: string \| null`    | Textarea                                |
| `email`        | varchar(255)     | NO         | `email: string`             | Text input, email type                  |
| `deskripsi`    | text             | YES        | `deskripsi: string \| null` | Textarea                                |
| `status`       | tinyint(1)       | NO (Def 1) | `status: number`            | Select dropdown (Aktif / Nonaktif)      |
| `created_at`   | timestamp        | NO         | `created_at: string`        | Audit timestamp in Detail Modal         |
| `created_by`   | int(10) unsigned | NO         | `created_by: number`        | Auth user ID reference                  |
| `updated_at`   | timestamp        | NO         | `updated_at: string`        | Audit timestamp in Detail Modal         |
| `updated_by`   | int(10) unsigned | NO         | `updated_by: number`        | Auth user ID reference                  |

### Table `additional_master_data_supplier`

| MariaDB Column | Type             | Nullable | TypeScript Attribute   | Notes                                   |
| :------------- | :--------------- | :------- | :--------------------- | :-------------------------------------- |
| `id`           | int(10) unsigned | NO (PK)  | `id?: number`          | Auto increment                          |
| `supplier_id`  | int(10) unsigned | NO       | `supplier_id?: number` | Foreign key to `master_data_suplier.id` |
| `name`         | varchar(255)     | NO       | `name: string`         | Contact Name / Role                     |
| `value`        | varchar(255)     | NO       | `value: string`        | Contact Phone / Email / Notes           |

---

## 3. Customer Mapping

### Table `master_data_customer`

| MariaDB Column | Type             | Nullable | TypeScript Attribute          | UI Input / Display Component                |
| :------------- | :--------------- | :------- | :---------------------------- | :------------------------------------------ |
| `id`           | int(10) unsigned | NO (PK)  | `id: number`                  | Read-only in detail / table                 |
| `kode`         | varchar(255)     | YES      | `kode: string \| null`        | Text input (auto-generated if empty)        |
| `nama`         | varchar(255)     | YES      | `nama: string \| null`        | Text input (required in UI for ERP clarity) |
| `no_hp`        | varchar(255)     | YES      | `no_hp: string \| null`       | Text input, phone pattern                   |
| `alamat`       | text             | YES      | `alamat: string \| null`      | Textarea                                    |
| `province_id`  | int(10) unsigned | YES      | `province_id: number \| null` | Province Select                             |
| `city_id`      | int(10) unsigned | YES      | `city_id: number \| null`     | City Select                                 |
| `email`        | varchar(255)     | YES      | `email: string \| null`       | Text input, email type                      |
| `deskripsi`    | text             | YES      | `deskripsi: string \| null`   | Textarea                                    |
| `status`       | tinyint(1)       | YES      | `status: number \| null`      | Select dropdown                             |
| `created_at`   | timestamp        | YES      | `created_at: string \| null`  | Audit timestamp                             |
| `created_by`   | int(10) unsigned | YES      | `created_by: number \| null`  | Auth user ID reference                      |
| `updated_at`   | timestamp        | YES      | `updated_at: string \| null`  | Audit timestamp                             |
| `updated_by`   | int(10) unsigned | YES      | `updated_by: number \| null`  | Auth user ID reference                      |

### Table `additional_master_data_customer`

| MariaDB Column | Type             | Nullable | TypeScript Attribute   | Notes                                    |
| :------------- | :--------------- | :------- | :--------------------- | :--------------------------------------- |
| `id`           | int(10) unsigned | NO (PK)  | `id?: number`          | Auto increment                           |
| `customer_id`  | int(10) unsigned | NO       | `customer_id?: number` | Foreign key to `master_data_customer.id` |
| `name`         | varchar(255)     | NO       | `name: string`         | Contact Name / Role                      |
| `value`        | varchar(255)     | NO       | `value: string`        | Contact Detail / Notes                   |

---

## 4. Bahan (Raw Material) Mapping

### Table `master_data_bahan`

| MariaDB Column    | Type             | Nullable | TypeScript Attribute              | UI Input / Display Component                   |
| :---------------- | :--------------- | :------- | :-------------------------------- | :--------------------------------------------- |
| `id`              | int(10) unsigned | NO (PK)  | `id: number`                      | Read-only in detail / table                    |
| `kode`            | varchar(255)     | YES      | `kode: string \| null`            | Text input (auto-generated if empty)           |
| `nama`            | varchar(255)     | YES      | `nama: string \| null`            | Text input (required in UI)                    |
| `min_qty`         | int(11)          | YES      | `min_qty: number \| null`         | Number input (minimum threshold)               |
| `qty`             | int(11)          | YES      | `qty: number \| null`             | **Disabled on edit** (Audit rule for Sprint 5) |
| `satuan_pakai_id` | int(10) unsigned | YES      | `satuan_pakai_id: number \| null` | Satuan Pakai Select (e.g. Lembar, Meter)       |
| `satuan_beli_id`  | int(10) unsigned | YES      | `satuan_beli_id: number \| null`  | Satuan Beli Select (e.g. Roll, Batang)         |
| `gudang_id`       | int(10) unsigned | YES      | `gudang_id: number \| null`       | Gudang Select                                  |
| `status`          | tinyint(1)       | YES      | `status: number \| null`          | Select dropdown                                |
| `harga_satuan`    | decimal(20,2)    | YES      | `harga_satuan: number \| null`    | Currency number input with IDR prefix          |
| `foto`            | text             | YES      | `foto: string \| null`            | Image upload mock                              |
| `deskripsi`       | text             | YES      | `deskripsi: string \| null`       | Textarea                                       |

### Table `konversi_satuan_bahan`

| MariaDB Column | Type             | Nullable   | TypeScript Attribute | Notes                                 |
| :------------- | :--------------- | :--------- | :------------------- | :------------------------------------ |
| `id`           | int(10) unsigned | NO (PK)    | `id?: number`        | Auto increment                        |
| `bahan_id`     | int(10) unsigned | NO         | `bahan_id?: number`  | Foreign key to `master_data_bahan.id` |
| `satuan_id`    | int(10) unsigned | NO         | `satuan_id: number`  | Target unit reference ID              |
| `nilai`        | int(11)          | NO         | `nilai: number`      | Conversion factor value               |
| `default`      | tinyint(4)       | NO (Def 0) | `default: number`    | Default conversion flag (1 or 0)      |

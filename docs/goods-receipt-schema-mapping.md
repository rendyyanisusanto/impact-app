# GOODS RECEIPT (PENERIMAAN BARANG) SCHEMA MAPPING SPECIFICATION

## 1. Overview

This document specifies the exact mapping between legacy MariaDB database tables (`penerimaan_barang` and `detail_penerimaan_barang`) from `u1573701_smm(2).sql` and the TypeScript interface contracts in `app/src/modules/procurement/goods-receipts/types/goods-receipt.types.ts`.

---

## 2. Table: `penerimaan_barang` (Goods Receipt Header)

### 2.1 Database Columns & Field Mapping

| Legacy Column       | Legacy Type     | Nullable | Default             | TypeScript Property | Type             | Business Logic / Notes                         |
| :------------------ | :-------------- | :------- | :------------------ | :------------------ | :--------------- | :--------------------------------------------- |
| `id`                | `int unsigned`  | NO       | Auto Increment      | `id`                | `number`         | Primary key                                    |
| `kode`              | `varchar(255)`  | YES      | `NULL`              | `kode`              | `string \| null` | PB document number (e.g. `PB-20241230-0001`)   |
| `purchase_order_id` | `int unsigned`  | YES      | `NULL`              | `purchase_order_id` | `number \| null` | Foreign key to `purchase_order.id`             |
| `no_surat_jalan`    | `varchar(255)`  | YES      | `NULL`              | `no_surat_jalan`    | `string \| null` | Vendor delivery note / DO tracking number      |
| `gudang_id`         | `int`           | YES      | `NULL`              | `gudang_id`         | `number \| null` | Receiving warehouse location (`gudang.id`)     |
| `tanggal`           | `date`          | YES      | `NULL`              | `tanggal`           | `string \| null` | Physical arrival date (`YYYY-MM-DD`)           |
| `nama_pengirim`     | `varchar(255)`  | YES      | `NULL`              | `nama_pengirim`     | `string \| null` | Driver / freight forwarder name                |
| `keterangan`        | `varchar(255)`  | YES      | `NULL`              | `keterangan`        | `string \| null` | Document remarks and arrival condition notes   |
| `status`            | `tinyint(1)`    | YES      | `NULL`              | `status`            | `number \| null` | `1` = Diterima (Final), `0` = Draft            |
| `status_aktif`      | `tinyint(1)`    | NO       | `1`                 | `status_aktif`      | `number`         | Soft delete flag: `1` = active, `0` = canceled |
| `total_pembayaran`  | `decimal(20,2)` | YES      | `NULL`              | `total_pembayaran`  | `number \| null` | Payment ledger accumulator (untouched)         |
| `nilai_pb`          | `decimal(20,2)` | YES      | `NULL`              | `nilai_pb`          | `number \| null` | Gross intake value of accepted materials       |
| `is_ppn`            | `tinyint(1)`    | NO       | `0`                 | `is_ppn`            | `number`         | `1` = PPN taxable, `0` = non-taxable           |
| `ppn_id`            | `int`           | YES      | `NULL`              | `ppn_id`            | `number \| null` | Foreign key to active `ppn.id`                 |
| `subtotal`          | `decimal(20,2)` | YES      | `NULL`              | `subtotal`          | `number \| null` | Line totals subtotal                           |
| `diskon`            | `decimal(20,2)` | YES      | `NULL`              | `diskon`            | `number \| null` | Document global discount nominal               |
| `total_ppn`         | `decimal(20,2)` | YES      | `NULL`              | `total_ppn`         | `number \| null` | Tax nominal                                    |
| `total`             | `decimal(20,2)` | YES      | `NULL`              | `total`             | `number \| null` | Grand total after discount and tax             |
| `uuid`              | `text`          | YES      | `NULL`              | `uuid`              | `string \| null` | Universal unique identifier                    |
| `created_at`        | `timestamp`     | NO       | `CURRENT_TIMESTAMP` | `created_at`        | `string`         | Audit creation timestamp                       |
| `created_by`        | `int`           | YES      | `NULL`              | `created_by`        | `number \| null` | User ID creator                                |
| `updated_at`        | `timestamp`     | NO       | `CURRENT_TIMESTAMP` | `updated_at`        | `string`         | Audit modification timestamp                   |
| `updated_by`        | `int`           | YES      | `NULL`              | `updated_by`        | `number \| null` | User ID last updater                           |

---

## 3. Table: `detail_penerimaan_barang` (Goods Receipt Lines)

### 3.1 Database Columns & Field Mapping

| Legacy Column          | Legacy Type     | Nullable | Default        | TypeScript Property    | Type             | Business Logic / Notes                  |
| :--------------------- | :-------------- | :------- | :------------- | :--------------------- | :--------------- | :-------------------------------------- |
| `id`                   | `int unsigned`  | NO       | Auto Increment | `id`                   | `number`         | Primary key                             |
| `penerimaan_barang_id` | `int unsigned`  | YES      | `NULL`         | `penerimaan_barang_id` | `number \| null` | Foreign key to `penerimaan_barang.id`   |
| `bahan_id`             | `int`           | YES      | `NULL`         | `bahan_id`             | `number \| null` | Foreign key to `master_data_bahan.id`   |
| `qty_pesan`            | `int`           | YES      | `NULL`         | `qty_pesan`            | `number \| null` | Ordered quantity from PO detail         |
| `qty_terima`           | `int`           | YES      | `NULL`         | `qty_terima`           | `number \| null` | Actual physical quantity received       |
| `satuan_beli_id`       | `int`           | YES      | `NULL`         | `satuan_beli_id`       | `number \| null` | Foreign key to `satuan_beli.id`         |
| `harga_satuan`         | `decimal(20,2)` | YES      | `NULL`         | `harga_satuan`         | `number \| null` | Purchasing unit price from PO           |
| `diskon`               | `int`           | YES      | `NULL`         | `diskon`               | `number \| null` | Line item discount percentage (0 - 100) |

> [!IMPORTANT]
> **Schema Difference from Purchase Order**:
> Unlike `detail_purchase_order`, the `detail_penerimaan_barang` table in MariaDB **DOES NOT** contain a `subtotal` column or a `keterangan` column.
> Therefore:
>
> 1. `subtotal` is handled strictly as a **UI-only calculated field**:
>    $$\text{subtotal} = \text{roundDecimal}(\text{qty\_terima} \times \text{harga\_satuan} \times (1 - \text{diskon} / 100))$$
> 2. `subtotal` is never included in the database payload of `detail_penerimaan_barang`.
> 3. No item-level remarks (`keterangan`) input exists on receipt detail rows; document remarks are captured globally on the header.

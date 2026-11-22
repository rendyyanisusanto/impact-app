# SPRINT 5 — FITUR 1: MUTASI STOK BAHAN

## DATABASE SCHEMA AUDIT & TYPESCRIPT MAPPING

### 1. MariaDB Legacy Schema Audit (`u1573701_smm.sql`)

Berdasarkan audit langsung terhadap file SQL dump MariaDB legacy `u1573701_smm.sql`, ditemukan struktur tabel, view, dan trigger mutasi bahan sebagai berikut:

#### A. Tabel Header: `mutasi_bahan`

| Field Database | Tipe Data Legacy | Nullable | Deskripsi & Nilai Default                     | Pemetaan Frontend TypeScript (`MaterialMutation`) |
| :------------- | :--------------- | :------- | :-------------------------------------------- | :------------------------------------------------ |
| `id`           | `int(11)`        | NO       | Primary Key, Auto Increment                   | `id: number`                                      |
| `kode`         | `text`           | YES      | Kode transaksi mutasi (cth: `MB/2406-2425/1`) | `kode: string`                                    |
| `tanggal`      | `date`           | YES      | Tanggal mutasi (format `YYYY-MM-DD`)          | `tanggal: string`                                 |
| `keterangan`   | `text`           | YES      | Catatan keperluan / divisi / PIC              | `keterangan: string \| null`                      |
| `status`       | `tinyint(1)`     | YES      | 1 = Selesai/Posted, 0 = Draft                 | `status: number`                                  |
| `created_at`   | `timestamp`      | YES      | Current timestamp pembuatan                   | `created_at: string`                              |
| `created_by`   | `int(11)`        | YES      | ID user pembuat dokumen                       | `created_by: number \| null`                      |
| `status_aktif` | `int(1)`         | YES      | 1 = Aktif, 0 = Dihapus / Batal                | `status_aktif: number`                            |
| `uuid`         | `text`           | YES      | Unique UUID identifier                        | `uuid: string \| null`                            |

#### B. Tabel Detail: `detail_mutasi_bahan`

| Field Database    | Tipe Data Legacy | Nullable | Deskripsi & Relasi                                 | Pemetaan Frontend TypeScript (`MaterialMutationDetail`) |
| :---------------- | :--------------- | :------- | :------------------------------------------------- | :------------------------------------------------------ |
| `id`              | `int(11)`        | NO       | Primary Key, Auto Increment                        | `id: number`                                            |
| `mutasi_bahan_id` | `int(11)`        | YES      | Foreign Key ke `mutasi_bahan.id`                   | `mutasi_bahan_id: number`                               |
| `bahan_id`        | `int(11)`        | YES      | Foreign Key ke `master_data_bahan.id`              | `bahan_id: number`                                      |
| `qty`             | `int(11)`        | YES      | Kuantitas bahan yang dimutasi                      | `qty: number`                                           |
| `satuan_beli_id`  | `int(11)`        | YES      | Foreign Key ke `satuan_beli.id` / satuan unit      | `satuan_beli_id: number \| null`                        |
| `keterangan`      | `text`           | YES      | Catatan baris per item (PIC / divisi / peruntukan) | `keterangan: string \| null`                            |

#### C. Database View: `v_detail_mutasi_bahan`

```sql
CREATE ALGORITHM=UNDEFINED DEFINER=`u1573701`@`localhost` SQL SECURITY DEFINER VIEW `v_detail_mutasi_bahan` AS
SELECT
  `mutasi_bahan`.`kode` AS `kode`,
  `mutasi_bahan`.`tanggal` AS `tanggal`,
  `mutasi_bahan`.`keterangan` AS `keterangan`,
  `mutasi_bahan`.`status` AS `status`,
  `mutasi_bahan`.`created_at` AS `created_at`,
  `mutasi_bahan`.`created_by` AS `created_by`,
  (SELECT `satuan_beli`.`id` FROM `satuan_beli` WHERE `detail_mutasi_bahan`.`satuan_beli_id` = `satuan_beli`.`id`) AS `id_satuan`,
  (SELECT `satuan_beli`.`nama` FROM `satuan_beli` WHERE `detail_mutasi_bahan`.`satuan_beli_id` = `satuan_beli`.`id`) AS `nama_satuan`,
  `detail_mutasi_bahan`.`mutasi_bahan_id` AS `mutasi_bahan_id`,
  `detail_mutasi_bahan`.`bahan_id` AS `bahan_id`,
  `detail_mutasi_bahan`.`qty` AS `qty`,
  `detail_mutasi_bahan`.`satuan_beli_id` AS `satuan_beli_id`,
  `master_data_bahan`.`nama` AS `nama`,
  `master_data_bahan`.`kode` AS `kode_bahan`,
  `master_data_bahan`.`gudang_id` AS `gudang_id`,
  `master_data_bahan`.`harga_satuan` AS `harga_satuan`,
  `detail_mutasi_bahan`.`id` AS `id`,
  `detail_mutasi_bahan`.`keterangan` AS `keterangan_detail`
FROM ((`mutasi_bahan`
JOIN `detail_mutasi_bahan` ON `mutasi_bahan`.`id` = `detail_mutasi_bahan`.`mutasi_bahan_id`))
JOIN `master_data_bahan` ON `detail_mutasi_bahan`.`bahan_id` = `master_data_bahan`.`id`;
```

#### D. Tabel Kartu Stok: `histori_stok_bahan`

Dalam sistem legacy, saat mutasi berstatus 1 (Selesai/Terverifikasi), stok bahan dipotong dan dicatat ke kartu persediaan:

```sql
INSERT INTO `histori_stok_bahan` (
  `id`, `bahan_id`, `keterangan`, `tanggal`, `created_at`, `created_by`,
  `updated_at`, `updated_by`, `kode`, `masuk`, `keluar`, `tbl`, `tbl_id`
) VALUES (
  1, 586, 'Mutasi Bahan MB/2406-2425/1 2024-06-05', '2024-06-05', '2024-11-06 12:44:53',
  NULL, NULL, NULL, 'MB/2406-2425/1', 0, 3, 'mutasi_bahan', 5
);
```

Atribut posting:

- `tbl`: `'mutasi_bahan'`
- `tbl_id`: ID dari transaksi mutasi bahan
- `kode`: Kode dokumen mutasi (cth: `MB/202610-0001`)
- `masuk`: `0`
- `keluar`: Kuantitas mutasi (dalam satuan standar / pakai)
- `keterangan`: Format standar `'Mutasi Bahan ' + kode + ' ' + tanggal`

---

### 2. TypeScript Domain Models

Semua interface terdefinisi ketat di `src/modules/inventory/material-mutations/types/material-mutation.types.ts` tanpa dependensi `any`.

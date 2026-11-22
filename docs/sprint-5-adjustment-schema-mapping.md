# Sprint 5 — Fitur 2: Penyesuaian Stok Bahan (Stock Adjustment) Schema Mapping

## 1. Executive Summary

Fitur **Penyesuaian Stok Bahan (Stock Adjustment)** pada Impact Furniture v2 memetakan struktur database MariaDB legacy dari file `u1573701_smm.sql`. Modul ini digunakan untuk mencatat berita acara stock opname fisik gudang, membandingkan saldo sistem vs saldo fisik, menghitung selisih kuantitas dan nilai, serta membukukan pergerakan stok ke buku besar persediaan (`histori_stok_bahan`).

---

## 2. Tabel Utama: `penyesuaian_stok`

Mencatat header dokumen penyesuaian stok.

| Field Database | Tipe Data Legacy         | TypeScript Interface  | Keterangan & Aturan Bisnis                                                                             |
| -------------- | ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`           | `int(11) AUTO_INCREMENT` | `number`              | Primary Key                                                                                            |
| `kode`         | `varchar(255)`           | `string`              | Nomor dokumen unik. Format: `PS/YYYY/MM/NNNN` (berdasarkan setting `PS/{year}/{month}/{order_number}`) |
| `tanggal`      | `date`                   | `string` (YYYY-MM-DD) | Tanggal pelaksanaan stock opname                                                                       |
| `keterangan`   | `text NULL`              | `string \| null`      | Keterangan atau alasan umum penyesuaian                                                                |
| `status`       | `tinyint(1)`             | `number`              | Status dokumen: `0 = Draft`, `1 = Selesai / Posted`                                                    |
| `status_aktif` | `tinyint(1)`             | `number`              | Status aktif: `1 = Aktif`, `0 = Dibatalkan / Terhapus`                                                 |
| `created_at`   | `timestamp`              | `string`              | Waktu pencatatan dokumen                                                                               |
| `created_by`   | `int(11)`                | `number \| null`      | ID User pembuat dokumen                                                                                |
| `updated_at`   | `timestamp NULL`         | `string \| null`      | Waktu revisi terakhir                                                                                  |
| `updated_by`   | `int(11) NULL`           | `number \| null`      | ID User pengubah dokumen                                                                               |
| `uuid`         | `varchar(36) NULL`       | `string \| null`      | UUID sinkronisasi                                                                                      |

---

## 3. Tabel Rincian: `detail_penyesuaian_stok`

Mencatat baris bahan baku yang disesuaikan dalam dokumen opname.

| Field Database        | Tipe Data Legacy         | TypeScript Interface | Keterangan & Perhitungan                                               |
| --------------------- | ------------------------ | -------------------- | ---------------------------------------------------------------------- |
| `id`                  | `int(11) AUTO_INCREMENT` | `number`             | Primary Key detail                                                     |
| `penyesuaian_stok_id` | `int(11)`                | `number`             | Foreign Key ke `penyesuaian_stok.id`                                   |
| `bahan_id`            | `int(11)`                | `number`             | Foreign Key ke `bahan.id` (Master Bahan Baku)                          |
| `stok_awal`           | `int(11)`                | `number`             | **Stok Sistem** saat penyesuaian dicatat (saldo persediaan di sistem)  |
| `stok_akhir`          | `int(11)`                | `number`             | **Stok Fisik** hasil penghitungan fisik opname di gudang               |
| `keterangan`          | `text NULL`              | `string \| null`     | Keterangan per baris bahan (misal: "Kemasan sobek", "Kelebihan kirim") |

### Perhitungan Turunan (Computed Client & Service Side):

- $\text{Selisih Qty} = \text{stok\_akhir} - \text{stok\_awal}$
  - Jika $\text{Selisih} > 0$: Stok fisik lebih banyak $\rightarrow$ surplus / masuk.
  - Jika $\text{Selisih} < 0$: Stok fisik lebih sedikit $\rightarrow$ susut / keluar.
  - Jika $\text{Selisih} = 0$: Stok fisik cocok.
- $\text{Nilai Selisih} = \text{Selisih Qty} \times \text{harga\_satuan}$

---

## 4. Tabel Buku Besar Pergerakan: `histori_stok_bahan`

Setiap kali dokumen penyesuaian berstatus `1` (Selesai/Posted), sistem memotong/menambah saldo master `bahan.qty` dan mencatat jurnal pergerakan stok:

| Field `histori_stok_bahan` | Nilai jika Selisih Positif ($> 0$)             | Nilai jika Selisih Negatif ($< 0$)             |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `bahan_id`                 | `detail.bahan_id`                              | `detail.bahan_id`                              |
| `masuk`                    | $\text{stok\_akhir} - \text{stok\_awal}$       | `0`                                            |
| `keluar`                   | `0`                                            | $\text{stok\_awal} - \text{stok\_akhir}$       |
| `tbl`                      | `'penyesuaian_stok'`                           | `'penyesuaian_stok'`                           |
| `tbl_id`                   | `penyesuaian_stok.id`                          | `penyesuaian_stok.id`                          |
| `kode`                     | `penyesuaian_stok.kode`                        | `penyesuaian_stok.kode`                        |
| `tanggal`                  | `penyesuaian_stok.tanggal`                     | `penyesuaian_stok.tanggal`                     |
| `keterangan`               | `'Penyesuaian stok ' + kode + ' - ' + tanggal` | `'Penyesuaian stok ' + kode + ' - ' + tanggal` |
| `created_by`               | User ID pembuat / login aktif                  | User ID pembuat / login aktif                  |

---

## 5. Scope Boundary Validation

- **Purchase Order & Goods Receipt**: Tetap menggunakan format dan workflow masing-masing.
- **Import Excel**: Dokumen Penyesuaian Stok **TIDAK MENGGUNAKAN IMPORT EXCEL** (sesuai instruksi ketat user).
- **Export Excel & PDF**: Disediakan pada list view dan single detail document.

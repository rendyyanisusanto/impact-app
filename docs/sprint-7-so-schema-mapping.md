# SPRINT 7 — SALES ORDER SCHEMA MAPPING & DATABASE AUDIT

Dokumen ini memetakan seluruh struktur tabel MariaDB legacy `u1573701_smm(2).sql` yang mendasari fitur Penjualan (Sales Order: SO Impact, SO Pola, dan SO KS) ke model TypeScript di frontend Impact Furniture V2.

---

## 1. STRUKTUR TABEL HEADER: `sales_order`

Tabel utama penyimpan data transaksi Sales Order adalah `sales_order`. Discriminator pembeda varian bisnis adalah kolom `order_type`.

| Nama Kolom SQL    | Tipe Data SQL                       | Pemetaan TypeScript   | Deskripsi & Aturan Bisnis                              |
| ----------------- | ----------------------------------- | --------------------- | ------------------------------------------------------ |
| `id`              | `int(11)` Auto Increment            | `number`              | Primary key transaksi SO                               |
| `kode`            | `varchar(50)`                       | `string`              | Nomor dokumen SO terformat sesuai setting varian       |
| `customer_id`     | `int(11)`                           | `number`              | Foreign key ke tabel `customer.id`                     |
| `tanggal`         | `date`                              | `string` (YYYY-MM-DD) | Tanggal transaksi diterbitkan                          |
| `sales_id`        | `int(11)`                           | `number`              | Foreign key ke `karyawan.id` (`jabatan_id: 1011`)      |
| `is_ppn`          | `int(11)`                           | `number` (1 / 0)      | Flag pengenaan PPN (1 = Ya untuk Impact, 0 = Non-PPN)  |
| `ppn_id`          | `int(11)`                           | `number \| null`      | Foreign key ke tabel tarif `ppn.id`                    |
| `subtotal`        | `double`                            | `number`              | Total akumulasi subtotal produk sebelum PPN            |
| `diskon`          | `double`                            | `number`              | Nilai diskon faktur (persen atau amount)               |
| `total_ppn`       | `double`                            | `number`              | Nilai nominal PPN (11% pada Impact, 0 pada Pola & KS)  |
| `total`           | `double`                            | `number`              | Total neto transaksi (subtotal + biaya tambahan + PPN) |
| `status`          | `int(11)`                           | `number` (0 / 1)      | Status dokumen (0 = Draft, 1 = Succeeded / Posted)     |
| `status_produksi` | `int(11)`                           | `number` (0 / 1)      | Indikator kebutuhan produksi dari pesanan              |
| `status_aktif`    | `int(11)`                           | `number` (1 / 0)      | Status aktif dokumen (1 = Aktif, 0 = Batal / Void)     |
| `count_print`     | `int(11)`                           | `number`              | Frekuensi cetak nota transaksi                         |
| `no_faktur_pajak` | `varchar(50)`                       | `string \| null`      | Nomor seri faktur pajak standar DJP (hanya SO Impact)  |
| `order_type`      | `enum('PPN','NON_PPN','NON_PPN_2')` | `string`              | Discriminator varian transaksi bisnis                  |
| `keterangan`      | `text`                              | `string \| null`      | Catatan transaksi                                      |

---

## 2. STRUKTUR TABEL DETAIL ITEM: `detail_sales_order`

Menyimpan daftar produk furniture (barang jadi) yang dipesan.

| Nama Kolom SQL    | Tipe Data SQL            | Pemetaan TypeScript | Deskripsi & Aturan Bisnis                       |
| ----------------- | ------------------------ | ------------------- | ----------------------------------------------- |
| `id`              | `int(11)` Auto Increment | `number`            | Primary key baris item                          |
| `sales_order_id`  | `int(11)`                | `number`            | Foreign key ke `sales_order.id`                 |
| `produk_id`       | `int(11)`                | `number`            | Foreign key ke `produk.id` (Master Barang Jadi) |
| `qty`             | `double`                 | `number`            | Jumlah unit yang dipesan (> 0)                  |
| `harga`           | `double`                 | `number`            | Harga satuan barang (Rp)                        |
| `diskon`          | `double`                 | `number`            | Diskon per baris barang (%)                     |
| `subtotal`        | `double`                 | `number`            | `qty * harga * (1 - diskon / 100)`              |
| `status_produksi` | `int(11)`                | `number` (0 / 1)    | Jenis Stok: 0 = Ready Stock, 1 = Produksi       |
| `keterangan`      | `text`                   | `string \| null`    | Keterangan spesifikasi khusus per baris         |

---

## 3. STRUKTUR TABEL BIAYA TAMBAHAN: `komponen_sales_order`

Menyimpan komponen biaya tambahan di luar produk (ongkos kirim, packing kayu, jasa modifikasi).

| Nama Kolom SQL   | Tipe Data SQL            | Pemetaan TypeScript | Deskripsi & Aturan Bisnis                       |
| ---------------- | ------------------------ | ------------------- | ----------------------------------------------- |
| `id`             | `int(11)` Auto Increment | `number`            | Primary key baris komponen                      |
| `sales_order_id` | `int(11)`                | `number`            | Foreign key ke `sales_order.id`                 |
| `komponen`       | `varchar(255)`           | `string`            | Deskripsi biaya tambahan (cth: "ONGKIR GRESIK") |
| `jumlah`         | `double`                 | `number`            | Besaran nominal biaya tambahan (Rp)             |

---

## 4. RELASI TABEL MASTER & LOOKUP

1. **`customer`**:
   - `id`, `kode`, `nama`, `alamat`, `no_hp`.
   - Direferensikan langsung oleh `sales_order.customer_id`.
2. **`produk`**:
   - `id`, `kode`, `nama`, `qty` (stok saat ini), `harga`.
   - Direferensikan langsung oleh `detail_sales_order.produk_id`.
3. **`karyawan` (Salesman)**:
   - `id`, `nik`, `nama`, `jabatan_id = 1011`.
   - Direferensikan oleh `sales_order.sales_id`.
4. **`ppn`**:
   - `id`, `kode`, `nama` (tarif integer, cth 11), `is_active`.
   - Direferensikan oleh `sales_order.ppn_id`.
5. **`setting` (Format Nomor Dokumen)**:
   - Setting ID 101: `SO/{year}/{romawi_bulan}/{last_number}` (SO Impact)
   - Setting ID 36: `SO/{year}/PL/{month}/{last_number}` (SO Pola)
   - Setting ID 113: `SO/{year}/{month}/{last_number}` (SO KS)

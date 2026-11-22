# Sprint 6 — Production (Produksi) Schema Mapping

## 1. Database Schema Audit & Legacy Verification

Audit dilakukan secara mendalam terhadap skrip SQL legacy `u1573701_smm.sql` (38 MB) untuk mengidentifikasi struktur tabel, relasi foreign key, tipe data, indeks, default sequence auto-numbering, dan trigger terkait modul Transaksi Produksi (`produksi`).

---

### 1.1 Tabel `produksi` (Header Transaksi Produksi)

Tabel ini merepresentasikan dokumen Surat Perintah Kerja (SPK) / Catatan Transaksi Produksi:

```sql
CREATE TABLE `produksi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `status` tinyint(4) DEFAULT 0,
  `status_produksi` int(11) DEFAULT NULL,
  `so_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `jenis_produksi` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status_aktif` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `so_id` (`so_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `produksi_ibfk_1` FOREIGN KEY (`so_id`) REFERENCES `so` (`id`),
  CONSTRAINT `produksi_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### Karakteristik Kunci & Pemetaan Nilai:

- **`kode`**: Nomor unik produksi / SPK.
- **`tanggal`**: Tanggal pencatatan/eksekusi produksi.
- **`jenis_produksi`**:
  - `1` = **Pesanan** (diproduksi berdasarkan Sales Order / Make-to-Order).
  - `0` = **Non Pesanan / Stok** (diproduksi untuk persediaan gudang / Make-to-Stock).
- **`status_produksi`**:
  - `0` = **Pending** (dokumen terbit, menunggu alokasi / belum jalan).
  - `1` = **Proses** (sedang dalam pengerjaan di lantai pabrik).
  - `2` = **Selesai** (barang selesai diproduksi dan di-posting).
- **`status`**: Status dokumen (`0` = Draft / Unposted, `1` = Posted / Selesai).
- **`so_id`** & **`customer_id`**: Opsional, terisi jika `jenis_produksi = 1 (Pesanan)`.
- **`status_aktif`**: Soft delete flag (`1` = Aktif, `0` = Dibatalkan / Void).

---

### 1.2 Tabel `detail_produksi_produk` (Detail Barang Jadi yang Diproduksi)

Tabel ini menyimpan daftar produk jadi (finished goods) yang dihasilkan dalam satu surat perintah kerja / nomor produksi:

```sql
CREATE TABLE `detail_produksi_produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produk_id` int(11) DEFAULT NULL,
  `produksi_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produk_id` (`produk_id`),
  KEY `produksi_id` (`produksi_id`),
  CONSTRAINT `detail_produksi_produk_ibfk_1` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`),
  CONSTRAINT `detail_produksi_produk_ibfk_2` FOREIGN KEY (`produksi_id`) REFERENCES `produksi` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### Karakteristik Kunci:

- Menyimpan kuantitas produk jadi yang direncanakan/dihasilkan (`qty`).
- Relasi cascade delete ke header `produksi`.
- Sesuai dengan screenshot form legacy: kolom detail adalah produk jadi (**No**, **Nama Produk**, **Stok**, **Qty**, **Keterangan**), BUKAN daftar bahan baku.

---

### 1.3 Tabel `detail_bahan_produksi` (Detail Pemakaian Bahan Baku & Database Trigger)

Tabel ini menyimpan alokasi pemakaian bahan baku riil saat produksi dieksekusi:

```sql
CREATE TABLE `detail_bahan_produksi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produk_id` int(11) DEFAULT NULL,
  `produksi_id` int(11) DEFAULT NULL,
  `bahan_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `satuan_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produksi_id` (`produksi_id`),
  KEY `bahan_id` (`bahan_id`),
  KEY `satuan_id` (`satuan_id`),
  CONSTRAINT `detail_bahan_produksi_ibfk_1` FOREIGN KEY (`produksi_id`) REFERENCES `produksi` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detail_bahan_produksi_ibfk_2` FOREIGN KEY (`bahan_id`) REFERENCES `master_data_bahan` (`id`),
  CONSTRAINT `detail_bahan_produksi_ibfk_3` FOREIGN KEY (`satuan_id`) REFERENCES `satuan_pakai` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### Database Trigger Legacy (`stok_produksi`):

```sql
DELIMITER ;;
CREATE TRIGGER `stok_produksi` AFTER INSERT ON `detail_bahan_produksi` FOR EACH ROW
BEGIN
    UPDATE master_data_bahan SET qty = qty - NEW.qty WHERE id = NEW.bahan_id;
    INSERT INTO histori_stok_bahan(tanggal, bahan_id, masuk, keluar, keterangan)
    VALUES (NOW(), NEW.bahan_id, 0, NEW.qty, CONCAT('Produksi ID: ', NEW.produksi_id));
END;;
DELIMITER ;
```

> [!IMPORTANT]
> Trigger `stok_produksi` di legacy memotong stok bahan baku pada tabel `master_data_bahan` dan mencatat pengeluaran di `histori_stok_bahan` saat pemakaian bahan di-insert.
> Pada V2, logika ini diintegrasikan secara bersih di Service Boundary (`production.service.ts`), memastikan atomisitas dan kemampuan reversal saat pembatalan transaksi.

---

### 1.4 Tabel `kartu_stok_produk` (Mutasi Stok Produk Jadi)

Tabel ini mencatat penambahan stok barang jadi hasil produksi:

```sql
CREATE TABLE `kartu_stok_produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date DEFAULT NULL,
  `produk_id` int(11) DEFAULT NULL,
  `masuk` int(11) DEFAULT 0,
  `keluar` int(11) DEFAULT 0,
  `keterangan` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produk_id` (`produk_id`),
  CONSTRAINT `kartu_stok_produk_ibfk_1` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

---

## 2. Pemetaan UI Field ke Database Schema

Berikut tabel verifikasi lengkap pemetaan form UI Produksi (sesuai screenshot legacy) terhadap kolom database MariaDB:

| Bagian Form | Label UI        | Kolom Database    | Tipe Data      | Tabel Sumber             | Keterangan / Validasi                                                                |
| ----------- | --------------- | ----------------- | -------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| **Header**  | No Produksi     | `kode`            | `VARCHAR(255)` | `produksi`               | Format: `PD{month}{year}-{last_number}`. Unik, wajib.                                |
| **Header**  | Jenis           | `jenis_produksi`  | `INT(11)`      | `produksi`               | `0`: Non Pesanan (Stok), `1`: Pesanan (SO). Wajib.                                   |
| **Header**  | Tanggal         | `tanggal`         | `DATE`         | `produksi`               | Format internal `YYYY-MM-DD`, UI display `DD/MM/YYYY`. Wajib.                        |
| **Header**  | Status Produksi | `status_produksi` | `INT(11)`      | `produksi`               | `0`: Pending, `1`: Proses, `2`: Selesai. Default saat create: `0`.                   |
| **Header**  | Keterangan      | `keterangan`      | `TEXT`         | `produksi`               | Catatan dokumen / instruksi khusus pabrik. Opsional.                                 |
| **Detail**  | No              | _(Index baris)_   | `INT`          | Computed                 | 1-based sequential index baris spreadsheet. Read-only.                               |
| **Detail**  | Nama Produk     | `produk_id`       | `INT(11)`      | `detail_produksi_produk` | Foreign key ke `produk.id`. Dipilih via Product Picker modal. Wajib per baris valid. |
| **Detail**  | Stok            | `produk.qty`      | `INT(11)`      | `produk`                 | Saldo persediaan gudang saat ini dari master/stock service. Read-only.               |
| **Detail**  | Qty             | `qty`             | `INT(11)`      | `detail_produksi_produk` | Kuantitas unit yang diproduksi. Integer positif (`> 0`). Wajib.                      |
| **Detail**  | Keterangan      | `keterangan`      | `TEXT`         | `detail_produksi_produk` | Keterangan spesifik item produksi (cth. "Finishing doff", "Batch 1"). Opsional.      |

---

## 3. Aturan Auto-Numbering Legacy

Berdasarkan baris konfigurasi pada tabel `setting_table`:

- **ID 39**:
  - `table`: `'produksi'`
  - `name`: `'kode'`
  - `value`: `'PD{month}{year}-{last_number}'`

Contoh implementasi generator sequence nomor produksi di V2:

- Bulan 08, Tahun 2024, urutan ke-1 $\rightarrow$ `PD0824-0001`
- Bulan 08, Tahun 2024, urutan ke-4 $\rightarrow$ `PD0824-0004`
- Bulan 11, Tahun 2026, urutan ke-5 $\rightarrow$ `PD1126-0005`

---

## 4. Kop Dokumen Resmi (Letterhead)

Berdasarkan konfigurasi `setting_table` (ID 83):

- **Perusahaan**: IMPACT FURNITURE
- **Alamat**: Jl. Pogot No.72, Surabaya
- **Telepon**: 081334791464
- **Informasi Cetak SPK**: Dilengkapi 3 blok tanda tangan:
  1. _Dibuat Oleh_ (Staff PPIC / Admin Produksi)
  2. _Disetujui Oleh_ (Supervisor / Kepala Produksi)
  3. _Diterima Oleh_ (Operator Mesin / Mandor)

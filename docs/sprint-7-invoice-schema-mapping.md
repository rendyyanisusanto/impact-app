# Audit & Mapping Skema Database Sales Invoice & Audit Trail (Sprint 7)

Impact Furniture V2

## 1. Audit Sumber Data Legacy

Audit dilakukan terhadap basis data legacy `u1573701_smm.sql` (MariaDB/MySQL) untuk mengidentifikasi struktur tabel yang mendasari fitur Sales Invoice, nomor invoice, relasi Sales Order, dan jejak histori.

### A. Tabel Utama Faktur / Invoice: `pembayaran_sales_order`

Pada skema legacy MariaDB, faktur penjualan (sales invoice) disimpan pada tabel `pembayaran_sales_order`. Tabel ini bertindak sebagai tagihan/invoice transaksi per SO yang dapat dibuat bertahap (termin, DP, pelunasan):

```sql
CREATE TABLE `pembayaran_sales_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode` varchar(100) NOT NULL,
  `so_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `jenis` varchar(50) DEFAULT 'Penjualan',
  `no_faktur_pajak` varchar(100) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `ppn` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terbayar` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status_pembayaran` varchar(50) DEFAULT 'BELUM_BAYAR',
  `keterangan` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pembayaran_so_id` (`so_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### B. Konfigurasi Penomoran Dokumen: `setting_table`

Pada tabel `setting_table` (ID 37), pola penomoran invoice terkonfigurasi sebagai:

- **Tabel Sasaran**: `pembayaran_sales_order`
- **Field Target**: `kode`
- **Format Pattern**: `INV/{year}/{last_number}`
- **Praktik UX Legacy (Screenshot 2)**: Menggunakan pola prefix referensi SO dengan sekuens:
  `${soKode.replace('SO/', 'INV/')}-${sequence}` (contoh: `SO/26/X/0343` menghasilkan `INV/26/X/0343-1`, `INV/26/X/0343-2`).

### C. Jejak Audit & Mutasi Transaksi: `histori_table`

Semua perubahan pada status SO, revisi tanggal, dan pembuatan invoice dicatat ke tabel audit `histori_table`:

```sql
CREATE TABLE `histori_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table` varchar(100) NOT NULL,
  `table_id` int(11) NOT NULL,
  `tanggal` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metode` varchar(50) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_histori_lookup` (`table`, `table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 2. Tabel Pemetaan Schema (Database Field vs Frontend Domain Type)

| UI / Form Field                 | Frontend Model Type (`SalesInvoice`)      | Database Column (`pembayaran_sales_order`) | SQL Data Type   | Keterangan & Aturan                                                      |
| ------------------------------- | ----------------------------------------- | ------------------------------------------ | --------------- | ------------------------------------------------------------------------ |
| **No Invoice**                  | `kode: string`                            | `kode`                                     | `VARCHAR(100)`  | Auto-generated berbasis kode SO (`INV/...-1`)                            |
| **No SO**                       | `so_id: number`, `so_kode: string`        | `so_id`                                    | `INT(11)`       | Foreign key ke tabel `sales_order.id`                                    |
| **Jenis Transaksi**             | `jenis: InvoiceType`                      | `jenis`                                    | `VARCHAR(50)`   | Default 'Penjualan', 'DP', atau 'Pelunasan'                              |
| **Tanggal Invoice**             | `tanggal: string`                         | `tanggal`                                  | `DATE`          | Default hari ini (ISO format `YYYY-MM-DD`)                               |
| **No Faktur Pajak**             | `no_faktur_pajak?: string`                | `no_faktur_pajak`                          | `VARCHAR(100)`  | Hanya aktif pada SO Impact; null/disabled pada Pola & KS                 |
| **DPP (Dasar Pengenaan Pajak)** | `subtotal: number`                        | `subtotal`                                 | `DECIMAL(15,2)` | DPP terhitung otomatis dari Total (Impact: Gross / 1.11; Pola/KS: Total) |
| **PPN**                         | `ppn: number`                             | `ppn`                                      | `DECIMAL(15,2)` | Nilai pajak (Impact: Total - DPP; Pola/KS: 0)                            |
| **Total Invoice**               | `total: number`                           | `total`                                    | `DECIMAL(15,2)` | Nilai nominal penagihan invoice                                          |
| **Sudah Terbayar**              | `terbayar: number`                        | `terbayar`                                 | `DECIMAL(15,2)` | Kontrak pembayaran (diisi oleh modul Pembayaran masa datang)             |
| **Status Pembayaran**           | `status_pembayaran: InvoicePaymentStatus` | `status_pembayaran`                        | `VARCHAR(50)`   | 'BELUM_BAYAR' \| 'SEBAGIAN' \| 'LUNAS'                                   |
| **Keterangan**                  | `keterangan?: string`                     | `keterangan`                               | `TEXT`          | Catatan opsional invoice                                                 |
| **Status Aktif**                | `status: InvoiceStatus`                   | `status`                                   | `TINYINT(1)`    | 1 = Aktif, 0 = Dibatalkan                                                |
| **User ID**                     | `user_id?: number`                        | `user_id`                                  | `INT(11)`       | ID staf/admin pembuat dokumen                                            |

---

## 3. Isolasi Varian Sales Order

- **SO Impact**: Menggunakan `sales_order` dengan `tipe_so = 'impact'`, dikenakan PPN 11% (inclusive), field Faktur Pajak tersedia.
- **SO Pola**: Menggunakan `sales_order` dengan `tipe_so = 'pola'`, Non-PPN, field Faktur Pajak tidak digunakan.
- **SO KS**: Menggunakan `sales_order` dengan `tipe_so = 'ks'`, Non-PPN, field Faktur Pajak tidak digunakan.

Ketiga varian menggunakan tabel `pembayaran_sales_order` yang sama dengan relasi via `so_id`, namun dipisahkan secara ketat pada level rute, store/service context, dan validasi pajak.

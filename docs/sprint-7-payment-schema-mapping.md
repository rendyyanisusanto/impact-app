# Pemetaan Skema Database Pembayaran Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Audit Database Legacy (`u1573701_smm.sql`)

Audit struktural terhadap berkas SQL legacy MariaDB (`u1573701_smm.sql`) membuktikan bahwa sistem legacy membagi transaksi penjualan menjadi tiga tingkatan berelasi:

$$\text{Sales Order (`sales_order`)} \longrightarrow \text{Sales Invoice (`pembayaran_sales_order`)} \longrightarrow \text{Pembayaran (`detail_pembayaran_sales_order`)}$$

### A. Tabel Faktur Penjualan (Sales Invoice): `pembayaran_sales_order`

Mencatat dokumen penagihan invoice:

```sql
CREATE TABLE `pembayaran_sales_order` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `so_id` int(10) UNSIGNED DEFAULT NULL,
  `kode` varchar(255) DEFAULT NULL, -- Format invoice e.g. "INV/26/XI/0344-1"
  `total` decimal(20,0) DEFAULT NULL, -- Total tagihan invoice
  `tanggal` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 0,
  `status_aktif` tinyint(1) DEFAULT 1,
  `keterangan` text DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `uuid` text DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL, -- DPP
  `potongan` decimal(10,2) DEFAULT NULL,
  `tambahan` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

### B. Tabel Rincian Penerimaan Pembayaran: `detail_pembayaran_sales_order`

Mencatat pembayaran penerimaan kas/bank yang mengacu langsung ke `pembayaran_sales_order_id` (ID Sales Invoice):

```sql
CREATE TABLE `detail_pembayaran_sales_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pembayaran_sales_order_id` int(11) DEFAULT NULL, -- FOREIGN KEY KE INVOICE (MANDATORY)
  `metode_pembayaran` varchar(255) DEFAULT NULL,     -- 'TRANSFER', 'TUNAI', 'CEK/GIRO'
  `bank_id` int(11) DEFAULT NULL,                    -- Relasi ke master bank (bank.id)
  `jumlah` decimal(20,0) DEFAULT NULL,               -- Tagihan dasar invoice
  `keterangan` text DEFAULT NULL,                    -- Catatan mutasi pembayaran
  `so_id` int(11) DEFAULT NULL,                        -- Referensi denormalisasi SO
  `jenis_pembayaran` text DEFAULT NULL,              -- 'CASH', 'JATUH TEMPO'
  `jumlah_pembayaran` decimal(20,0) DEFAULT NULL,    -- Nominal pembayaran aktual yang disetor
  `total_potongan` decimal(10,2) DEFAULT NULL,
  `uuid` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

---

## 2. Pemetaan Field (Database Legacy vs Model Frontend)

| Form / UI Field        | Model TypeScript (`SalesPayment`)              | Kolom SQL Legacy            | Tipe Data SQL        | Keterangan Aturan Bisnis                             |
| ---------------------- | ---------------------------------------------- | --------------------------- | -------------------- | ---------------------------------------------------- |
| **No. Pembayaran**     | `kode: string`                                 | `kode` / generated          | `VARCHAR(100)`       | Auto-generated: `PAY/{cleanInvoiceCode}/{seq}`       |
| **No. Invoice**        | `invoice_id: number`, `invoice_kode: string`   | `pembayaran_sales_order_id` | `INT(11)`            | **Wajib (Mandatory)**, mengacu pada invoice tertentu |
| **Ref. Sales Order**   | `so_id: number`, `so_kode: string`             | `so_id`                     | `INT(11)`            | Referensi tidak langsung (hanya metadata/pelaporan)  |
| **Tanggal Bayar**      | `tanggal: string`                              | `tanggal` / `created_at`    | `DATE` / `TIMESTAMP` | Tanggal transaksi penerimaan uang                    |
| **Metode Pembayaran**  | `metode_pembayaran: PaymentMethod`             | `metode_pembayaran`         | `VARCHAR(255)`       | `'TRANSFER'` \| `'TUNAI'` \| `'CEK/GIRO'`            |
| **Bank / Akun**        | `bank_id: number \| null`, `bank_nama: string` | `bank_id`                   | `INT(11)`            | Terhubung ke master bank setting (`bank.id`)         |
| **Nominal Pembayaran** | `jumlah: number`                               | `jumlah_pembayaran`         | `DECIMAL(20,0)`      | Jumlah uang rupiah yang disetorkan                   |
| **No. Bukti / Ref**    | `bukti_bayar: string \| null`                  | `keterangan` / `uuid`       | `VARCHAR(255)`       | Bukti nomor transfer atau nomor kwitansi             |
| **Keterangan**         | `keterangan: string \| null`                   | `keterangan`                | `TEXT`               | Catatan opsional transaksi pembayaran                |
| **Status Pembayaran**  | `status: PaymentStatus`                        | `status`                    | `TINYINT(1)`         | `1` = Aktif / Valid, `0` = Dibatalkan (Reversal)     |
| **Posting Keuangan**   | `is_posted_to_finance: boolean`                | - (Contract Sprint 8)       | `BOOLEAN`            | Menjamin idempotency saat modul Kas/Bank aktif       |

---

## 3. Analisis Gap & Penanganan Adapter

- **Gap Kode Transaksi**: Pada tabel legacy `detail_pembayaran_sales_order`, belum ada kolom khusus `kode` pembayaran tersendiri (mengandalkan ID atau nomor referensi).
- **Solusi Adapter**: Frontend mengimplementasikan generator kode penomoran konsisten:
  `PAY/{cleanInvoiceCode}/{seq}` (misal `INV/26/XI/0344-1` menghasilkan pembayaran pertama `PAY/26/XI/0344-1/01`).
- **Integritas Relasi**: Relasi bisnis dijaga ketat agar setiap transaksi pembayaran **wajib memiliki `invoice_id`**. Tidak ada transaksi pembayaran yang dapat dibuat langsung terhadap Sales Order.

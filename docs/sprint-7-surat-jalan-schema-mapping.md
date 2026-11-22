# SPRINT 7 — SURAT JALAN & PENGIRIMAN: SCHEMA MAPPING

## 1. Audit Database MariaDB Legacy

Berdasarkan dump database legacy `u1573701_smm.sql`, modul pengiriman menggunakan dua tabel relasional utama:

1. `surat_jalan` (Header pengiriman)
2. `detail_surat_jalan` (Detail produk & kuantitas pengiriman per surat jalan)

### A. Tabel `surat_jalan`

```sql
CREATE TABLE `surat_jalan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `so_id` int(11) DEFAULT NULL,
  `kode` varchar(255) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `status_kirim` tinyint(4) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `nama_pengirim` text DEFAULT NULL,
  `penerima` varchar(255) DEFAULT NULL,
  `foto_bukti` varchar(255) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `no_hp` varchar(255) DEFAULT NULL,
  `karyawan_id` int(11) DEFAULT NULL,
  `status_ambil` tinyint(4) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `status_aktif` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### Deskripsi Field Kritis:

- `id`: Primary key unik transaksi surat jalan.
- `so_id`: Foreign key ke tabel `sales_order.id`. Menghubungkan surat jalan langsung ke Sales Order (bukan ke invoice).
- `kode`: Nomor Surat Jalan (misal `SJ-24/09/1568`, `SJ/26/03/0312`, `SJ/26/PL/03/0069`, `SJ/26/III/0067`, atau `SJA/...` untuk ambil sendiri).
- `tanggal`: Tanggal pengiriman dokumen (YYYY-MM-DD).
- `status`: Status dokumen:
  - `0`: DRAFT
  - `1`: SUCCEEDED (Sah & Terbit)
  - `2`: BATAL (Dibatalkan)
- `status_kirim`: Status pengiriman logistik:
  - `0`: BELUM DIKIRIM
  - `1`: TERKIRIM
  - `2`: AMBIL SENDIRI
- `status_ambil`: Flag penanda metode pengiriman:
  - `0` / `NULL`: Dikirim oleh armada/sopir/ekspedisi.
  - `1`: Ambil Sendiri (Customer Self Pickup).
- `nama_pengirim`: Nama sopir internal / vendor ekspedisi / pengambil barang.
- `penerima`: Nama pihak penerima barang di tempat tujuan.
- `foto_bukti`: URL bukti serah terima barang (foto fisik barang/cap tanda terima).
- `alamat`: Alamat tujuan pengiriman (otomatis diisi dari master customer).
- `no_hp`: Kontak penerima / customer.
- `status_aktif`: Soft delete flag (`1` = aktif, `0` = nonaktif).

---

### B. Tabel `detail_surat_jalan`

```sql
CREATE TABLE `detail_surat_jalan` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `surat_jalan_id` int(10) UNSIGNED DEFAULT NULL,
  `produk_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `qty_kirim` int(11) DEFAULT NULL,
  `detail_sales_order_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### Deskripsi Field Kritis:

- `id`: Primary key detail barang.
- `surat_jalan_id`: Foreign key ke `surat_jalan.id`.
- `produk_id`: Foreign key ke master `produk.id`.
- `qty`: Kuantitas pemesanan awal pada Sales Order.
- `qty_kirim`: Kuantitas yang dikirimkan pada surat jalan ini.
- `detail_sales_order_id`: Foreign key ke baris pemesanan `detail_sales_order.id`.

> [!NOTE]
> Data aktual pada dump legacy membuktikan bahwa sistem mendukung **Partial Delivery** (pengiriman bertahap). Sebagai contoh baris ID 82 mencatat: `surat_jalan_id: 38, produk_id: 62, qty: 9, qty_kirim: 5`. Sisa 4 unit dapat dikirimkan pada surat jalan berikutnya dengan penomoran suffix seperti `SJ/26/03/0312-1`.

---

## 2. Mapping Entity TypeScript V2

Model TypeScript didefinisikan secara strictly-typed pada `app/src/modules/delivery/types/delivery-note.types.ts`:

```typescript
export interface SuratJalan {
  id: number
  so_id: number
  kode: string
  tanggal: string
  keterangan: string | null
  status: number // 0 = Draft, 1 = Succeeded, 2 = Batal
  status_kirim: number // 0 = Belum Dikirim, 1 = Terkirim, 2 = Ambil Sendiri
  created_at?: string
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
  nama_pengirim: string | null
  penerima: string | null
  foto_bukti: string | null
  alamat: string | null
  no_hp: string | null
  karyawan_id: number | null
  status_ambil: number | null // 1 = Ambil Sendiri, 0 = Dikirim
  note: string | null
  status_aktif: number
  is_stock_deducted?: boolean
}

export interface DetailSuratJalan {
  id: number
  surat_jalan_id: number
  produk_id: number
  qty: number
  qty_kirim: number
  detail_sales_order_id: number | null
  keterangan?: string | null
}
```

# Navigation Architecture & Routing Hardening — Impact Furniture ERP v2

Dokumen ini mendokumentasikan arsitektur navigasi, struktur hierarki menu, konvensi routing, sistem breadcrumb, serta kepatuhan aksesibilitas untuk Impact Furniture ERP v2 (Sprint 1 — Task 4).

---

## 1. Ikhtisar Arsitektur Navigasi

Sistem informasi manajemen (SIM) Impact Furniture v2 mempertahankan paradigma navigasi horizontal enterprise yang familiar bagi pengguna operasional:

- **Header Atas (Top Header)**: Menampilkan brand identity Impact Furniture, status modul, dan dropdown profil pengguna.
- **Menubar Horizontal (Desktop)**: Menampung 11 menu utama dengan background signature slate `#34454F` dan interaksi dropdown submenu berkecepatan tinggi.
- **Drawer Mobile / Tablet**: Menyediakan drawer sidebar responsif untuk resolusi di bawah `1024px` (LG breakpoint).
- **Breadcrumb Trail Dinamis**: Melacak posisi pengguna secara real-time berdasarkan rute aktif Vue Router.

---

## 2. Struktur 11 Menu Utama & Submenu Terdaftar

Berikut adalah daftar lengkap 11 menu utama dalam urutan yang telah divalidasi dan teruji:

| No  | Modul Utama        | Path Dasar       | Jumlah Submenu  | Submenu Utama                                                                                                                                                                                                                                             |
| --- | ------------------ | ---------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Dashboard**      | `/dashboard`     | 0 (Direct link) | Beranda ringkasan statistik ERP                                                                                                                                                                                                                           |
| 2   | **Pengadaan**      | `/procurement/*` | 4               | Master Data Suplier, Purchase Order, Penerimaan Barang, Pembayaran Tagihan                                                                                                                                                                                |
| 3   | **Persediaan**     | `/inventory/*`   | 4               | Master Data Bahan, Master Data Produk, Penyesuaian Stok Bahan, Mutasi Bahan                                                                                                                                                                               |
| 4   | **Produksi**       | `/production/*`  | 2               | Proses Produksi, Template Produk (BoM)                                                                                                                                                                                                                    |
| 5   | **Penjualan**      | `/sales/*`       | 6               | Master Data Customer, Sales Order (IMPACT), Sales Order (POLA), Sales Order (KS), Pembayaran Invoice, Pemasukan Lain                                                                                                                                      |
| 6   | **Pengiriman**     | `/delivery/*`    | 1               | Form Surat Jalan                                                                                                                                                                                                                                          |
| 7   | **Keuangan**       | `/accounting/*`  | 4               | Chart Of Account, Pemasukan Lain, Pengeluaran Lain, Jurnal Umum                                                                                                                                                                                           |
| 8   | **Laporan**        | `/reporting/*`   | 14              | Pembelian, Penjualan, Laporan Per Produk, Laporan Per Customer, Penjualan per Customer & Produk, Kartu Stok, Laporan Mutasi Stok, Laporan Stok Bahan, Jurnal Harian, Neraca, Laba Rugi, Buku Besar, Statistic Sales, Statistic Customer, Statistic Driver |
| 9   | **HR**             | `/hr/*`          | 5               | Master Data Karyawan, Master Data Grup Karyawan, Setting Jadwal, Setting Hari Libur, Presensi                                                                                                                                                             |
| 10  | **Setting**        | `/settings/*`    | 10              | Master Data Bank, Master Data Gudang, Master Data Jabatan, Master Data Status Karyawan, Master Data Kategori Bahan, Master Data Kategori Barang/Produk, Master Data Satuan Bahan, Master Data Satuan Produk, Master Data PPN, Setting Aplikasi            |
| 11  | **System Setting** | `/system/*`      | 5               | Master Data Groups (Role), Master Data User, Setting Status, Import Data, Edit Akun                                                                                                                                                                       |

---

## 3. Penanganan Kasus Khusus (Audit Menu & Submenu)

### 3.1 Pemisahan Menu dengan Label Sama

Menu **"Pemasukan Lain"** berada di dua modul bisnis yang berbeda dengan tujuan akuntansi yang berbeda:

1. **Penjualan (`/sales/other-income`)**:
   - ID: `sales-other-income`
   - Parent: `penjualan`
   - Konteks: Penerimaan kas non-operasional dari aktivitas penjualan/penyerahan sisa potongan kayu/afval.
2. **Keuangan (`/accounting/other-income`)**:
   - ID: `accounting-other-income`
   - Parent: `keuangan`
   - Konteks: Penerimaan kas umum, pendapatan bunga bank, dan laba selisih kurs.

Kedua menu ini memiliki route names, parent navigation IDs, dan breadcrumb trail yang sepenuhnya independen.

### 3.2 Varian Sales Order

- `Sales Order (IMPACT)`: `/sales/orders/impact`
- `Sales Order (POLA)`: `/sales/orders/pola`
- `Sales Order (KS)`: `/sales/orders/ks`

Setiap entitas pesanan penjualan memiliki jalur navigasi tersendiri dan tidak digabungkan agar alur kerja operasional lama tetap terjaga.

### 3.3 Menu System Setting Khusus

- `Master Data Groups (Role)`: `/system/groups`
- `Master Data User`: `/system/users`
- `Import Data`: `/system/import`

---

## 4. Konfigurasi Route & Typed Metadata

Tipe metadata route diamankan menggunakan modul augmentation Vue Router pada `app/src/app/router/router.d.ts`:

```ts
declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth?: boolean
    permission?: string
    breadcrumb?: string
    module?: string
  }
}
```

### Route Fallback & Error Handling

- **Placeholder Route**: Seluruh submenu bisnis tahap awal terhubung ke `ModulePlaceholderPage.vue` yang menampilkan judul, modul, status kesiapan, dan breadcrumb.
- **404 Catch-All Route**: Rute tak dikenal ditangani oleh `/:pathMatch(.*)*` yang merender `NotFoundPage.vue` dengan opsi kembali ke dashboard.

---

## 5. Aksesibilitas Navigasi (a11y)

1. **Atribut ARIA**:
   - Menu dropdown menggunakan `aria-haspopup="true"` dan `aria-expanded="isOpen"`.
   - Submenu kontainer menggunakan `role="menu"` dan setiap link memiliki `role="menuitem"`.
   - Link breadcrumb aktif ditandai dengan `aria-current="page"`.
2. **Interaksi Keyboard**:
   - Tekan `Enter` atau `Space` pada tombol menu utama untuk membuka dropdown.
   - Tekan `Escape` pada dropdown terbuka untuk menutup menu dan mengembalikan fokus ke tombol pemicu.
   - Navigasi dropdown otomatis tertutup saat berpindah rute atau mengklik area luar menu (`click outside`).

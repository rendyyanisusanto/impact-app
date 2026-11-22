# Sprint 6 — Production (Produksi) Lifecycle & Workflow

## 1. Lifecycle Status Overview

Modul Transaksi Produksi Impact Furniture V2 merefleksikan alur kerja pabrik manufaktur mebel secara komprehensif dengan status yang dipetakan langsung dari kolom legacy `status_produksi` dan `status` (posting flag):

```
+-----------------------------------------------------------------------------------+
|                                  DRAFT / CREATED                                  |
|  [Status Produksi: 0 (Pending)]                    [Status Dokumen: 0 (Unposted)] |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Mulai Pengerjaan Pabrik)
+-----------------------------------------------------------------------------------+
|                                IN-PROGRESS / SPK AKTIF                            |
|  [Status Produksi: 1 (Proses)]                     [Status Dokumen: 0 (Unposted)] |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Selesaikan Produksi & Posting Stok)
+-----------------------------------------------------------------------------------+
|                                 FINISHED & POSTED                                 |
|  [Status Produksi: 2 (Selesai)]                    [Status Dokumen: 1 (Posted)]   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Opsi Pembatalan / Reversal Transaksi)
+-----------------------------------------------------------------------------------+
|                                  VOID / CANCELLED                                 |
|  [Status Produksi: Selesai]     [Status Aktif: 0]   [Stok Produk & Bahan Dipulihkan]|
+-----------------------------------------------------------------------------------+
```

---

## 2. Definisi Status & Dampak Bisnis

### 2.1 Status `0` — Pending (Menunggu)

- **Kondisi Dokumen**: SPK baru saja dibuat oleh Admin PPIC / Produksi.
- **Dampak Stok**: **NOL (0)** mutasi. Tidak ada mutasi produk masuk maupun bahan keluar.
- **Aksi yang Diizinkan**: Edit dokumen, ubah kuantitas, ubah daftar produk, hapus/batalkan transaksi langsung tanpa dampak saldo gudang.

### 2.2 Status `1` — Proses (Sedang Dikerjakan)

- **Kondisi Dokumen**: SPK telah didistribusikan ke lantai pabrik (pemotongan kayu, perakitan, atau finishing sedang berjalan).
- **Dampak Stok**: **NOL (0)** mutasi aktual pada kartu stok. (Bahan baku dapat dilihat pada tab alokasi/kebutuhan bahan untuk kesiapan gudang).
- **Aksi yang Diizinkan**: Edit keterangan/catatan, batalkan dokumen, atau konfirmasi "Selesaikan Produksi".

### 2.3 Status `2` — Selesai (Selesai & Diposting)

- **Kondisi Dokumen**: Barang furniture telah selesai diproduksi, lulus quality control, dan diserahkan ke gudang barang jadi.
- **Dampak Stok (Posting Otomatis)**:
  1. Menambah kuantitas produk jadi pada `produk.qty`.
  2. Mencatat mutasi debet (masuk) pada tabel `kartu_stok_produk`.
  3. Memotong saldo persediaan bahan baku pada `master_data_bahan.qty` berdasarkan resep BoM.
  4. Mencatat mutasi kredit (keluar) pada tabel `histori_stok_bahan`.
- **Proteksi Idempotensi**: Transaksi berstatus `Selesai` otomatis mengunci status dokumen menjadi `status = 1 (Posted)`. Transaksi ini TIDAK BISA diposting dua kali.
- **Kunci Edit**: Formulir Create/Edit terkunci dalam mode baca saja (read-only) untuk mencegah manipulasi data historis.

---

## 3. Alur Pembatalan Dokumen & Reversal Stok

Jika terjadi kesalahan input atau SPK yang sudah diposting harus ditarik kembali:

1. Pengguna dengan hak akses Supervisor/Admin memilih tombol **Batalkan Transaksi**.
2. Sistem memeriksa apakah transaksi berstatus `Selesai / Posted`:
   - Jika **Pending / Proses**: Dokumen langsung dinonaktifkan (`status_aktif = 0`) tanpa perlu mutasi balik persediaan.
   - Jika **Selesai**: Sistem menjalankan **Transactional Stock Reversal**:
     - Mengurangi saldo produk jadi sejumlah unit yang pernah diposting.
     - Mencatat mutasi keluar penyesuaian pada `kartu_stok_produk`.
     - Mengembalikan saldo bahan baku yang pernah terpotong ke `master_data_bahan.qty`.
     - Mencatat mutasi masuk pembatalan pada `histori_stok_bahan`.
3. Menandai ID transaksi dalam `reversedProductionIds` untuk mencegah double-reversal.
4. Menampilkan alert status merah: _"Transaksi Telah Dibatalkan / Void"_.

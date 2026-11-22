# Alur Kerja Sales Order, Sales Invoice & Kesiapan Pembayaran (Sprint 7)

Impact Furniture V2

## 1. Alur Siklus Hidup Transaksi (End-to-End Workflow)

Siklus transaksi penjualan mengikuti alur ketat standar ERP manufaktur:

```
[Sales Order (SO)] ───► [Sales Invoice (Faktur Penjualan)] ───► [Pembayaran (Kas/Bank)]
   (Disepakati)               (Penagihan Bertahap)                   (Modul Berikutnya)
```

1. **Pembuatan & Persetujuan Sales Order**:
   - SO dibuat dengan nomor resmi (misal `SO/26/X/0343`).
   - Status SO aktif (`status_aktif = 1`).
   - Dicatat di `histori_table` (`metode = 'CREATE'`).

2. **Penerbitan Invoice (Faktur Penjualan)**:
   - Pengguna mengakses halaman Invoice melalui dropdown aksi baris SO.
   - Sistem memeriksa total SO dan riwayat invoice aktif yang sudah ada.
   - Pengguna dapat membuat beberapa invoice bertahap:
     - Invoice 1: Uang Muka (DP) misal Rp 10.000.000 (`INV/26/X/0343-1`).
     - Invoice 2: Termin Pelunasan Rp 15.000.000 (`INV/26/X/0343-2`).
   - Tiap pembuatan invoice mencatat audit mutasi ke `histori_table` (`metode = 'INVOICE_CREATE'`).

3. **Status Kesiapan Pembayaran (Payment Readiness)**:
   - Setiap invoice memiliki atribut finansial:
     - `total`: Jumlah yang ditagihkan.
     - `terbayar`: Jumlah yang sudah dibayar (default Rp 0 pada tahap Sprint 7).
     - `sisa_pembayaran`: `total - terbayar`.
     - `status_pembayaran`:
       - `BELUM_BAYAR` (jika `terbayar === 0`)
       - `SEBAGIAN` (jika `0 < terbayar < total`)
       - `LUNAS` (jika `terbayar >= total`)
   - **PENTING**: Pada Sprint 7, tidak ada modul pembayaran atau perubahan kas/bank yang dijalankan. Kontrak interface telah disiapkan secara lengkap untuk konsumsi modul Pembayaran di masa mendatang.

---

## 2. Pengelolaan & Siklus Pembatalan (Cancellation Rules)

### A. Pembatalan Invoice:

- Pengguna dapat membatalkan invoice yang salah terbit melalui tombol aksi _Batalkan_.
- **Guard Pembayaran**: Jika invoice sudah memiliki pembayaran tercatat (`terbayar > 0`), sistem secara tegas **menolak pembatalan** untuk mencegah ketidaksinkronan buku besar kas/bank.
- **Efek Pembatalan**:
  - Kolom `status` invoice diubah menjadi `0` (Dibatalkan).
  - Nilai nominal invoice dikeluarkan dari perhitungan `sudahInvoice`.
  - Sisa plafon invoice pada SO (`sisaInvoice`) seketika pulih.
  - Tercatat di log `histori_table`.

### B. Pembatalan Sales Order:

- Pengguna berhak membatalkan Sales Order jika pesanan gugur sebelum diproses.
- **Guard Invoice & Pembayaran**: Jika pada SO sudah ada invoice aktif yang telah terbayar (`terbayar > 0`), pembatalan SO **dilarang**.
- **Efek Pembatalan**:
  - `status_aktif` diubah menjadi `0`.
  - Semua tombol pembuatan invoice baru, edit tanggal, dan edit transaksi dinonaktifkan.
  - Alasan pembatalan dicatat ke `histori_table` (`metode = 'CANCEL'`).

---

## 3. Fitur Cetak Faktur Penjualan (A4 Print Preview)

- Modal dialog `SalesInvoicePrintModal.vue` menyediakan pratinjau faktur standar A4 siap cetak:
  - Kop surat resmi sesuai varian (Impact Furniture / Pola / KS).
  - Identitas customer dan nomor SO referensi.
  - Tabel rincian tagihan beserta DPP dan PPN (khusus Impact).
  - Kolom tanda tangan 3 pihak: Penerima, Pengirim/Gudang, Hormat Kami.
  - CSS `@media print` yang mengisolasi area cetak dan menyembunyikan navigasi atau dialog backdrop.

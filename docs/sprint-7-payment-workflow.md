# Alur Kerja Pembayaran Sales Invoice & Kesiapan Kas/Bank (Sprint 7)

Impact Furniture V2

## 1. Siklus Lengkap Transaksi (End-to-End Workflow)

```
[Sales Order (SO)] ───► [Sales Invoice] ───► [Pembayaran Invoice] ───► [Buku Kas / Bank]
 (Disepakati/Sukses)    (Faktur Tagihan)      (Penerimaan Bertahap)      (Modul Sprint 8)
```

1. **Titik Masuk Pembayaran (Payment Entry Point)**:
   - Pengguna membuka halaman Sales Invoice per SO (`SalesInvoicePage.vue`).
   - Setiap baris tagihan invoice menyediakan dua aksi utama:
     - **Aksi Bayar** (`CreditCard`): Membuka modal dialog `SalesInvoicePaymentCreateModal.vue` secara langsung untuk input cepat. Aksi ini aktif jika invoice belum lunas (`sisa_pembayaran > 0`) dan tidak berstatus dibatalkan (`status === 1`).
     - **Aksi Lihat Pembayaran** (`Receipt`): Mengarahkan pengguna ke halaman riwayat dan panel pembayaran khusus invoice tersebut (`SalesInvoicePaymentPage.vue`).
   - Tombol bayar **dilarang** ditempatkan langsung pada form/detail Sales Order tanpa memilih invoice tertentu.

2. **Penerbitan Pembayaran (Payment Creation)**:
   - Form pembayaran secara otomatis mengunci `invoice_id` (read-only).
   - Pengguna memilih tanggal, metode pembayaran (`TRANSFER`, `TUNAI`, `CEK/GIRO`), dan bank tujuan (jika transfer/cek/giro).
   - Nilai default nominal otomatis terisi sebesar sisa tagihan invoice saat ini, namun dapat diubah bebas untuk skenario pembayaran parsial (termin/cicilan).
   - Tombol helper _"Bayar Penuh Sisa Tagihan"_ memudahkan penyelesaian tagihan secara instan.
   - Sistem melakukan validasi matematika ketat terhadap plafon sisa tagihan invoice.

3. **Dampak Pembaruan Terhadap Status Invoice & Sales Order**:
   - Setelah pembayaran disimpan:
     - Total terbayar pada invoice (`invoice.terbayar`) bertambah secara atomic.
     - Status pembayaran invoice diperbarui: `BELUM_BAYAR` $\rightarrow$ `SEBAGIAN` $\rightarrow$ `LUNAS`.
     - Plafon sisa pembayaran invoice berkurang secara presisi.
     - Akumulasi total terbayar pada Sales Order induk disinkronkan secara otomatis.
     - Jejak mutasi dicatat ke tabel audit `histori_table` (`metode = 'PAYMENT'`).

4. **Pembatalan / Pembalikan Transaksi (Payment Reversal)**:
   - Pengguna berhak membatalkan pembayaran melalui dialog konfirmasi pembatalan.
   - Sistem menandai status pembayaran menjadi `0` (Dibatalkan) dan mencatat alasan pembatalan.
   - Sisa plafon tagihan invoice seketika dipulihkan kembali.
   - Status invoice dan Sales Order dikalkulasi ulang secara reaktif.
   - Pembatalan dicatat ke `histori_table` (`metode = 'PAYMENT_CANCEL'`).

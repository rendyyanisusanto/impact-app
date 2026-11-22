# Laporan Pengujian & Verifikasi Modul Pembayaran Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Ringkasan Pengujian Komprehensif

Pengujian otomatis dilakukan mencakup unit testing logika kalkulasi murni, pengujian workflow transaksi service, pengujian antarmuka halaman dan dialog modal, serta integrasi reaktif terhadap status tagihan Sales Order.

### Hasil Quality Gates:

- **TypeScript Strict Compilation (`vue-tsc --noEmit`)**: **0 error (Strict Mode)**.
- **ESLint Linter (`eslint .`)**: **0 error, 0 warning**.
- **Prettier Formatter (`prettier --check .`)**: **100% compliant**.
- **Vitest Test Suite**: **93 test files passed, 546 unit tests passed (100% PASS)**.
- **Vite Production Build (`vite build`)**: **Berhasil tanpa chunk bundling warning**.

---

## 2. Rincian Berkas Pengujian Baru Modul Pembayaran

### A. `tests/unit/modules/sales/SalesPaymentCalculations.spec.ts` (12 Pengujian)

Memverifikasi akurasi matematis fungsi perhitungan pembayaran:

1. `resolvePaymentStatus`: Menghasilkan `BELUM_BAYAR` jika total bayar 0 atau negatif.
2. `resolvePaymentStatus`: Menghasilkan `SEBAGIAN` jika bayar > 0 dan < total tagihan invoice.
3. `resolvePaymentStatus`: Menghasilkan `LUNAS` jika bayar $\ge$ total tagihan invoice.
4. `calculatePaymentSummary`: Pelunasan penuh dalam 1 kali transaksi pembayaran.
5. `calculatePaymentSummary`: Pembayaran bertahap / cicilan dalam 2 termin parsial.
6. `calculatePaymentSummary`: Pengecualian mutlak pembayaran yang dibatalkan (`status === 0`) dari total penerimaan kas.
7. `calculatePaymentSummary`: Penanganan saat belum ada pembayaran sama sekali.
8. `generatePaymentCode`: Menghasilkan nomor pembayaran berurutan dari kode invoice (`PAY/.../01`, `PAY/.../02`).
9. `validatePaymentAmount`: Menolak pembayaran bernilai 0 atau negatif.
10. `validatePaymentAmount`: Menolak overpayment yang melampaui sisa tagihan invoice.
11. `validatePaymentAmount`: Menerima nominal pas sisa tagihan atau nominal cicilan yang sah.
12. `calculateSalesOrderPaymentSummary`: Memisahkan secara presisi tiga nilai finansial (`total_so`, `total_sudah_invoice`, `total_sudah_dibayar`).

### B. `tests/unit/modules/sales/SalesPaymentWorkflow.spec.ts` (11 Pengujian)

Memverifikasi integrasi transaksi dan aturan batas keamanan service:

1. Menolak pembayaran tanpa `invoice_id` yang valid.
2. Menolak pembayaran untuk invoice yang tidak terdaftar.
3. Membuat pembayaran parsial dan memperbarui status invoice menjadi `SEBAGIAN`.
4. Mendukung dua pembayaran bertahap pada satu invoice hingga mencapai status `LUNAS`.
5. Menolak overpayment yang melebihi plafon sisa tagihan invoice.
6. Menolak pembayaran tambahan pada invoice yang telah `LUNAS`.
7. Menolak pembayaran pada invoice yang telah dibatalkan (`status === 0`).
8. Validasi kewajiban memilih bank jika metode pembayaran adalah `TRANSFER` atau `CEK/GIRO`.
9. Pembatalan/pembalikan pembayaran (reversal) sukses memulihkan saldo sisa tagihan invoice dan status pembayaran.
10. Mendukung invoice Non-PPN pada varian SO Pola dan SO KS.
11. Pencatatan otomatis audit trail mutasi ke `histori_table` saat pembayaran dibuat dan dibatalkan.

### C. `tests/unit/modules/sales/SalesInvoicePaymentPage.spec.ts` (5 Pengujian)

Memverifikasi halaman pembayaran invoice:

1. Merender PageHeader dengan Title, subtitle kode invoice & customer, dan tombol navigasi kembali.
2. Merender 3 kartu ringkasan KPI: Identitas Invoice, Referensi Sales Order, dan Status Finansial Tagihan.
3. Merender tabel 8 kolom riwayat pembayaran lengkap dengan badge metode, bank tujuan, nominal, dan aksi.
4. Membuka modal Tambah Pembayaran saat tombol "+ Tambah Pembayaran" diklik pada invoice yang belum lunas.
5. Menampilkan empty state yang informatif ketika invoice belum memiliki catatan pembayaran.

### D. `tests/unit/modules/sales/SalesInvoicePage.spec.ts` (6 Pengujian)

Memverifikasi entry point pembayaran pada daftar invoice:

1. Menampilkan tombol aksi "Bayar" (`CreditCard`) dan "Lihat Riwayat Pembayaran" (`Receipt`) pada tabel invoice.
2. Memastikan tombol "Bayar" dinonaktifkan secara otomatis jika invoice sudah berstatus `LUNAS` atau dibatalkan.

---

## 3. Matriks Skenario Edge-Case

| Skenario Pengujian                               | Hasil Pengujian Aktual                                              | Status  |
| ------------------------------------------------ | ------------------------------------------------------------------- | ------- |
| Pembayaran langsung dari SO tanpa invoice        | Ditolak oleh tipe & service boundary                                | ✅ PASS |
| Nominal pembayaran > sisa tagihan invoice        | Exception: "Nominal pembayaran melebihi sisa tagihan invoice"       | ✅ PASS |
| Invoice lunas dibayar kembali                    | Exception: "Invoice sudah LUNAS"                                    | ✅ PASS |
| Pembayaran pada invoice yang dibatalkan          | Exception: "Invoice telah dibatalkan"                               | ✅ PASS |
| Transfer bank tanpa memilih bank                 | Exception: "Bank wajib dipilih untuk metode Transfer"               | ✅ PASS |
| Pembatalan pembayaran (Reversal)                 | Saldo sisa tagihan seketika pulih 100%                              | ✅ PASS |
| Reversal kedua kali pada transaksi yang sama     | Exception: "Pembayaran sudah pernah dibatalkan"                     | ✅ PASS |
| Variasi SO Impact (PPN 11%) vs Pola/KS (Non-PPN) | Nilai pembayaran murni melunasi invoice tanpa perhitungan ulang PPN | ✅ PASS |
| Cetak kwitansi bukti pembayaran                  | Terbuka dalam modal siap cetak lengkap dengan teks terbilang rupiah | ✅ PASS |
| Ekspor riwayat ke Excel dan PDF                  | Mengunduh berkas dengan sanitasi formula injection                  | ✅ PASS |

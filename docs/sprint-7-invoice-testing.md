# Matriks Pengujian & Verifikasi Kualitas Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Ringkasan Hasil Pengujian (Quality Gates)

Pengujian otomatis dijalankan secara komprehensif menggunakan Vitest, Vue Test Utils, ESLint, Prettier, dan Vue-TSC.

- **TypeScript Strict Compilation (`vue-tsc --noEmit`)**: 0 error.
- **ESLint Validation (`eslint .`)**: 0 error, 0 warning.
- **Prettier Code Formatter**: 100% compliant.
- **Vite Production Bundling (`vite build`)**: Berhasil dalam ~11s.
- **Vitest Unit Test Suite**: **90 test files passed, 517 tests passed (100%)**.

---

## 2. Cakupan File Pengujian Baru & Relevan

### A. `tests/unit/modules/sales/SalesInvoiceCalculations.spec.ts` (13 Pengujian)

Memverifikasi ketepatan matematis fungsi murni perhitungan pajak dan agregasi:

1. Menghasilkan kode invoice berurutan sesuai pola legacy (`INV/...-1`, `INV/...-2`).
2. Perhitungan gross-inclusive PPN 11% untuk SO Impact (`DPP = round(Total / 1.11)`).
3. Penjumlahan presisi: $\text{DPP} + \text{PPN} \equiv \text{Total}$ pada nominal ganjil dan besar.
4. Perhitungan Non-PPN untuk SO Pola & SO KS (`DPP = Total`, `PPN = 0`).
5. Agregasi status invoice: Belum Invoice (Rp 0), Sebagian Invoice (antara Rp 0 dan Total), Sudah Invoice (lunas di-invoice).
6. Pengecualian invoice yang dibatalkan (`status = 0`) dari akumulasi `sudahInvoice`.
7. Resolusi status pembayaran: `BELUM_BAYAR`, `SEBAGIAN`, `LUNAS`.

### B. `tests/unit/modules/sales/SalesInvoiceWorkflow.spec.ts` (10 Pengujian)

Memverifikasi integrasi alur data, validasi, dan transaksi:

1. Membaca daftar invoice berdasarkan ID Sales Order.
2. Penomoran urut otomatis invoice berikutnya.
3. Menolak pembuatan invoice jika nominal melebihi sisa SO (_over-invoicing guard_).
4. Pembuatan invoice baru sukses dan mencatat audit ke `histori_table` (`metode = 'INVOICE_CREATE'`).
5. Membatalkan invoice dan memulihkan sisa plafon SO.
6. Menolak pembatalan invoice jika terdapat pembayaran (`terbayar > 0`).
7. Mengambil riwayat histori SO terurut kronologis terbaru.
8. Pembaruan tanggal SO sukses dan tercatat di `histori_table` (`metode = 'EDIT_DATE'`).
9. Menolak pembaruan tanggal pada SO yang telah dibatalkan.
10. Pembatalan SO menolak dieksekusi jika terdapat invoice dengan pembayaran aktif.

### C. `tests/unit/modules/sales/SalesInvoicePage.spec.ts` (5 Pengujian)

Memverifikasi tampilan UI dan interaksi pengguna pada halaman Sales Invoice:

1. Merender header halaman dengan badge varian, nomor SO, dan nama customer.
2. Merender 2 kolom informasi ringkasan SO (Total SO, Sudah Invoice, Sisa Invoice).
3. Merender tabel 12 kolom daftar invoice sesuai screenshot legacy.
4. Membuka modal Buat Invoice saat tombol "+ Buat Invoice" diklik.
5. Menampilkan state kosong (_empty state_) yang elegan bila belum ada invoice.

### D. `tests/unit/modules/sales/SalesOrderList.spec.ts` (5 Pengujian)

Memverifikasi integrasi actions menu pada daftar SO:

1. Merender 7 aksi berurutan: History Sales Order, Edit Tanggal, Lihat, Invoice, Cetak Surat Jalan, Ubah, Batalkan Transaksi.
2. Membuka modal History dan memuat timeline saat aksi diklik.
3. Membuka modal Edit Tanggal saat aksi diklik.
4. Navigasi ke halaman invoice saat aksi Invoice diklik.

---

## 3. Matriks Skenario Edge-Case

| Kasus Uji (Test Case)                            | Ekspektasi Sistem                                                               | Status Hasil |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | ------------ |
| Input nominal invoice > sisa SO                  | Ditolak dengan pesan validasi "Nominal invoice melebihi sisa total Sales Order" | ✅ PASSED    |
| Pembatalan invoice dengan `terbayar > 0`         | Ditolak dengan exception demi keamanan buku besar kas/bank                      | ✅ PASSED    |
| Edit tanggal pada SO dengan `status_aktif === 0` | Aksi disabled pada UI & ditolak oleh service layer                              | ✅ PASSED    |
| Perhitungan PPN nilai ganjil (cth: Rp 999.999)   | `DPP + PPN` tepat sama dengan `Rp 999.999` tanpa selisih Rp 1                   | ✅ PASSED    |
| Invoice dibatalkan (`status = 0`)                | `sudahInvoice` berkurang, `sisaInvoice` bertambah                               | ✅ PASSED    |
| Aksi 'Cetak Surat Jalan' diklik                  | Menampilkan toast pemberitahuan ketersediaan modul pengiriman                   | ✅ PASSED    |

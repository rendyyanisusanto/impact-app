# SPRINT 7 — SALES ORDER TESTING & QA VALIDATION

## 1. STRATEGI PENGUJIAN

Pengujian fitur Sales Order menggunakan Vitest dan Vue Test Utils dengan pendekatan TDD/BDD komprehensif, mencakup 6 suite pengujian spesifik di `app/tests/unit/modules/sales/`:

1. **`SalesOrderFoundation.spec.ts` (14 tests)**:
   - Konversi 12 bulan kalender ke angka Romawi.
   - Pola format penomoran dokumen Impact, Pola, dan KS.
   - Perhitungan matematis subtotal, diskon baris, PPN 11%, dan non-PPN.
   - Evaluasi formula DPP dan Biaya Tambahan.
   - Validasi data input form (header dan spreadsheet).
   - Deteksi pencegahan duplikasi produk.
2. **`SalesOrderList.spec.ts` (5 tests)**:
   - Render antarmuka DataTable untuk masing-masing varian.
   - Verifikasi isolasi data transaksi pada masing-masing varian.
   - Pengujian kolom kondisional Faktur Pajak.
   - Filter pencarian kata kunci dan salesman.
   - Keberadaan seluruh tombol aksi baris.
3. **`SalesOrderForm.spec.ts` (6 tests)**:
   - Inisialisasi default 10 baris kosong pada formulir Create.
   - Operasi penambahan dan penghapusan baris spreadsheet.
   - Pemilihan produk dari picker yang memperbarui stok dan harga.
   - Integrasi penambahan komponen biaya tambahan.
   - Perbedaan kalkulasi PPN antara Impact dan Pola/KS.
   - Pengisian form otomatis pada mode Edit.
4. **`SalesOrderDetailNota.spec.ts` (4 tests)**:
   - Render layout Nota Penjualan mengacu ke Screenshot 3.
   - Render tabel Biaya Tambahan (`komponen_sales_order`).
   - Riwayat frekuensi cetak (`count_print`) dan tombol reset counter ke 0.
   - Peningkatan otomatis nilai `count_print` saat aksi cetak dipicu.
5. **`SalesOrderPrintFaktur.spec.ts` (3 tests)**:
   - Render layout Faktur Komersial mengacu ke Screenshot 4.
   - Format 3 kolom tanda tangan (Penerima, Gudang, Salesman).
   - Pengujian tombol pemicu cetak dan styling `@media print`.
6. **`SalesOrderSecurityIsolation.spec.ts` (5 tests)**:
   - Proteksi isolasi akses dokumen antar varian (misalnya permintaan ID Impact dari konteks URL Pola ditolak).
   - Integritas data saat mutasi terjadi.

---

## 2. HASIL EKSEKUSI PENGUJIAN

- **Total Suite Pengujian Proyek**: 87 File Pengujian Lulus (100%).
- **Total Unit & Integration Tests**: 489 Tests Lulus (100%).
- **Regresi Sistem**: 0 Galat / 0 Kegagalan.

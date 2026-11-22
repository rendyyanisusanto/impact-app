# Sprint 5 — Fitur 2: Penyesuaian Stok Bahan Testing & QA Report

## 1. Lingkup Pengujian

Pengujian mencakup:

1. **List & DataTable (`StockAdjustmentList.spec.ts`)**:
   - Header, breadcrumb, filter bar, dan tombol aksi toolbar.
   - Verifikasi ketat ketiadaan tombol Import Excel.
   - Pencarian berdasarkan kode dan keterangan.
   - Navigasi ke halaman create.
2. **Form Input, Spreadsheet & Detail (`StockAdjustmentForm.spec.ts`)**:
   - Auto-generated sequence number `PS/YYYY/MM/seq`.
   - Excel-like spreadsheet editor dengan double-click selector dan perhitungan selisih otomatis.
   - Sticky action bar dengan indikator total tepat di samping tombol "Batalkan".
   - Rincian halaman detail lengkap dengan tanda tangan 3 pihak (Petugas Opname, SPV Gudang, Audit Akuntansi).
3. **Integrasi Pergerakan Stok (`StockAdjustmentStockIntegration.spec.ts`)**:
   - Penambahan stok jika $\text{Selisih} > 0$ dan pencatatan histori masuk.
   - Pengurangan stok jika $\text{Selisih} < 0$ dan pencatatan histori keluar.
   - Tidak ada pergerakan stok jika dokumen disimpan sebagai Draft (`status = 0`).
   - Rollback / reversal otomatis saat dokumen dibatalkan.
   - Perlindungan idempotensi terhadap posting berulang.

---

## 2. Hasil Eksekusi Test Suite

```
Test Files  3 passed (3)
     Tests  13 passed (13)
```

Ringkasan Hasil Uji:

- `StockAdjustmentList.spec.ts`: 4/4 PASSED
- `StockAdjustmentForm.spec.ts`: 4/4 PASSED
- `StockAdjustmentStockIntegration.spec.ts`: 5/5 PASSED

---

## 3. Regresi Seluruh Modul

Eksekusi full test suite proyek:

```
Test Files  71 passed (71)
     Tests  398 passed (398)
```

Semua 71 test suite proyek (Master Data, Purchase Order, Goods Receipt, Supplier Bill Payments, Mutasi Bahan, dan Penyesuaian Stok Bahan) lulus 100% tanpa regresi.

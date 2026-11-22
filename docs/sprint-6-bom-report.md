# Sprint 6 — Bill of Materials (BoM) / Template Produk Final Report

## 1. Executive Summary

Implementasi **Sprint 6 Tasks 1–6 (Bill of Materials / Template Produk)** pada sistem **Impact Furniture v2** telah selesai 100% dan terverifikasi secara menyeluruh.

Fitur ini memungkinkan departemen teknik / R&D dan manajemen produksi menyusun komposisi resep material per unit produk furniture, menghitung estimasi biaya baku, menduplikasi resep antar model produk, mencetak format dokumen spesifikasi resmi manufaktur, mengekspor data ke Excel dan PDF, serta mensimulasikan kebutuhan material (MRP Preview) berdasarkan target produksi tanpa memotong stok gudang.

---

## 2. Ringkasan Implementasi Task 1–6

### Task 1 — BoM Foundation & Database Schema Audit

- Verifikasi skrip SQL legacy `u1573701_smm.sql` membuktikan tabel `template_produk` dan `detail_template_produk` adalah master recipe murni dengan 0 trigger stok (kontras dengan tabel transaksi produksi yang memicu mutasi stok).
- Implementasi domain model TypeScript strict di `app/src/modules/production/types/bom.types.ts`.
- Implementasi mock service dan repository di `app/src/modules/production/services/bom.service.ts` dengan CRUD lengkap, sequence generator `TPL-YYYYMM-XXX`, duplikasi resep, dan isolasi mutasi stok.

### Task 2 — BoM List & DataTable

- Halaman `BomListPage.vue` dengan KPI metrics header (Total Template, Produk Memiliki BoM, Rata-rata Bahan per BoM, Rata-rata Est. Biaya per Unit).
- DataTable dengan fitur pencarian real-time multi-field, filter produk furniture, filter status template aktif/non-aktif, paginasi dinamis, dan skeleton loading.
- **Kepatuhan Scope**: Tidak ada tombol Import Excel pada BoM List.
- Fitur Export Excel dan Export PDF dengan layout profesional.

### Task 3 — BoM Create & Edit with Spreadsheet

- Halaman `BomCreatePage.vue` dan `BomEditPage.vue` dirancang sebagai **Full Page** (bukan modal) dengan route `/production/bom/create` dan `/production/bom/:id/edit`.
- Komponen spreadsheet `BomSpreadsheet.vue` dengan input keyboard cepat, kalkulasi subtotal instan, penambahan/penghapusan baris, dan pemilih bahan `BomMaterialPicker.vue` dengan interaksi double-click.
- **Sticky Bottom Action Bar** melayang dengan tombol `Batalkan`, di samping kanannya langsung indikator ringkasan live `Komposisi: X jenis bahan | Est. Biaya Bahan per Unit: Rp ...`, dan tombol Simpan.
- Pelacakan dirty state dengan peringatan pembatalan saat formulir telah dimodifikasi.

### Task 4 — BoM Detail, Delete, Duplicate & Print

- Halaman `BomDetailPage.vue` menyajikan spesifikasi lengkap template BoM dalam format dokumen teknis manufaktur.
- Aksi Duplikasi Resep dengan pembuatan kode otomatis dan penyalinan seluruh komposisi material.
- Aksi Nonaktifkan (soft delete) dengan dialog konfirmasi aman.
- Aksi Cetak (`window.print()`) dan Ekspor PDF spesifikasi resep dengan 3 kolom tanda tangan otorisasi (Dibuat oleh R&D, Diperiksa Kepala Produksi, Disetujui Factory Manager).

### Task 5 — BoM Calculation & Material Requirements Simulation (MRP Preview)

- Utility mesin hitung `bom-calculations.ts` yang menghitung kebutuhan total bahan baku secara desimal-safe:
  $$\text{Total Kebutuhan} = \text{Qty per Produk} \times \text{Target Produksi}$$
  $$\text{Selisih Stok} = \text{Stok Tersedia} - \text{Total Kebutuhan}$$
- Komponen interaktif `BomMaterialRequirements.vue` pada Detail Page yang mengevaluasi status ketersediaan stok riil gudang (CUKUP / KURANG) dan menghitung kekurangan kuantitas bahan yang perlu diadakan.
- **Jaminan Zero Stock Movement**: Seluruh proses simulasi murni kalkulasi read-only di memori tanpa memotong saldo stok riil gudang.

### Task 6 — Integration, RBAC, Testing & Final QA

- Hak akses granular RBAC terintegrasi (`production:bom:view`, `production:bom:create`, `production:bom:update`, `production:bom:delete`, `production:bom:export`).
- Penambahan 5 test suite Vitest baru (27 tests) khusus BoM.
- Verifikasi menyeluruh:
  - `npm run typecheck` : 0 error
  - `npm run lint` : 0 error
  - `npm run format:check` : 100% compliant
  - `npm test` : 76 test files, 425 tests PASSED
  - `npm run build` : Sukses tanpa warning/error
- Scope lock: Pekerjaan dibatasi ketat pada Task 1–6; modul Transaksi Produksi (Task 7–12) belum dikerjakan.

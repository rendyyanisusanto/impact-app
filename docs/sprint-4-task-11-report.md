# Sprint 4 — Task 11 Implementation Report

## Procurement Integration, RBAC & Cross-Module Workflow

---

### 1. Executive Summary

Task 11 memverifikasi dan mengintegrasikan seluruh rantai pengadaan terintegrasi:
**Supplier → Purchase Order → Penerimaan Barang → Stock Mutation → Pembayaran Tagihan → Buku Bank / Kas**.

---

### 2. Cross-Module Referential Integrity

1. **PO ke PB**:
   - Hanya PO yang berstatus disetujui (`status = 1`) dan aktif (`status_aktif = 1`) yang dapat dipilih saat membuat Penerimaan Barang.
   - PO yang dibatalkan otomatis tidak muncul pada pilihan dokumen.
   - Penerimaan parsial didukung secara penuh: sisa kuantitas pesanan (`remaining_qty`) dihitung dinamis dari seluruh PB aktif yang telah tercatat sebelumnya.
2. **PB ke Stok**:
   - Saat PB dikonfirmasi (`status = 1`), stok bahan pada `master_data_bahan.qty` bertambah secara atomik.
   - Perubahan dicatat pada buku pembantu stok `histori_stok_bahan` dengan jenis mutasi `masuk`.
   - Jika PB dibatalkan, dilakukan reversal stok dan riwayat `keluar` dicatat.
3. **PB ke Pembayaran Tagihan (PT)**:
   - Pembayaran Tagihan ditautkan ke satu atau beberapa dokumen PB melalui tabel relasi `detail_pb_pt`.
   - Setiap pembayaran mengurangi sisa tagihan dokumen PB.
   - Jika sisa tagihan menjadi 0, status pembayaran menjadi Lunas (`status = 1`) dan dokumen PB tidak lagi muncul dalam daftar tagihan aktif.

---

### 3. RBAC Enforcement & Service Boundary

- **Permissions**: `procurement:read`, `procurement:create`, `procurement:update`, `procurement:delete`.
- Akses diverifikasi pada level route guard dan pada mock service boundary menggunakan fungsi assertion `assertPermission()`.
- Pengguna yang tidak memiliki izin `procurement:create` ditolak secara langsung saat mencoba membuat transaksi PO, PB, atau PT.

---

### 4. Verification & Testing

Integration test suite terdedikasi diimplementasikan pada `app/tests/unit/modules/procurement/ProcurementIntegrationWorkflow.spec.ts`:

- **11.1**: Siklus lengkap end-to-end: PO disetujui → PB Parsial 1 (8 unit) memutasi stok → PB Parsial 2 (12 unit) menyelesaikan pesanan → Pembayaran Tagihan PB 1 melunasi dokumen.
- **11.2**: Pemblokiran dokumen PO yang dibatalkan dari proses penerimaan.
- **11.3**: Atomic rollback saat terjadi kegagalan validasi pembayaran (mempertahankan integritas repository).
- **11.4**: Penolakan otorisasi di service boundary untuk pengguna tanpa permission yang memadai.
- **Hasil**: 4 dari 4 integration test lulus (100% Passed).

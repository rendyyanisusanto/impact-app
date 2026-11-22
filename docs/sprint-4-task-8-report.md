# Sprint 4 — Task 8 Implementation Report

## Penerimaan Barang Stock Integration & Stock History

---

### 1. Executive Summary

Task 8 menghubungkan dokumen Penerimaan Barang (Goods Receipt / PB) dengan modul Persediaan Bahan secara aman, idempotence, dan atomik. Implementasi berlandaskan temuan langsung dari MariaDB schema dump `u1573701_smm.sql` (trigger `add_stock` dan `update_stok` pada tabel `detail_penerimaan_barang`).

---

### 2. Schema Audit & Verified Database Contracts

| Table                      | Role & Columns                                                                                                              | Legacy Trigger / SQL Equivalent                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `master_data_bahan`        | Menyimpan saldo kuantitas stok bahan fisik saat ini pada kolom `qty` (dalam unit `satuan_pakai_id`).                        | `UPDATE master_data_bahan SET qty = qty + NEW.qty_terima WHERE id = NEW.bahan_id;`                                          |
| `detail_penerimaan_barang` | Menyimpan item bahan yang diterima: `bahan_id`, `qty_pesan`, `qty_terima`, `satuan_beli_id`, `harga_satuan`, `diskon`.      | Subtotal dihitung secara reaktif di UI (bukan kolom database).                                                              |
| `histori_stok_bahan`       | Audit trail buku kartu stok: `bahan_id`, `keterangan`, `tanggal`, `created_by`, `kode`, `masuk`, `keluar`, `tbl`, `tbl_id`. | `INSERT INTO histori_stok_bahan (bahan_id, keterangan, tanggal, created_by, kode, masuk, keluar, tbl, tbl_id) VALUES (...)` |
| `konversi_satuan_bahan`    | Faktor konversi dari satuan beli ke satuan pakai: `bahan_id`, `satuan_id`, `nilai`, `default`.                              | Digunakan untuk mengalikan kuantitas terima jika satuan beli berbeda dari satuan pakai.                                     |

---

### 3. Business Rules & Stock Posting Workflow

1. **Posting Boundary**:
   - Stok bertambah **hanya** ketika Penerimaan Barang berstatus **Diterima (`status = 1`)**.
   - Dokumen Penerimaan Barang berstatus Draft (`status = 0`) **tidak** memutasi stok.
2. **Idempotency Guarantee**:
   - Pelacakan dokumen melalui `postedReceiptIds` mencegah double posting.
   - Pemanggilan kedua untuk dokumen PB yang sama bersifat no-op dan mengembalikan flag `posted: true` dengan 0 mutasi ganda.
3. **Unit Conversion**:
   - Jika bahan memiliki entri `konversi_satuan_bahan` yang cocok dengan `satuan_beli_id`, stok bertambah sebesar $\text{qty\_terima} \times \text{nilai}$.
   - Default konversi adalah 1 jika tidak ada baris konversi spesifik.
4. **Reversal / Cancellation**:
   - Ketika dokumen PB dibatalkan (`delete(id)`), stok bahan dikurangi kembali secara otomatis.
   - Entri baru dicatat pada `histori_stok_bahan` dengan `keluar = stock_added` dan `keterangan = "Batal data bahan " + pb.kode`.
   - Dokumen dikeluarkan dari set posted.

---

### 4. Verification & Testing

Unit test suite terdedikasi diimplementasikan pada `app/tests/unit/modules/procurement/GoodsReceiptStockIntegration.spec.ts`:

- **8.1**: Memverifikasi entri awal seed histori stok bahan dan status posted.
- **8.2**: Memverifikasi penambahan stok akurat dan pembuatan kartu stok `histori_stok_bahan` saat PB baru dibuat.
- **8.3**: Memverifikasi prinsip idempotency (pemanggilan posting kedua tidak menduplikasi stok).
- **8.4**: Memverifikasi dokumen PB Draft tidak memutasi stok fisik.
- **8.5**: Memverifikasi pembalikan (reversal) stok dan pencatatan riwayat saat PB dibatalkan.
- **Hasil**: 5 dari 5 unit test lulus (100% Passed).

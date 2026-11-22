# SPRINT 5 — FITUR 1: MUTASI STOK BAHAN

## STOCK MOVEMENT WORKFLOW & ATOMIC POSTING

### 1. Siklus Hidup Transaksi Mutasi Bahan

```
   [ Buat Mutasi ]
          │
          ├── Simpan sebagai Draft (status = 0) ──► Stok Tidak Berubah
          │                                              │
          │                                              ▼
          │                                      [ Posting Mutasi ]
          │                                              │
          ▼                                              ▼
   Simpan & Posting (status = 1) ────────────────► [ Atomic Stock Posting ]
                                                         │
                                                         ├─ 1. Snapshot validasi saldo
                                                         ├─ 2. Konversi satuan pakai/beli
                                                         ├─ 3. Kurangkan saldo di master_data_bahan
                                                         └─ 4. Catat record ke histori_stok_bahan
                                                               (keluar = qty, masuk = 0, tbl = 'mutasi_bahan')
```

---

### 2. Aturan Perhitungan & Idempotensi

1. **Konversi Satuan (Conversion Factor)**:
   - Jika mutasi menggunakan satuan beli yang berbeda dari satuan pakai dasar, kuantitas dikalikan dengan faktor konversi di `konversi_satuan_bahan`.
   - Contoh: 1 Dus Busa = 10 Lembar. Mutasi 2 Dus akan memotong 20 Lembar di stok persediaan.

2. **Perlindungan Idempotensi (Idempotency Guard)**:
   - Setiap mutasi yang telah diposting disimpan ID-nya dalam `postedMutationIds: Set<number>`.
   - Pemanggilan posting ulang dengan ID dokumen yang sama tidak akan memotong stok untuk kedua kalinya.

3. **Pembalikkan Saldo Otomatis (Reversal upon Deletion/Cancellation)**:
   - Jika dokumen berstatus `1` (Selesai/Posted) dibatalkan atau dihapus:
     - Seluruh kuantitas yang sebelumnya dipotong akan ditambahkan kembali ke `master_data_bahan.qty`.
     - Catatan pembalikkan dibuat di `histori_stok_bahan` dengan `masuk = qty_semula`, `keluar = 0`, dan keterangan `Batal Mutasi Bahan ...`.
     - Status dokumen diubah menjadi non-aktif / draft (`status_aktif = 0`, `status = 0`).

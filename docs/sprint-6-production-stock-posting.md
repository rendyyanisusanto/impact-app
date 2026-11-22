# Sprint 6 — Production Stock Posting & Inventory Integration

## 1. Mekanisme Posting Stok Otomatis

Modul Transaksi Produksi di Impact Furniture V2 mengintegrasikan dua domain persediaan yang berbeda:

1. **Persediaan Barang Jadi (Finished Goods)** pada tabel `produk` dan `kartu_stok_produk`.
2. **Persediaan Bahan Baku (Raw Materials)** pada tabel `master_data_bahan` dan `histori_stok_bahan`.

Kedua mutasi persediaan ini dipicu secara atomik saat status produksi mencapai **Selesai (`status_produksi = 2`)**.

---

## 2. Arsitektur Mutasi Dual-Inventory

```
                                  [ STATUS PRODUKSI = SELESAI (2) ]
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
             [ BARANG JADI / FINISHED GOODS ]                     [ BAHAN BAKU / RAW MATERIALS ]
                         │                                                 │
          ┌──────────────┴──────────────┐                   ┌──────────────┴──────────────┐
          ▼                             ▼                   ▼                             ▼
   produk.qty                   kartu_stok_produk    master_data_bahan.qty         histori_stok_bahan
   (Saldo Fisik                 (Catatan Kartu Stok  (Saldo Fisik Bahan            (Catatan Mutasi
    Bertambah [+])               Mutasi Masuk [+])    Berkurang [-])                Pengeluaran [-])
```

---

## 3. Langkah Transaksional Posting

Ketika metode `completeProduction(id)` dieksekusi di `production.service.ts`:

### 3.1 Validasi Idempotensi

Sistem memeriksa apakah ID transaksi telah terdaftar di `postedProductionIds: Set<number>`:

- Jika sudah pernah di-posting, service menolak proses ulang dan melempar exception:
  `"Transaksi produksi ini sudah diposting sebelumnya. Idempotency guard aktif."`

### 3.2 Penambahan Stok Produk Jadi

Untuk setiap baris produk pada transaksi produksi:

1. Mengambil produk via `productService.getProductById(item.produk_id)`.
2. Memperbarui saldo fisik: $\text{qty}_{\text{baru}} = \text{qty}_{\text{lama}} + \text{qty}_{\text{produksi}}$.
3. Mencatat jurnal mutasi ke `kartu_stok_produk`:
   - `tanggal`: Tanggal transaksi SPK.
   - `produk_id`: ID produk bersangkutan.
   - `masuk`: `item.qty`.
   - `keluar`: `0`.
   - `keterangan`: `CONCAT('Hasil Produksi: ', produksi.kode)`.

### 3.3 Pemotongan Stok Bahan Baku (Konsumsi BoM)

Untuk setiap bahan baku yang dihasilkan dari formula BoM:

1. Menghitung total kebutuhan unit bahan baku.
2. Mengambil data bahan via `materialService.getMaterialById(req.bahan_id)`.
3. Memperbarui saldo fisik bahan: $\text{qty}_{\text{baru}} = \text{qty}_{\text{lama}} - \text{req.total_kebutuhan}$.
4. Mencatat jurnal pemakaian bahan ke `histori_stok_bahan`:
   - `tanggal`: Tanggal transaksi SPK.
   - `bahan_id`: ID bahan baku.
   - `masuk`: `0`.
   - `keluar`: `req.total_kebutuhan`.
   - `keterangan`: `CONCAT('Konsumsi Produksi: ', produksi.kode)`.
5. Mencatat relasi snapshot riil pada `detail_bahan_produksi`.

### 3.4 Pembaruan Status Dokumen

- Memperbarui header `produksi`:
  - `status_produksi = 2` (Selesai).
  - `status = 1` (Posted).
- Menyimpan ID produksi ke dalam `postedProductionIds`.

---

## 4. Mekanisme Reversal / Pembatalan

Jika dokumen yang sudah berstatus `Selesai` dibatalkan (`cancelProduction(id)`):

1. **Pemeriksaan Idempotensi Reversal**: Memastikan ID belum ada di `reversedProductionIds`.
2. **Reversal Produk Jadi**:
   - $\text{produk.qty} = \text{produk.qty} - \text{item.qty}$.
   - Mencatat penyesuaian keluar pada `kartu_stok_produk` (`keluar = item.qty`, keterangan: `CONCAT('Pembatalan Produksi: ', produksi.kode)`).
3. **Reversal Bahan Baku**:
   - Mengembalikan saldo: $\text{master_data_bahan.qty} = \text{master_data_bahan.qty} + \text{qty_konsumsi}$.
   - Mencatat pemulihan masuk pada `histori_stok_bahan` (`masuk = qty_konsumsi`, keterangan: `CONCAT('Pemulihan Pembatalan Produksi: ', produksi.kode)`).
4. **Pembaruan Status Dokumen**:

- `status_aktif = 0` (Non-aktif / Void).
- Menambahkan ID produksi ke `reversedProductionIds`.

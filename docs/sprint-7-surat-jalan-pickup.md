# SPRINT 7 — PENGAMBILAN SENDIRI (SELF PICKUP)

## 1. Konsep & Perbedaan Bisnis Pengambilan Sendiri

Pada proses bisnis mebel dan furnitur Impact, pelanggan seringkali mengambil pesanan mereka secara mandiri ke gudang pabrik menggunakan armada sendiri (mobil pikap, truk sewa, atau utusan toko) tanpa melalui pengemudi atau ekspedisi perusahaan.

Untuk memfasilitasi kebutuhan ini secara terpisah dan jelas:

1. Tersedia tombol tersendiri **"Pengambilan Sendiri"** pada toolbar Daftar Surat Jalan.
2. Membuka rute form dedicated `/delivery/notes/pickup/create`.
3. Menandai record secara eksplisit:
   - `status_ambil = 1` (Ambil Sendiri).
   - `status_kirim = 2` (AMBIL SENDIRI).
   - `nama_pengirim` terisi default: `"Diambil Sendiri oleh Pelanggan"`.
   - Kode dokumen otomatis diprefiks: `SJA/YY/MM/XXXX` (Surat Jalan Ambil).

---

## 2. Penyesuaian Dokumen Cetak

Ketika dicetak melalui `/delivery/notes/:id/print`, dokumen secara cerdas mendeteksi `status_ambil === 1`:

- Judul Dokumen berubah menjadi: **SURAT PENGAMBILAN SENDIRI** (atau TANDA TERIMA PENGAMBILAN SENDIRI).
- Kolom alamat pengiriman berubah menjadi: **Diambil Oleh / Customer**.
- Kolom pengemudi/ekspedisi berubah menjadi: **Nama Pengambil / Utusan Pelanggan**.
- Kolom tanda tangan ke-2 disesuaikan menjadi **Pengambil Barang (Nama Terang & Tanda Tangan)**.

---

## 3. Integrasi Persediaan pada Pengambilan Sendiri

Karena barang diserahkan secara langsung di gudang saat pengambilan mandiri:

- Default status dokumen pada form Pengambilan Sendiri langsung diset **Succeeded (Sah & Siap Kirim)**.
- Stok produk di gudang langsung dikurangi saat formulir disimpan.
- Status pengiriman langsung tercatat sebagai **AMBIL SENDIRI** tanpa perlu menunggu konfirmasi perjalanan sopir.

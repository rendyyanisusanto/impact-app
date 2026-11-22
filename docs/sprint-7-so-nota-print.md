# SPRINT 7 — DETAIL NOTA & CETAK FAKTUR PENJUALAN

## 1. DETAIL NOTA PENJUALAN (SCREENSHOT 3)

Halaman Detail Nota Penjualan (`/sales/so-{variant}/:id/nota`) menyajikan dokumen transaksi resmi yang mencerminkan Screenshot 3:

1. **Header Nota**:
   - Kop surat resmi sesuai varian bisnis (IMPACT FURNITURE / POLARIS / KS).
   - Judul dokumen: **NOTA PENJUALAN**.
   - Nomor SO, Nomor Faktur Pajak (jika Impact), Tanggal transaksi.
   - Nama & Alamat Customer, Nama Salesman penanggung jawab.
2. **Tabel Item Produk**:
   - Kolom: `Jumlah (Qty + Satuan)`, `Kode`, `Nama Barang`, `Keterangan`, `Harga Satuan`, `Diskon`, `Subtotal`.
3. **Tabel Biaya Tambahan (`komponen_sales_order`)**:
   - Komponen ongkos kirim, jasa modifikasi, dan biaya ekstra yang dibebankan kepada customer.
4. **Ringkasan Finansial**:
   - Subtotal Item, PPN (jika aktif), dan Total Bayar.
5. **Kolom Tanda Tangan**:
   - Tanda Terima Customer & Hormat Kami (Salesman).
6. **Print Counter Engine**:
   - Menampilkan frekuensi cetak nota (`count_print` dari MariaDB).
   - Tombol **Reset Counter** untuk mengembalikan frekuensi cetak ke `0`.
   - Tombol **Cetak Nota** yang otomatis menambah `count_print += 1` dan memicu dialog print.
   - Tombol **Unduh PDF** menggunakan engine generator `jspdf-autotable`.

---

## 2. CETAK FAKTUR PENJUALAN (SCREENSHOT 4)

Halaman Cetak Faktur (`/sales/so-{variant}/:id/print`) menyajikan dokumen faktur komersial siap cetak yang mencerminkan Screenshot 4:

1. **Format Desain A4 Portrait**:
   - Layout berukuran kertas standar A4 dengan margin yang dioptimalkan untuk printer kantor.
   - Menggunakan `@media print` CSS utility yang menyembunyikan navigasi web browser, navbar aplikasi, dan tombol aksi saat proses cetak berjalan.
2. **Kop Surat & Identitas Perusahaan**:
   - Judul: **FAKTUR**.
   - Nomor Faktur, Tanggal, Kepada Yth (Customer & Alamat), Salesman.
3. **Tabel Rincian**:
   - Kolom: `No`, `Banyaknya`, `Nama Barang`, `Keterangan`, `Harga Satuan`, `Disc`, `Jumlah`.
4. **Blok 3 Tanda Tangan**:
   - Tanda Terima (Customer)
   - Bagian Gudang
   - Hormat Kami (Salesman)
5. **Catatan Standar Komersial**:
   - Kalimat syarat jual-beli furnitur standar perusahaan di bagian bawah faktur.

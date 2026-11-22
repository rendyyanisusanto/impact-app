# SPRINT 7 — FORM SURAT JALAN: IMPLEMENTASI UX SCREENSHOT 2

## 1. Referensi UX Screenshot 2

Berdasarkan screenshot legacy "Tambah Surat Jalan", form didesain dalam format **halaman penuh (Full Page)** dengan layout kartu header 2 kolom dan spreadsheet detail produk di bagian bawah:

### A. Kolom Kiri: Informasi Pemesanan & Customer

1. **Sales Order**: Searchable picker dengan tombol pencarian ("Cari SO"). Menampilkan kode SO dan nama customer.
2. **No Surat Jalan**: Input teks dengan tombol generate ulang. Format penomoran otomatis menyesuaikan varian SO (`SJ/26/03/XXXX` untuk Impact, `SJ/26/PL/03/XXXX` untuk Pola, `SJ/26/ROMAN/XXXX` untuk KS).
3. **Customer**: Input teks read-only, terisi otomatis saat SO dipilih.
4. **Sales**: Input teks read-only, terisi otomatis nama salesman dari SO.
5. **Total Pembelian**: Input teks read-only berformat rupiah, terisi otomatis nilai total pesanan SO.

### B. Kolom Kanan: Informasi Pengiriman & Dokumen

1. **Dokumen**: Input teks read-only "Surat Jalan" (atau "Pengambilan Sendiri" pada form pickup).
2. **Tanggal**: Date picker untuk tanggal pengiriman, default hari ini.
3. **Nama Pengirim**: Input teks nama sopir internal / ekspedisi / pengemudi.
4. **Keterangan**: Textarea untuk catatan pengiriman, instruksi khusus, atau rute pengiriman.
5. **Status Dokumen**: Dropdown pilihan "Draft" (0) atau "Succeeded (Sah & Siap Kirim)" (1).

---

## 2. Spreadsheet Detail Barang

### Kondisi A: Belum Memilih Sales Order

Sebelum Sales Order dipilih, tabel menampilkan callout state kosong:

> _"Pilih No. Sales Order terlebih dahulu untuk memuat daftar produk yang siap dikirim."_

### Kondisi B: Setelah Sales Order Dipilih

Tabel spreadsheet langsung memuat seluruh item produk dari Sales Order yang dipilih beserta kalkulasi riwayat pengirimannya:

| Kolom              | Tipe Input        | Deskripsi                                                               |
| ------------------ | ----------------- | ----------------------------------------------------------------------- |
| **No**             | Angka             | Urutan baris produk (1, 2, ...)                                         |
| **Nama Produk**    | Teks              | Nama produk, kode produk, dan satuan barang                             |
| **QTY Pemesanan**  | Angka (Read-only) | Jumlah kuantitas pesanan awal pada SO                                   |
| **Sudah Dikirim**  | Angka (Read-only) | Akumulasi kuantitas yang sudah dikirim pada surat jalan sebelumnya      |
| **Sisa QTY**       | Angka Badge       | `QTY Pemesanan - Sudah Dikirim`                                         |
| **QTY Pengiriman** | Number Input      | Kuantitas yang akan dikirim pada surat jalan ini. Min: 0, Max: Sisa QTY |
| **Keterangan**     | Text Input        | Catatan per item (misal: "Koli 1-2", "Packing Kayu")                    |

### Fitur Quick Actions Spreadsheet:

- **Kirim Semua Sisa**: Tombol pintas untuk otomatis mengisi seluruh baris produk dengan nilai `qty_kirim = sisa_qty`.
- **Kosongkan**: Mereset seluruh nilai `qty_kirim = 0`.

---

## 3. Validasi & Integritas Transaksi

- Validasi wajib memilih Sales Order.
- Validasi nomor surat jalan unik (tidak boleh duplikat).
- Validasi minimal 1 baris produk memiliki kuantitas pengiriman > 0.
- Validasi kuantitas pengiriman tidak boleh melebihi sisa kuantitas pesanan.
- Pilihan simpan ganda:
  - **Simpan sebagai Draft**: Dokumen disimpan dengan status Draft, stok fisik gudang belum dikurangi.
  - **Simpan & Selesaikan**: Dokumen disahkan, stok fisik gudang otomatis dikurangi, dan status delivery pada SO disinkronkan.

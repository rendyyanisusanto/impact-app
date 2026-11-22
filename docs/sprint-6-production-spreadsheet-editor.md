# Sprint 6 — Production Spreadsheet Editor UX & Keyboard Navigation

## 1. Overview & Legacy Compatibility

Komponen spreadsheet input detail barang jadi (`ProductionSpreadsheet.vue`) dirancang untuk mematuhi secara ketat tata letak dan interaksi pada screenshot form legacy sistem SMM, sekaligus memberikan penyempurnaan ergonomis desktop modern tanpa merusak konvensi pengguna.

---

## 2. Struktur Kolom Sesuai Legacy Screenshot

Detail transaksi produksi fokus pada **Barang Jadi (Finished Goods)** yang akan dirakit/dibuat di pabrik. Kolom disusun persis sesuai screenshot:

| No    | Nama Kolom      | Properti Model              | Mode Edit          | UX Behavior                                                                                                            |
| ----- | --------------- | --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **1** | **No**          | `index + 1`                 | Read-only          | Nomor urut baris (1-based). Tampilan di-center.                                                                        |
| **2** | **Nama Produk** | `produk_id` / `nama_produk` | Interactive Picker | Menampilkan nama produk dan badge BoM. Double-click atau tekan `Enter` untuk membuka modal **Product Picker**.         |
| **3** | **Stok**        | `stok_saat_ini`             | Read-only          | Menampilkan saldo fisik persediaan produk saat ini dari database/service. Dilengkapi satuan unit (cth. `Pcs`, `Unit`). |
| **4** | **Qty**         | `qty`                       | Inline Editable    | Input angka integer positif (`> 0`). Mendukung navigasi panah, tab, dan validasi seketika.                             |
| **5** | **Keterangan**  | `keterangan`                | Inline Editable    | Catatan per item produk (misal: "Finishing Walnut Glossy", "Khusus Proyek Hotel").                                     |

---

## 3. Product Picker Modal

Komponen `ProductionProductPicker.vue` berfungsi sebagai modal pencarian cepat produk jadi:

- **Pemicu**: Double-click cell "Nama Produk" atau tekan `Enter` saat cell aktif.
- **Search Input**: Input auto-focus dengan pencarian real-time pada kode produk (`kode`) dan nama produk (`nama`).
- **Navigasi Keyboard**:
  - `ArrowDown` / `ArrowUp`: Memindahkan kursor pemilihan baris produk.
  - `Enter`: Memilih produk yang aktif dan menutup modal secara otomatis.
  - `Escape`: Menutup modal tanpa mengubah data.
- **Auto-Focus Target**: Setelah produk dipilih, fokus input otomatis berpindah ke cell **Qty** pada baris yang bersangkutan untuk mempercepat alur data entry operator.
- **Master Data Sinkron**: Menggunakan data produk dari `productService` (Sprint 3), menjamin keselarasan ID, nama, dan saldo stok terkini.

---

## 4. Initial State: 10 Baris Kosong Sesuai Legacy

Sesuai bukti visual screenshot legacy:

- Form Create diinisialisasi dengan **10 baris kosong**.
- Pengguna dapat langsung mengklik baris pertama tanpa harus menekan tombol "Tambah Baris" terlebih dahulu.
- Tombol toolbar spreadsheet:
  - **Tambah Baris**: Menambahkan 1 baris kosong baru di bagian bawah.
  - **Hapus Baris**: Menghapus baris yang sedang dipilih atau baris terakhir.
  - **Reset Baris**: Mengembalikan tabel ke kondisi 10 baris kosong jika ingin mengulang.

---

## 5. Aturan Validasi Spreadsheet

Sebelum form dapat disimpan ke service:

1. **Pembersihan Baris Kosong (Sanitization)**: Baris yang tidak memiliki `produk_id` dan `qty = 0` akan otomatis disaring dan diabaikan.
2. **Minimal Satu Item**: Minimal harus ada 1 baris produk yang valid terisi.
3. **Kuantitas Positif**: Setiap produk yang dipilih wajib memiliki nilai `qty > 0`.
4. **Pencegahan Duplikasi**: Baris tidak boleh memilih produk yang sama lebih dari satu kali dalam satu nomor SPK. Sistem akan menandai baris duplikat dengan border merah dan pesan peringatan inline.

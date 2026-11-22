# SPRINT 7 — SALES ORDER SPREADSHEET EDITOR

## 1. STRUKTUR & URUTAN KOLOM SPREADSHEET

Mengacu secara ketat pada UX formulir legacy (Screenshot 1), spreadsheet transaksi Sales Order terdiri dari 9 kolom utama:

1. **No**: Nomor urut baris (1, 2, 3, dst).
2. **Nama Produk**: Input teks interaktif terintegrasi modal pencarian produk (`SalesOrderProductPicker.vue`) via klik ganda atau ikon pencarian.
3. **Stok**: Informasi read-only kuantitas stok fisik produk saat ini (dari Master Produk Sprint 3).
4. **Qty**: Input kuantitas pemesanan (harus berupa bilangan positif > 0).
5. **Jenis Stok**: Dropdown pilihan:
   - `Ready Stock` (`status_produksi: 0`)
   - `Produksi` (`status_produksi: 1`)
6. **Harga**: Harga satuan produk (Rp) yang dapat disesuaikan.
7. **Diskon**: Persentase diskon per baris barang (0% - 100%).
8. **Subtotal**: Nilai terhitung otomatis `Qty * Harga * (1 - Diskon/100)`.
9. **Keterangan**: Catatan spesifikasi teknis khusus untuk item bersangkutan.

---

## 2. INTERAKSI & ERGONOMI KEYBOARD

- **Inisialisasi 10 Baris Kosong**: Formulir Create langsung membuka 10 baris siap input seperti pada sistem legacy.
- **Navigasi Panah & Tab**:
  - `Tab`: Berpindah ke kolom berikutnya. Jika berada di kolom terakhir baris terakhir, menekan `Tab` otomatis menambah baris baru.
  - `Shift + Tab`: Berpindah ke kolom sebelumnya.
  - `Arrow Up` / `Arrow Down`: Berpindah antar baris pada kolom yang sama.
- **Shortcut Modal Pencarian Produk**:
  - `Enter`: Konfirmasi memilih produk yang disorot pada modal picker.
  - `Arrow Up` / `Arrow Down`: Menavigasi baris pada daftar produk modal.
  - `Escape`: Menutup modal picker seketika.
- **Operasi Baris**:
  - Tombol `+ Tambah Baris` untuk menyisipkan baris kosong baru.
  - Tombol `- Hapus Baris Terpilih` untuk membersihkan baris terpilih atau baris kosong.

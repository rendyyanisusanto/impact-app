# Sprint 6 — Bill of Materials (BoM) Spreadsheet Editor

## 1. Konsep & UX Desain

Editor Spreadsheet BoM mengadopsi kecepatan dan kenyamanan input data desktop legacy ERP dengan keunggulan tampilan modern Vue 3:

- **Format Grid Grid-like**: Tabel dengan baris bernomor urut (1..N).
- **Double-Click Selector**: Double-click pada sel Kode atau Nama Bahan memunculkan modal pencarian bahan baku (`BomMaterialPicker.vue`).
- **Pintasan Keyboard**:
  - `Enter` pada input kuantitas otomatis melompat ke baris berikutnya.
  - `Tab` / `Shift+Tab` berpindah antar kolom input kuantitas dan catatan.
- **Kalkulasi Subtotal Instan**: Begitu nilai `Qty per Produk` dimasukkan, `Subtotal Biaya = Qty x Harga Satuan` langsung dihitung dan diperbarui tanpa menunggu save.
- **Tambah & Hapus Baris Cepat**: Tombol `Tambah Baris` menambah baris kosong di bawah, sedangkan ikon tempat sampah menghapus baris tertentu.

---

## 2. Struktur Kolom Spreadsheet

| Kolom                 | Tipe Input                   | Deskripsi                                                         |
| --------------------- | ---------------------------- | ----------------------------------------------------------------- |
| **No**                | Read-only                    | Nomor urut baris (1..N)                                           |
| **Kode Bahan**        | Clickable / Double-click     | Kode bahan baku dari Master Data Bahan                            |
| **Nama Bahan Baku**   | Clickable / Double-click     | Nama lengkap bahan baku dan spesifikasi                           |
| **Satuan Pakai**      | Read-only                    | Satuan pemakaian produksi (`satuan_pakai.nama`)                   |
| **Stok Gudang**       | Read-only                    | Saldo stok fisik tersedia saat ini di gudang utama                |
| **Qty per Produk**    | Numeric Input (`step="any"`) | Kuantitas kebutuhan bahan baku per 1 unit produk jadi (harus > 0) |
| **Harga Satuan**      | Read-only Currency           | Estimasi harga beli / standar biaya per satuan pakai              |
| **Subtotal Biaya**    | Read-only Currency           | $Qty \times Harga\ Satuan$                                        |
| **Catatan Pemakaian** | Text Input                   | Instruksi khusus perakitan / pemotongan                           |
| **Aksi**              | Button                       | Hapus baris dari tabel komposisi                                  |

---

## 3. Sticky Bottom Action Bar

Sesuai ketentuan UX enterprise:

- Bar aksi ditempatkan melayang di bagian bawah layar (`fixed bottom-0 left-0 right-0`).
- **Indikator Total Langsung di Samping Tombol Batalkan**:
  - Tombol `Batalkan` (kiri)
  - Di samping kanannya langsung: Card ringkasan total (`Komposisi: X jenis bahan | Est. Biaya Bahan per Unit: Rp ...`)
  - Tombol `Simpan Template BoM` / `Simpan Perubahan` (kanan)
- Menyediakan visibilitas total biaya per unit produk secara instan tanpa perlu scrolling ke atas atau ke bawah.

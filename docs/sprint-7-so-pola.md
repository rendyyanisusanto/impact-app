# SPRINT 7 — FITUR SO POLA (NON-PPN)

## 1. DESKRIPSI FITUR

**SO Pola** adalah modul transaksi penjualan untuk lini bisnis Polaris Furniture, melayani penjualan non-PKP bebas PPN dengan format penomoran dokumen khusus divisi Pola.

---

## 2. KARAKTERISTIK TEKNIS

1. **Rute & Halaman**:
   - `/sales/so-pola`: Daftar transaksi SO Pola.
   - `/sales/so-pola/create`: Formulir penerbitan transaksi baru.
   - `/sales/so-pola/:id`: Rincian transaksi read-only.
   - `/sales/so-pola/:id/edit`: Formulir penyuntingan transaksi.
   - `/sales/so-pola/:id/nota`: Dokumen Nota Penjualan resmi.
   - `/sales/so-pola/:id/print`: Dokumen Cetak Faktur komersial.
2. **Penomoran Otomatis**:
   - Pola: `SO/{year}/PL/{month}/{last_number}`
   - Menggunakan kode pembeda divisi `/PL/`.
   - Bulan diformat dalam angka 2 digit (`01` s/d `12`).
   - Contoh: `SO/26/PL/03/0093`.
3. **Pajak & Faktur Pajak**:
   - `is_ppn = 0`, `ppn_id = null`.
   - PPN selalu bernilai 0 (Non-PPN).
   - Kolom `no_faktur_pajak` disembunyikan baik pada UI form maupun DataTable.
4. **Branding Dokumen**:
   - Kop Surat: **POLARIS FURNITURE**
   - Alamat: Jalan Pogot No. 72, Surabaya - 60129.
   - Telepon: 081334791464.

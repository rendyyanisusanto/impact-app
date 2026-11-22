# SPRINT 7 — FITUR SO KS (NON-PPN)

## 1. DESKRIPSI FITUR

**SO KS** adalah modul transaksi penjualan untuk lini bisnis divisi KS, melayani transaksi pesanan bebas PPN dengan pola penomoran dokumen numerik independen.

---

## 2. KARAKTERISTIK TEKNIS

1. **Rute & Halaman**:
   - `/sales/so-ks`: Daftar transaksi SO KS.
   - `/sales/so-ks/create`: Formulir penerbitan transaksi baru.
   - `/sales/so-ks/:id`: Rincian transaksi read-only.
   - `/sales/so-ks/:id/edit`: Formulir penyuntingan transaksi.
   - `/sales/so-ks/:id/nota`: Dokumen Nota Penjualan resmi.
   - `/sales/so-ks/:id/print`: Dokumen Cetak Faktur komersial.
2. **Penomoran Otomatis**:
   - Pola: `SO/{year}/{month}/{last_number}`
   - Bulan diformat dalam angka 2 digit (`01` s/d `12`).
   - Contoh: `SO/26/01/0065`.
3. **Pajak & Faktur Pajak**:
   - `is_ppn = 0`, `ppn_id = null`.
   - PPN selalu bernilai 0 (Non-PPN).
   - Tanpa nomor faktur pajak DJP.
4. **Branding Dokumen**:
   - Kop Surat: **IMPACT FURNITURE (KS)**
   - Alamat: Jl. Pogot No.72, Surabaya, Jawa Timur 60129.
   - Telepon: 081334791464.

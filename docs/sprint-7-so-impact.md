# SPRINT 7 — FITUR SO IMPACT (PPN)

## 1. DESKRIPSI FITUR

**SO Impact** adalah modul transaksi penjualan utama bagi entitas PT Impact Furniture Surabaya yang beroperasi di bawah rezim Pengusaha Kena Pajak (PKP) resmi dengan pengenaan Pajak Pertambahan Nilai (PPN) aktif.

---

## 2. KARAKTERISTIK TEKNIS

1. **Rute & Halaman**:
   - `/sales/so-impact`: Daftar transaksi SO Impact.
   - `/sales/so-impact/create`: Formulir penerbitan transaksi baru.
   - `/sales/so-impact/:id`: Rincian transaksi read-only.
   - `/sales/so-impact/:id/edit`: Formulir penyuntingan transaksi.
   - `/sales/so-impact/:id/nota`: Dokumen Nota Penjualan resmi.
   - `/sales/so-impact/:id/print`: Dokumen Cetak Faktur komersial.
2. **Penomoran Otomatis**:
   - Pola: `SO/{year}/{romawi_bulan}/{last_number}`
   - Bulan diformat dalam angka Romawi (`I` s/d `XII`).
   - Nomor urut 4 digit dengan _leading zeros_ (`0344`).
3. **Pajak & Faktur Pajak**:
   - `is_ppn = 1`, `ppn_id = 1` (PPN Aktif 11%).
   - Kolom `no_faktur_pajak` aktif untuk pencatatan Nomor Seri Faktur Pajak DJP.
   - Perhitungan: `total_ppn = Math.round((subtotal + biaya_tambahan) * 0.11)`.
4. **Branding Dokumen**:
   - Kop Surat: **IMPACT FURNITURE**
   - Alamat: Jl. Pogot No.72, Tanah Kali Kedinding, Kec. Kenjeran, Surabaya, Jawa Timur 60129.
   - Telepon: 081334791464.

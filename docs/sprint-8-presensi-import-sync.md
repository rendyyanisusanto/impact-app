# Sprint 8 — Presensi Import, Synchronize & Fetch Workflows

## 1. Perbedaan Empat Alur Penarikan & Sinkronisasi

| Aksi | Asal Tab | Cakupan Tanggal | Karakteristik Proses |
|---|---|---|---|
| **Ambil Data Fingerprint** | Tab 1 (Presensi Hari Ini) | Hari ini (`CURRENT_DATE`) | Menarik log mesin terkini untuk hari berjalan, memetakan karyawan, deduplikasi, lalu refresh ringkasan KPI dan tabel. |
| **Ambil Data 3 Hari Kebelakang** | Tab 1 (Presensi Hari Ini) | 3 hari kalender ke belakang + hari ini (misal `2026-10-29` s/d `2026-11-01`) | Mengantisipasi koreksi kehadiran atau penarikan tertunda pada akhir pekan / hari libur. Tidak menimpa (*overwrite*) data yang telah ada melainkan menyisipkan record yang belum tercatat (*idempotent append*). |
| **Sinkronisasi Data (Harian)** | Tab 2 (Laporan Harian) | Tanggal terpilih pada date picker | Menjalankan sinkronisasi presensi harian untuk tanggal spesifik yang dipilih pengguna tanpa mengganggu tanggal lain. |
| **Import Data (Excel)** | Tab 1 (Presensi Hari Ini) | Sesuai isi file Excel | Mengunggah template file `import_presensi_harian.xlsx`, mem-parsing baris, validasi struktur kolom, preview interaktif, deteksi duplikasi, dan konfirmasi simpan. |

## 2. Aturan Deduplikasi
Record presensi disimpan dalam tabel `check_log` dengan kunci gabungan logis:
`(karyawan_id, tanggal, jam)`

Aturan penanganan:
1. Sebelum `INSERT`, sistem memeriksa keberadaan `(karyawan_id, tanggal, jam)`.
2. Jika record sudah ada:
   - Dihitung sebagai `totalSkippedDuplicates`.
   - Tidak dibuat record ganda (*no duplicate rows*).
   - Operasi berstatus sukses parsial tanpa melempar kegagalan sistem.
3. Jika record belum ada:
   - Disimpan ke dalam `check_log`.
   - Dihitung sebagai `totalInserted`.

## 3. Format Template Import Excel Legacy
Template import file mengikuti struktur legacy `import_presensi_harian.xlsx`:
- **Baris 1**: Header Judul (`"Import Data Presensi"`)
- **Baris 2**: Kosong
- **Baris 3**: Header Kolom:
  - Kolom A: `No`
  - Kolom B: `ID` (Nomor PIN / ID Fingerprint Karyawan)
  - Kolom C: `Tanggal + Jam` (Format: `YYYY-MM-DD HH:mm:ss`)
  - Kolom D: Peringatan (*Warning: Mohon tidak mengubah susunan kolom...*)
- **Baris 4 dst**: Data baris transaksi presensi.

## 4. Modal Progres & Penanganan Error
- Setiap aksi sinkronisasi menyajikan modal progres bertahap:
  1. `connecting`: Menghubungkan ke endpoint/adapter.
  2. `fetching`: Mengambil log data.
  3. `processing`: Memvalidasi deduplikasi dan relasi karyawan.
  4. `completed` / `error`: Menampilkan rekapitulasi angka (`totalProcessed`, `totalInserted`, `totalSkippedDuplicates`, `totalFailedMapping`) atau pesan kesalahan jika perangkat tidak merespons.


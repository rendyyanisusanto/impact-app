# Sprint 8 — Presensi Reports & Multi-Tab Views

## 1. Ikhtisar Arsitektur Laporan Presensi
Modul Presensi menyediakan 5 tampilan pelaporan tabular dan 1 tab inspeksi perangkat:
1. **Presensi Hari Ini** (`AttendanceTodayTab.vue`): Pemantauan absensi real-time hari berjalan lengkap dengan KPI ringkasan, aksi penarikan, import data, dan penambahan keterangan.
2. **Laporan Presensi Harian** (`AttendanceDailyReportTab.vue`): Laporan presensi per tanggal terpilih (`date picker`), aksi proses, sinkronisasi harian, dan ekspor.
3. **Laporan Presensi Range Tanggal** (`AttendanceDateRangeTab.vue`): Rekap multi-hari lintas seluruh karyawan dengan opsi pengurutan (*Urut Berdasarkan* `Karyawan` atau `Tanggal`).
4. **Laporan Range Tanggal (Karyawan)** (`AttendanceEmployeeRangeTab.vue`): Riwayat presensi untuk satu karyawan spesifik dalam rentang tanggal tertentu.
5. **Laporan Presensi Per Karyawan** (`AttendanceEmployeeMonthlyTab.vue`): Matriks kalender bulanan lengkap (tanggal 1 sampai jumlah hari kalender bulan tersebut, misal 28/29/30/31 hari) untuk satu karyawan terpilih.
6. **Data Fingerprint** (`AttendanceFingerprintTab.vue`): Inspeksi log mentah dari mesin fingerprint, verifikasi pemetaan karyawan, dan status duplikasi.

## 2. Aturan Pengurutan Grup Karyawan (*Natural Group Sorting*)
Pada sistem legacy, daftar karyawan ditampilkan secara berurutan menurut nomor urut dalam kode grup:
```sql
ORDER BY CAST(REGEXP_SUBSTR(gk.kode, "[0-9]+") AS UNSIGNED) ASC, k.nama ASC
```
Pada implementasi V2 TypeScript, adapter `attendance.service.ts` mengekstrak angka numerik dari kode grup:
```typescript
function extractGroupNumber(code?: string): number {
  if (!code) return 999999
  const match = code.match(/\d+/)
  return match ? parseInt(match[0], 10) : 999999
}
```
Hasil pengurutan grup: `GRP1` -> `GRP2` -> `GRP3` -> ... -> `GRP10` -> `GRP11` -> dst.

## 3. Matriks Kalender Bulanan Karyawan (Tab 5)
- Menghasilkan daftar tanggal mulai dari 1 sampai akhir bulan kalender (`getDaysInMonth(year, month)`).
- Menghitung tahun kabisat (*leap year*) untuk bulan Februari (29 hari pada tahun kabisat).
- Tanggal tanpa log presensi ditampilkan dengan status `ABSENT` pada proyeksi view tanpa membuat record dummy di database `check_log`.
- Menampilkan hari dan tanggal sesuai format lokal Indonesia.

## 4. Fitur Ekspor Excel dan PDF
- Terintegrasi dengan utility shared `exportToExcel` dan `exportToPdf`.
- Header tabel ekspor disesuaikan dengan konteks laporan (Nama Karyawan, Periode Tanggal, Grup).
- Format file ekspor Excel menggunakan nama file standar seperti `Laporan_Presensi_Hari_Ini_YYYY-MM-DD.xlsx` atau `Laporan_Presensi_Karyawan_KODE_MM_YYYY.xlsx`.


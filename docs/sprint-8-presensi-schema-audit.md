# Sprint 8 — Presensi & Fingerprint Schema Audit

## 1. Overview & Audit Methodology
Berdasarkan audit terhadap SQL legacy `u1573701_smm.sql` dan Controller `application/controllers/admin/Presensi.php` pada sistem legacy `smm-polaris`, modul Presensi mengelola pencatatan kehadiran karyawan yang bersumber dari mesin fingerprint eksternal, pemetaan jadwal kerja per hari, serta penanganan hari libur dan keterangan kehadiran manual.

## 2. Skema Tabel Database Legacy

### 2.1 Tabel `check_log` (Log Presensi Karyawan)
Tabel ini menyimpan setiap titik log check-in/check-out yang ditarik dari mesin fingerprint atau diimpor dari file Excel.
- **Nama Tabel**: `check_log`
- **Primary Key**: `id` (INT Auto Increment)
- **Kolom**:
  | Kolom | Tipe Data | Nullable | Default | Deskripsi |
  |---|---|---|---|---|
  | `id` | INT(11) | NO | AUTO_INCREMENT | Identifier unik log |
  | `karyawan_id` | INT(11) | NO | - | Foreign Key ke `karyawan.id` |
  | `tanggal` | DATE | NO | - | Tanggal log presensi (`YYYY-MM-DD`) |
  | `jam` | TIME | NO | - | Waktu log presensi (`HH:mm:ss`) |
- **Aturan Unik & Integritas**:
  - Pasangan `(karyawan_id, tanggal, jam)` bersifat unik secara fungsional. Proses penarikan log (baik hari ini, 3 hari ke belakang, sinkronisasi harian, maupun impor file Excel) melakukan deduplikasi berdasarkan tuple ini. Jika sudah ada record dengan `karyawan_id`, `tanggal`, dan `jam` yang identik, record baru dilewati (*skipped*).

### 2.2 Tabel `check_log_keterangan` (Keterangan Manual Presensi)
Tabel ini menyimpan keterangan khusus/alasan ketidakhadiran/izin/lembur yang diinputkan oleh staf HR.
- **Nama Tabel**: `check_log_keterangan`
- **Primary Key**: `id` (INT Auto Increment)
- **Kolom**:
  | Kolom | Tipe Data | Nullable | Default | Deskripsi |
  |---|---|---|---|---|
  | `id` | INT(11) | NO | AUTO_INCREMENT | Identifier keterangan |
  | `karyawan_id` | INT(11) | NO | - | Foreign Key ke `karyawan.id` |
  | `tanggal` | DATE | NO | - | Tanggal presensi yang diberi keterangan |
  | `keterangan` | TEXT | NO | - | Isi keterangan / alasan |
- **Perilaku Update**:
  - Legacy Controller `Presensi.php` menyediakan endpoint edit keterangan dengan opsi target:
    1. **Perorangan (`KARYAWAN`)**: Memperbarui/membuat record untuk satu `karyawan_id` pada `tanggal` tersebut.
    2. **Per Grup (`GRUP`)**: Memperbarui/membuat record untuk seluruh karyawan aktif dalam `grup_id` tertentu pada `tanggal` tersebut.
    3. **Semua Karyawan (`SEMUA`)**: Memperbarui/membuat record untuk seluruh karyawan aktif perusahaan pada `tanggal` tersebut.

### 2.3 Tabel Relasi Referensi

#### `karyawan`
- `id` (INT PK): Direferensikan oleh `check_log.karyawan_id` dan `check_log_keterangan.karyawan_id`.
- `kode` (VARCHAR): Nomor kode karyawan (misal `"1"`, `"2"`, `"71"`).
- `nama` (VARCHAR): Nama lengkap karyawan.
- `grup_id` (INT FK ke `grup_karyawan.id`): Pengelompokan divisi/tim.
- `fingerprint_id` / `uid` (INT): ID karyawan di mesin fingerprint.

#### `grup_karyawan`
- `id` (INT PK): Identifier grup.
- `kode` (VARCHAR): Kode grup (misal `"GRP1"`, `"GRP2"`).
- `nama` (VARCHAR): Nama grup (misal `"GRP2 - Grup Driver Achmad"`).
- **Aturan Pengurutan Legacy**:
  Diurutkan berdasarkan nomor integer dalam kode grup:
  `ORDER BY CAST(REGEXP_SUBSTR(gk.kode, "[0-9]+") AS UNSIGNED) ASC, k.nama ASC`.

#### `jadwal`
- `id` (INT PK): Identifier aturan jadwal.
- `day_id` (INT): 1 = Minggu, 2 = Senin, 3 = Selasa, 4 = Rabu, 5 = Kamis, 6 = Jumat, 7 = Sabtu (`DAYOFWEEK()`).
- `shift_in_start`, `shift_in_end`, `break_start_start`, `break_start_end`, `break_end_start`, `break_end_end`, `shift_out_start`, `shift_out_end` (TIME): Rentang jendela waktu toleransi status.

#### `hari_libur` & `pengecualian_hari_libur`
- `hari_libur`: Menentukan tanggal libur nasional/perusahaan.
- `pengecualian_hari_libur`: Karyawan yang tetap dijadwalkan hadir meskipun tanggal berstatus libur (misal tim security/driver lembur). Karyawan tanpa pengecualian tidak diikutsertakan dalam laporan presensi harian.

## 3. Pemetaan Tampilan UI vs Field Database

| Kolom Tampilan Legacy | Sumber Field Database | Format Tampilan | Keterangan |
|---|---|---|---|
| **No** | Index loop | `1, 2, 3...` | Nomor urut baris |
| **Tanggal** | `check_log.tanggal` | `DD-MM-YYYY` | Internal `YYYY-MM-DD` |
| **Kode** | `karyawan.kode` | String | Kode identitas karyawan |
| **Nama** | `karyawan.nama` | String | Nama lengkap karyawan |
| **Grup** | `grup_karyawan.nama` | String | Nama grup karyawan |
| **C IN** | Min log pada jendela shift in | `HH:mm:ss` atau `-` | Check In pertama |
| **C OUT** | Max log pada jendela shift out | `HH:mm:ss` atau `-` | Check Out terakhir |
| **B Start** | Log pada jendela break start | `HH:mm:ss` atau `-` | Awal jam istirahat |
| **B End** | Log pada jendela break end | `HH:mm:ss` atau `-` | Selesai istirahat |
| **Status** | Hasil komputasi status | Badge teks (`EI`, `LI`, dll) | Evaluasi berbasis jadwal |
| **Keterangan** | `check_log_keterangan.keterangan` | Text atau `-` | Alasan / catatan manual |
| **Aksi** | - | Tombol "Edit" | Membuka modal tambah keterangan |


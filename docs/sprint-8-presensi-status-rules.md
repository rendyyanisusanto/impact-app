# Sprint 8 — Presensi Status Rules & Calculation Formula

## 1. Overview & Audit Dari Legacy Controller
Audit terhadap method `status()` pada `Presensi.php` mengungkap logika kalkulasi status kehadiran yang dievaluasi per karyawan per hari berdasarkan batas toleransi pada tabel `jadwal` (`shift_in_start`, `shift_out_end`, `break_start_end`, `break_end_start`).

## 2. Definisi Kode Status Legacy

| Kode Status | Label / Nama Lengkap | Definisi Fungsional | Evaluasi / Syarat Kemunculan | Warna Badge Legacy |
|---|---|---|---|---|
| **`EI`** | Early In | Masuk sebelum atau tepat pada batas awal toleransi masuk | `actual_in <= shift_in_start` | `bg-blue-600` / Primary |
| **`LI`** | Late In | Masuk terlambat melebihi batas awal toleransi masuk | `actual_in > shift_in_start` | `bg-red-600` / Danger |
| **`LO`** | Late Out | Pulang tepat waktu atau lembur setelah jam pulang | `actual_out >= shift_out_end` | `bg-blue-600` / Primary |
| **`EO`** | Early Out | Pulang lebih cepat sebelum jam pulang yang ditentukan | `actual_out < shift_out_end` | `bg-red-600` / Danger |
| **`EBO`** | Early Break Out | Istirahat lebih awal dari jadwal yang ditentukan | `break_start < break_start_end` (misal < 12:00) | `bg-red-600` / Danger |
| **`NBO`** | No Break Out | Tidak melakukan tap istirahat keluar, namun hadir | `break_start == null && (cin != null \|\| cout != null)` | `bg-red-600` / Danger |
| **`NBI`** | No Break In | Tidak melakukan tap kembali dari istirahat, namun hadir | `break_end == null && (cin != null \|\| cout != null)` | `bg-red-600` / Danger |
| **`LBI`** | Late Break In | Kembali dari istirahat terlambat melebihi batas | `break_end > break_end_start` | `bg-red-600` / Danger |
| **`NSO`** | No Shift Out | Tidak melakukan tap pulang saat shift berakhir | `cout == null && (cin != null \|\| break != null)` | `bg-red-600` / Danger |
| **`NSI`** | No Shift In | Tidak melakukan tap masuk saat shift dimulai | `cin == null && (cout != null \|\| break != null)` | `bg-red-600` / Danger |
| **`ABSENT`** | Absent (Tidak Hadir) | Tidak ada rekaman log sama sekali sepanjang hari | `cin == null && cout == null && break_start == null && break_end == null` | `bg-red-600` / Danger |

## 3. Kombinasi Status yang Valid
Pada satu baris presensi karyawan, status ditampilkan sebagai kumpulan badge. Contoh kombinasi nyata dari legacy screenshot:
1. **Normal Penuh**: `[EI, LO]` (Masuk tepat waktu, pulang setelah jam selesai kerja).
2. **Terlambat Masuk**: `[LI, LO]` (Masuk terlambat, pulang sesuai jam).
3. **Istirahat Awal & Pulang Cepat**: `[EI, EBO, EO]` (Masuk tepat waktu, istirahat mendahului jam, pulang lebih awal).
4. **Terlambat Masuk & Tanpa Tap Istirahat**: `[LI, NBO, NBI, LO]`.
5. **Hadir Tanpa Tap Pulang**: `[EI, NSO]`.
6. **Sama Sekali Tidak Ada Tap**: `[ABSENT]`.

## 4. Evaluasi Khusus Hari Kerja vs Hari Libur
- **Jadwal Harian**: Status dinilai terhadap jadwal hari yang bersangkutan (`day_id = DAYOFWEEK(tanggal)`).
- **Paritas Legacy Screenshot (Jumat vs Minggu)**:
  Pada screenshot legacy, penarikan data 3 hari ke belakang pada hari Minggu mengevaluasi status terhadap jadwal hari tersebut. Window `break_start_end` sebesar `12:00:00` digunakan sehingga karyawan yang keluar istirahat pada pukul `11:30:23`–`11:32:40` secara tepat mendapatkan badge peringatan `EBO`.
- **Hari Libur**: Jika tanggal tercatat di `hari_libur`, hanya karyawan yang terdaftar di `pengecualian_hari_libur` yang dievaluasi. Karyawan reguler yang tidak bertugas tidak dianggap `ABSENT` karena hari tersebut merupakan hari libur resmi.


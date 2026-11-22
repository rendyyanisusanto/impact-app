# Sprint 8 — Task 11–18 Final Report: HR Presensi & Fingerprint Management

## 1. Executive Summary
Seluruh pekerjaan **Sprint 8: Tasks 11–18 (HR Presensi & Fingerprint Management)** untuk sistem Impact Furniture V2 telah berhasil diselesaikan dengan 100% kepatuhan terhadap sistem legacy `smm-polaris` dan screenshot operasional.

Semua implementasi mematuhi arsitektur Vue 3 Composition API, TypeScript strict mode, Tailwind CSS, Pinia, dan Vitest tanpa menggunakan framework UI pihak ketiga (PrimeVue/Vuetify/Quasar/Element Plus) dan tanpa modifikasi terhadap service modul HR yang telah ada.

## 2. Rincian Penyelesaian Tugas (Tasks 11–18)

### Task 11 — Foundation, Schema Audit & Presensi Domain
- Mengaudit database legacy `check_log`, `check_log_keterangan`, `karyawan`, `grup_karyawan`, `jadwal`, `hari_libur`, dan `pengecualian_hari_libur`.
- Mendefinisikan 10 kode status legacy: `EI`, `LI`, `LO`, `EO`, `EBO`, `NBO`, `NBI`, `LBI`, `NSO`, `NSI`, dan `ABSENT`.
- Membuat typed models: `attendance.types.ts` dengan pemisahan antara raw fingerprint record, stored record, ViewModel, filter DTO, dan import preview.
- Membangun utilitas tanggal internal `YYYY-MM-DD` dan format tampilan Indonesia `DD-MM-YYYY`.
- Membangun mock repository `attendance.service.ts` dan adapter perangkat `fingerprint-source.service.ts`.

### Task 12 — Presensi Hari Ini (Tab 1)
- Tampilan tanggal hari ini, 4 kartu ringkasan KPI (Total, Hadir, Belum Hadir, Terlambat).
- Tabel 12 kolom sesuai screenshot legacy dengan badge status berwarna (Primary blue untuk `EI`/`LO`, Danger red untuk lainnya).
- Aksi "Ambil data fingerprint" dan "Ambil data 3 Hari Kebelakang" dengan modal progres riil bertahap.
- Modal "Import data" berbasis template `import_presensi_harian.xlsx` dengan validasi struktur dan deteksi duplikasi.
- Modal tambah/edit keterangan dengan pilihan target: Karyawan, Grup, atau Semua Karyawan.

### Task 13 — Laporan Presensi Harian (Tab 2)
- Pemilihan tanggal dengan date picker dan tombol "Proses".
- Aksi "Sinkronisasi Data" spesifik untuk tanggal terpilih.
- Ekspor laporan harian ke Excel dan PDF.

### Task 14 — Laporan Presensi Range Tanggal (Tab 3)
- Pemilihan rentang tanggal mulai dan selesai beserta selector "Urut Berdasarkan" (`Karyawan` atau `Tanggal`).
- Pengurutan grup alami (*natural group order*) `CAST(REGEXP_SUBSTR(gk.kode, "[0-9]+") AS UNSIGNED)`.
- Ekspor multi-hari ke Excel dan PDF.

### Task 15 — Laporan Range Tanggal (Karyawan) (Tab 4)
- Integrasi searchable employee selector dari master karyawan.
- Filter rentang tanggal untuk riwayat presensi individu karyawan.
- Ekspor riwayat individu ke Excel dan PDF.

### Task 16 — Laporan Presensi Per Karyawan (Tab 5)
- Pemilihan karyawan, bulan (1–12), dan tahun.
- Matriks kalender bulanan lengkap (tanggal 1 s/d hari terakhir bulan, memperhitungkan tahun kabisat).
- Penandaan otomatis hari libur dan status presensi proyeksi tanpa modifikasi destruktif pada database.
- Ekspor kalender bulanan ke Excel dan PDF.

### Task 17 — Data Fingerprint (Tab 6)
- Inspeksi log mentah mesin fingerprint per tanggal terpilih.
- Statistik validitas log, deteksi duplikasi, dan penanganan ID yang belum dipetakan (*unmapped*).
- Tombol sinkronisasi manual ke sistem.

### Task 18 — Hardening, Integration & Verification
- Pendaftaran route `hr/attendance` dengan perlindungan RBAC `hr:read`.
- Pembatasan tombol aksi (sinkronisasi, penarikan, import) untuk `hr:create` dan edit keterangan untuk `hr:update`.
- Pengujian otomatis: 4 suite baru dengan 40 skenario pengujian unit & integration yang seluruhnya lulus (**100% Passed**).
- Verifikasi regresi menyeluruh: **116 test files** dan **722 unit tests** lulus (**0 failure**).
- Verifikasi build produksi (`npm run build`): Lulus sempurna tanpa error (0 error).
- Pembuatan 8 dokumen panduan teknis di folder `app/docs/`.

## 3. Matriks Kepatuhan Definition of Done (DoD)

| Kriteria DoD | Status | Bukti / Catatan |
|---|---|---|
| 100% Kompatibilitas Semantik Data Legacy | **TERPENUHI** | Seluruh nama kolom, kode status, formula toleransi, dan urutan grup identik dengan legacy CI3. |
| Tidak Ada Modifikasi Destruktif | **TERPENUHI** | Tidak ada modifikasi pada master employee, jadwal, grup, atau libur yang sudah ada. |
| Zero External UI Framework | **TERPENUHI** | Hanya menggunakan Tailwind CSS dan komponen shared internal. |
| Tipe Data Strict TypeScript | **TERPENUHI** | `vue-tsc --noEmit` lolos tanpa kompromi `any` liar. |
| Lolos Uji Vitest Otomatis | **TERPENUHI** | 722/722 tests passed (40 presensi tests). |
| Lolos Build Produksi | **TERPENUHI** | Vite production bundle berhasil dibangun dalam 14.48s. |
| Dokumentasi Lengkap | **TERPENUHI** | 8 dokumen markdown dibuat di `app/docs/`. |


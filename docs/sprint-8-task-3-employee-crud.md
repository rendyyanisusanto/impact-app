# Sprint 8 Task 3 — Master Data Karyawan CRUD & Detail

## 1. Overview

Sprint 8 Task 3 implements the full lifecycle management for employees: creation, modification, detailed view, status toggling, and deletion.

All forms are full-page layouts (not modals) to accommodate enterprise information architecture while avoiding clutter and horizontal modal overflow.

---

## 2. Route Architecture

| Path                     | Component                | RBAC Permission       | Purpose                             |
| :----------------------- | :----------------------- | :-------------------- | :---------------------------------- |
| `/hr/employees/create`   | `EmployeeCreatePage.vue` | `hr.employees.create` | Add new employee                    |
| `/hr/employees/:id`      | `EmployeeDetailPage.vue` | `hr.employees.read`   | View comprehensive employee profile |
| `/hr/employees/:id/edit` | `EmployeeEditPage.vue`   | `hr.employees.update` | Edit existing employee details      |

---

## 3. Form Architecture & Grouping (`EmployeeForm.vue`)

The form utilizes a structured two-column layout organized into 4 logical cards matching the legacy MariaDB schema:

### Card A: Identitas Karyawan

- **Kode Karyawan** (`kode`): Required, unique, uppercase monospace font. Auto-suggestions available or manual entry.
- **NIK Internal** (`nik`): Optional internal employee identification number.
- **Nama Lengkap** (`nama`): Required, full legal employee name.
- **Jenis Kelamin** (`jk`): Radio button or dropdown (`L` = Laki-laki, `P` = Perempuan).

### Card B: Informasi Pekerjaan & Penempatan

- **Jabatan** (`jabatan_id`): Required relational dropdown loaded asynchronously from `masterJabatanService`.
- **Status Kepegawaian** (`status_karyawan_id`): Required relational dropdown loaded from `masterStatusKaryawanService` (e.g. Tetap, Kontrak, Harian Lepas).
- **Grup Karyawan** (`grup_karyawan_id`): Optional relational dropdown loaded from `employeeGroupService`.
- **Tanggal Masuk** (`tanggal_masuk`): Optional datepicker (`YYYY-MM-DD`).

### Card C: Kontak & Domisili

- **Nomor Telepon / WhatsApp** (`no_hp`): Optional contact number with format validation.
- **Alamat Email** (`email`): Optional RFC-compliant email string.
- **Provinsi** (`province_id`): Optional dropdown loaded from region lookup service.
- **Kota / Kabupaten** (`city_id`): Optional dependent dropdown cascading from selected province.
- **Alamat Lengkap** (`alamat`): Optional multiline textarea for street address.

### Card D: Pengaturan Sistem & Presensi

- **UID Fingerprint** (`uid_fingerprint`): Optional numeric machine identifier for biometric integration.
- **Status Keaktifan** (`status`): Switch toggle (`1` = Aktif, `0` = Nonaktif).

---

## 4. Referential Lookups & Caching

The form dynamically resolves all foreign relations:

1. `MasterJabatan`: Injected from Sprint 3 master data service.
2. `MasterStatusKaryawan`: Injected from Sprint 3 master data service.
3. `EmployeeGroup`: Injected from Sprint 8 group service.
4. `WilayahService`: Injected for Indonesia administrative regions (provinsi and kota/kabupaten).

If an external master record is inactive or missing, the form handles the fallback gracefully without throwing runtime exceptions.

---

## 5. Boundary Validation & Error Handling

Validation rules are enforced client-side via `validateEmployee` (`employee-validation.ts`):

- `kode`: Trimmed, required, min 2 chars, max 50 chars, uniqueness check against database.
- `nama`: Trimmed, required, min 2 chars, max 150 chars.
- `jabatan_id`: Positive integer, must match an existing Jabatan record.
- `status_karyawan_id`: Positive integer, must match an existing Status Karyawan record.
- `email`: If provided, must match valid email regex.
- `no_hp`: If provided, must match phone number regex.

Errors are mapped directly to reactive form field states (`errors.kode`, `errors.nama`, etc.) displaying contextual error alerts below corresponding input elements.

---

## 6. Unsaved Changes Guard

To prevent accidental navigation loss during long form filling:

- Compares initial form snapshot with current reactive form state.
- If form is dirty and user triggers navigation (browser back button or route link), an enterprise `AppConfirmDialog` warns:
  _"Perubahan Belum Disimpan. Apakah Anda yakin ingin meninggalkan halaman ini? Perubahan yang belum disimpan akan hilang."_
- If user confirms, navigation proceeds; otherwise navigation is cancelled.

---

## 7. Employee Detail Page (`EmployeeDetailPage.vue`)

The detail page presents a clean, executive summary layout:

- **Header Section**: Avatar placeholder with initials, employee name, employee code badge, active status pill, and action buttons (**Ubah**, **Aktifkan/Nonaktifkan**, **Kembali**).
- **Summary Cards**:
  - Profile & Identitas: NIK, Gender, UID Fingerprint.
  - Penempatan Kerja: Jabatan, Status Kepegawaian, Grup Karyawan (with group color badge), Tanggal Masuk, Lama Bekerja.
  - Kontak & Alamat: No. Handphone, Email, Alamat Lengkap, Kota, Provinsi.
  - Audit Trail: Created By, Created At, Updated By, Updated At.

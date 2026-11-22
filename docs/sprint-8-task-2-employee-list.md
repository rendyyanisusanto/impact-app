# Sprint 8 Task 2 — Master Data Karyawan List & DataTable

## 1. Overview

Sprint 8 Task 2 delivers the enterprise data table, filtering system, export utilities, and Excel import pipeline for Master Data Karyawan in IMPACT FURNITURE V2 (`/hr/employees`).

All implementation conforms to:

- Design System: Primary `#0F766E`, Navbar `#34454F`, Background `#F5F7FA`, Surface `#FFFFFF`, Border `#D9E0E7`.
- Verified Schema: Derived directly from legacy MariaDB `karyawan` table in `u1573701_smm(2).sql`.
- Zero faked columns or sensitive payroll/national citizen data.

---

## 2. Page Architecture & Navigation

- **Route**: `/hr/employees`
- **Component**: `app/src/modules/hr/pages/EmployeeListPage.vue`
- **RBAC Guard**: `hr.employees.read`
- **Page Header**:
  - Title: **Master Data Karyawan**
  - Subtitle: _Kelola data induk karyawan, informasi jabatan, divisi, dan status kepegawaian._
  - Primary Action Button: **Tambah Karyawan** (requires `hr.employees.create`)
- **Toolbar Actions**:
  - Search Input (Debounced 300ms, searches `nama` and `kode`)
  - Filter Toggle (`EmployeeFilters.vue`)
  - Export PDF (`exportToPdf`)
  - Export Excel (`exportToExcel`)
  - Import Excel (opens `EmployeeImportModal.vue`)
  - Refresh Data (reloads repository with skeleton loading)

---

## 3. DataTable Columns Specification

The columns are strictly mapped from verified SQL fields:

| Column Header          | Field / Path         | Legacy Column                 | Formatter / Component                                     |
| :--------------------- | :------------------- | :---------------------------- | :-------------------------------------------------------- |
| **No**                 | Index                | -                             | 1-based sequential row index                              |
| **Kode Karyawan**      | `kode`               | `karyawan.kode`               | Bold badge with monospace font                            |
| **NIK Internal**       | `nik`                | `karyawan.nik`                | Internal employee code (fallback `-`)                     |
| **Nama Karyawan**      | `nama`               | `karyawan.nama`               | Primary title with gender icon / indicator                |
| **Jabatan**            | `jabatan_id`         | `karyawan.jabatan_id`         | Name resolved via `masterJabatanService`                  |
| **Grup Karyawan**      | `grup_karyawan_id`   | `karyawan.grup_karyawan_id`   | Colored badge via `employeeGroupService`                  |
| **Status Kepegawaian** | `status_karyawan_id` | `karyawan.status_karyawan_id` | Resolved via `masterStatusKaryawanService`                |
| **Kontak**             | `no_hp` / `email`    | `karyawan.no_hp`, `email`     | Clickable phone / email links                             |
| **Status Aktif**       | `status`             | `karyawan.status`             | `EmployeeStatusBadge.vue` (`1` = Aktif, `0` = Nonaktif)   |
| **Aksi**               | -                    | -                             | Dropdown: Lihat Detail, Ubah, Nonaktifkan/Aktifkan, Hapus |

---

## 4. Search & Multi-Criteria Filtering

The filter system in `EmployeeFilters.vue` provides real-time reactive filtering handled entirely through `employeeService.list()`:

1. **Global Search**: Substring match against `nama` or `kode` (case-insensitive).
2. **Jabatan Filter**: Filter by relational foreign key `jabatan_id`.
3. **Status Kepegawaian Filter**: Filter by relational foreign key `status_karyawan_id` (e.g. Tetap, Kontrak, Magang).
4. **Grup Karyawan Filter**: Filter by `grup_karyawan_id` (including "Semua", individual groups, or unassigned).
5. **Status Aktif Filter**: Filter by `status` (Semua, Aktif = 1, Nonaktif = 0).
6. **Reset Filters**: One-click action to reset all criteria back to default state.

---

## 5. Skeleton Loading & UX States

- **Loading State**: Uses `AppDataTable` native skeleton rows when fetching data or applying new filter criteria. Stale data is never displayed as the result of a new filter.
- **Empty State**: Renders informative illustration with contextual advice:
  - If search/filter active: _"Tidak ada data karyawan yang cocok dengan kriteria filter."_ with a **Reset Filter** button.
  - If database empty: _"Belum ada data karyawan terdaftar."_ with a **Tambah Karyawan** action.
- **Error State**: Displays retry banner with toast notification.

---

## 6. Row Actions & Security Matrix

| Action                     | Required Permission   | Confirmation Required | Action Details                                                    |
| :------------------------- | :-------------------- | :-------------------- | :---------------------------------------------------------------- |
| **Lihat Detail**           | `hr.employees.read`   | No                    | Navigates to `/hr/employees/:id`                                  |
| **Ubah**                   | `hr.employees.update` | No                    | Navigates to `/hr/employees/:id/edit`                             |
| **Aktifkan / Nonaktifkan** | `hr.employees.update` | Yes                   | Toggles `status` (`1` $\leftrightarrow$ `0`) via `toggleStatus()` |
| **Hapus**                  | `hr.employees.delete` | Yes (`ConfirmDialog`) | Performs safe delete via `delete()` with referential check        |

---

## 7. Export Utilities (PDF & Excel)

- **Filtered Export**: Both export routines export the exact currently filtered, searched, and sorted dataset.
- **Excel Export**:
  - Utility: `exportToExcel` from shared excel utility.
  - Columns: Kode, NIK, Nama, Jenis Kelamin, Jabatan, Status Karyawan, Grup, Kontak, Alamat, Status Aktif.
  - Filename format: `Data_Karyawan_YYYYMMDD_HHmmss.xlsx`.
- **PDF Export**:
  - Generates print-ready table document with company letterhead, generated date, and metadata.
  - Filename format: `Data_Karyawan_YYYYMMDD_HHmmss.pdf`.

---

## 8. Excel Import Pipeline

The import feature (`EmployeeImportModal.vue`) follows enterprise ETL verification:

```
[Download Template] --> [Upload .xlsx / .csv] --> [Client-side Parsing]
                                                          |
                                                          v
[Import Success & Refresh] <-- [Batch Insertion] <-- [Validation & Preview Grid]
```

1. **Download Template**: Generates sample Excel sheet with column schema and notes on reference IDs / names.
2. **File Parsing**: Validates MIME type and reads rows using `xlsx`.
3. **Data Mapping & Reference Resolution**:
   - Matches Jabatan name to `jabatan_id`.
   - Matches Status Karyawan name to `status_karyawan_id`.
   - Matches Grup Karyawan name to `grup_karyawan_id`.
4. **Row-by-Row Validation**:
   - Mandatory check: `kode`, `nama`, `jabatan_id`, `status_karyawan_id`.
   - Duplicate detection: Checks `kode` against existing records and other rows in the file.
   - Format checks: `email`, `no_hp`.
5. **Preview Modal**:
   - Summary badges: Total Baris, Valid, Error.
   - Interactive table highlighting errors per cell with tooltip descriptions.
6. **Progress Tracking**:
   - Shows real processed count (e.g. `25 / 100 baris`) without artificial setTimeout tricks.
7. **Post-Import Refresh**:
   - Automatically reloads the datatable with skeleton spinner and notifies the user with summary toast.

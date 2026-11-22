# Sprint 8 Task 4 — Master Data Grup Karyawan List & CRUD

## 1. Overview

Sprint 8 Task 4 implements Master Data Grup Karyawan (`/hr/employee-groups`), allowing the organization to categorize employees into functional workgroups (e.g. Produksi, QC, Finishing, Gudang, Logistik, Kantor).

---

## 2. Verified Legacy Database Schema

Derived directly from `u1573701_smm(2).sql`:

```sql
CREATE TABLE `grup_karyawan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `color` varchar(30) DEFAULT '#0F766E',
  `status_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. Route Architecture

| Path                           | Component                     | RBAC Permission    | Purpose                           |
| :----------------------------- | :---------------------------- | :----------------- | :-------------------------------- |
| `/hr/employee-groups`          | `EmployeeGroupListPage.vue`   | `hr.groups.read`   | Group data table, search, filters |
| `/hr/employee-groups/create`   | `EmployeeGroupCreatePage.vue` | `hr.groups.create` | Dedicated create group page       |
| `/hr/employee-groups/:id`      | `EmployeeGroupDetailPage.vue` | `hr.groups.read`   | Group details & stats             |
| `/hr/employee-groups/:id/edit` | `EmployeeGroupEditPage.vue`   | `hr.groups.update` | Dedicated edit group page         |

_Note_: Quick modal create/edit (`EmployeeGroupFormModal.vue`) is also provided directly from the datatable list view for maximum administrative speed.

---

## 4. Group List & DataTable Columns

The datatable renders all verified group attributes along with dynamic aggregations:

| Column             | Field          | Details                                                             |
| :----------------- | :------------- | :------------------------------------------------------------------ |
| **No**             | Index          | 1-based sequential row index                                        |
| **Kode Grup**      | `kode`         | Monospace uppercase tag                                             |
| **Nama Grup**      | `nama`         | Group name with colored swatch indicator (`color`)                  |
| **Warna Label**    | `color`        | Hex preview with color pill badge                                   |
| **Jumlah Anggota** | `member_count` | Dynamically calculated from active employees assigned to this group |
| **Status Aktif**   | `status_aktif` | Status badge (`1` = Aktif, `0` = Nonaktif)                          |
| **Aksi**           | Actions        | Dropdown: Kelola Anggota, Detail, Ubah, Hapus                       |

---

## 5. Group Form & Color Picker

The form fields include:

1. **Kode Grup** (`kode`): Required, unique, max 50 chars.
2. **Nama Grup** (`nama`): Required, max 150 chars.
3. **Warna Label** (`color`): Hex color string. Comes with preset corporate swatches (`#0F766E`, `#2563EB`, `#D97706`, `#DC2626`, `#7C3AED`, `#059669`, `#475569`) plus an HTML5 color picker.
4. **Status Aktif** (`status_aktif`): Boolean toggle.

Validation (`validateEmployeeGroup`) verifies:

- Non-empty `kode` and `nama`.
- Valid Hex color format (`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`).
- Uniqueness of `kode` across existing groups.

---

## 6. Delete Safety & Referential Integrity

Deleting a group that has active members could orphan employee groupings or corrupt downstream work schedule assignments.

**Strict Protection Rule**:

```typescript
if (group.member_count > 0) {
  throw new Error(
    `Tidak dapat menghapus grup "${group.nama}" karena masih memiliki ${group.member_count} anggota aktif. Silakan kosongkan atau pindahkan anggota terlebih dahulu.`
  )
}
```

- When `member_count > 0`, the Delete button triggers an alert dialog blocking deletion and advising deactivation instead.
- Only groups with `member_count === 0` can be safely deleted with user confirmation.

# Sprint 8 Task 5 — Master Data Grup Karyawan Anggota & Relasi Karyawan

## 1. Overview

Sprint 8 Task 5 implements the membership relationship between employees and groups. It provides group member inspection, multi-select employee assignment (bulk addition), and member removal.

---

## 2. Legacy Relationship Architecture: Direct Foreign Key

An essential finding from the legacy MariaDB schema audit:

- There is **NO separate pivot table** (such as `grup_karyawan_detail` or `karyawan_grup_pivot`).
- The relationship is modeled as a direct Foreign Key:
  `karyawan.grup_karyawan_id` $\rightarrow$ `grup_karyawan.id`.
- Cardinality: **Many-to-One** (an employee can belong to at most one group at any time, or `null`/`0` for unassigned).

### Membership Operations:

1. **Assign Member**:
   ```typescript
   karyawan.grup_karyawan_id = groupId
   ```
2. **Remove Member**:
   ```typescript
   karyawan.grup_karyawan_id = null // Unlink only; NEVER delete employee record
   ```
3. **Count Members**:
   ```typescript
   employees.filter(e => e.grup_karyawan_id === groupId && e.status === 1).length
   ```

---

## 3. Dedicated Member Management Page

- **Route**: `/hr/employee-groups/:id/members`
- **Component**: `app/src/modules/hr/pages/EmployeeGroupMembersPage.vue`
- **Page Layout**:
  - Breadcrumb: `HR` > `Master Data Grup Karyawan` > `[Group Name]` > `Kelola Anggota`
  - Group Header Card: Displays Group Name, Code, Color Swatch, Total Members, and Group Status.
  - Action Toolbar:
    - Search input (filter members in table by name/code).
    - **Tambah Anggota** button (opens picker modal).
    - Export Member List (PDF & Excel).

---

## 4. Member Picker Modal (`EmployeeGroupMemberPickerModal.vue`)

The picker modal enables flexible single or bulk addition of employees to the current group:

1. **Non-Member Candidate Filter**:
   - Fetches all active employees who are currently **not** members of this group (`employeeService.getNonMembersByGroupId(groupId)`).
   - Allows filtering candidates by:
     - Free search (nama / kode).
     - Filter Jabatan.
     - Filter Assignment Status: "Belum Punya Grup" vs "Pindah dari Grup Lain".
2. **Multi-Selection Grid**:
   - Checkbox per employee row with "Select All" capability in table header.
   - Selected employee count chip.
3. **Reassignment Notice**:
   - If an employee is already assigned to another group (e.g. _Grup Finishing_), an informative warning badge is shown (_"Akan dipindahkan dari Grup Finishing"_).
4. **Execution**:
   - On confirmation, executes `employeeService.bulkAssignGroup(selectedIds, groupId)`.
   - Displays real-time progress.
   - Refreshes membership table and updates group member count badge.

---

## 5. Member Removal Workflow & Safety

When an administrator clicks **Keluarkan dari Grup** in `EmployeeGroupMembersTable.vue`:

1. **Confirmation Prompt**:
   - Dialog confirms: _"Apakah Anda yakin ingin mengeluarkan [Nama Karyawan] dari grup ini?"_
   - Explains that the employee record itself will remain intact in Master Data Karyawan.
2. **Execution**:
   - Calls `employeeService.removeMemberFromGroup(employeeId)`.
   - Sets `karyawan.grup_karyawan_id = null`.
   - Emits change event to trigger reactive refresh of parent group stats.

---

## 6. Real-Time Synchronization

Whenever group memberships are altered:

- The dynamic `member_count` on `EmployeeGroupListPage.vue` reflects the updated count immediately.
- The `grup_karyawan_id` and group badge on `EmployeeListPage.vue` reflects the change immediately.
- Cached lookups invalidate automatically upon modification.

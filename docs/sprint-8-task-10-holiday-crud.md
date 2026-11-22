# SPRINT 8 — TASK 10: HOLIDAY CRUD & FORM VALIDATION

## 1. Overview

Holiday CRUD allows HR staff to register national holidays, special company holidays, and Sunday operations, linking specific employees who are exempted and required to work.

---

## 2. Validation Rules (`validateHolidayForm`)

Form validation enforces business integrity before persistence:

1. **Tanggal (Holiday Date)**:
   - Mandatory (`wajib diisi`).
   - Format must strictly match `YYYY-MM-DD`.
   - Duplicate prevention: rejects holidays registered with identical date and description (case-insensitive, trimmed).
   - Edit exemption: When updating an existing holiday, self-collision is ignored.
2. **Keterangan (Description)**:
   - Mandatory (`wajib diisi`).
   - Minimum length: 2 characters.
   - Maximum length: 255 characters (aligning with `varchar(255)` in MariaDB).
3. **Pengecualian Karyawan (Exceptions)**:
   - Must be an array of numeric employee IDs.
   - Deduplicated automatically before persistence.

---

## 3. Persistence Workflows (`HolidaySettingsService`)

### 3.1 Create (`createHoliday`)

1. Validates `CreateHolidayDto`.
2. Generates auto-increment ID (`nextHolidayId++`).
3. Inserts into in-memory `hari_libur` table.
4. Generates unique pivot records in `pengecualian_hari_libur` for each employee ID.
5. Returns enriched `HolidayItem` with resolved employee details.

### 3.2 Update (`updateHoliday`)

1. Verifies existing record exists by ID.
2. Validates merged update DTO.
3. Updates `tanggal` and `keterangan` in `hari_libur`.
4. Synchronizes exceptions:
   - Deletes old rows from `pengecualian_hari_libur` where `hari_libur_id === id`.
   - Inserts new rows for updated `exceptionEmployeeIds`.
5. Returns updated enriched `HolidayItem`.

### 3.3 Delete (`deleteHoliday`)

1. Locates holiday index by ID.
2. Removes record from `hari_libur`.
3. Cascades deletion to `pengecualian_hari_libur` pivot entries.
4. Leaves master employee records completely untouched.
5. Emits confirmation feedback to UI.

---

## 4. UI Modals

- **`HolidayFormModal.vue`**:
  - Modal with form inputs for Date (with Indonesian day preview), Description, and `HolidayEmployeePicker`.
  - Handles both `'create'` and `'edit'` mode.
  - Inline error banners and validation messages.
- **`AppConfirmDialog`**:
  - Standard destructive confirmation before deleting a holiday.

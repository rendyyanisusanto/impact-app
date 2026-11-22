# SPRINT 8 — TASK 10: HR INTEGRATION, DOWNSTREAM CONTRACT & RBAC

## 1. Overview

Holiday Settings forms a critical dependency between weekly schedule configuration (Sprint 8 Tasks 6–8) and upcoming daily attendance calculations (Sprint 8 Tasks 11–14 / Presensi).

---

## 2. Downstream Presensi Contract (`IPresensiHolidayResolver`)

Defined in `app/src/modules/hr/types/holiday-settings.types.ts`:

```ts
export interface IPresensiHolidayResolver {
  getHolidaysByMonth(yearMonth: string): Promise<HolidayItem[]>
  getHolidayByDate(date: string): Promise<HolidayItem | undefined>
  isHoliday(date: string): Promise<boolean>
  isEmployeeExempted(employeeId: number, date: string): Promise<boolean>
}
```

### Attendance Logic Integration:

When calculating whether an employee is expected to attend work on a given calendar date:

1. System queries `scheduleService` to check regular working hours for that weekday.
2. If the day is configured as an off day in the weekly schedule, default status is `Libur Jadwal`.
3. If the day is a regular work day, system calls `holidaySettingsService.isHoliday(date)`:
   - If `false`, normal attendance rules apply.
   - If `true`, system calls `holidaySettingsService.isEmployeeExempted(employeeId, date)`:
     - If `isEmployeeExempted === true`: Employee **must work** according to schedule (overtime / special holiday duty).
     - If `isEmployeeExempted === false`: Employee is granted holiday leave (`Libur Nasional`).

---

## 3. RBAC Permissions Matrix

Mapped in `app/src/mocks/users.mock.ts`:

| Role / Permission                                    | `canRead` | `canCreate` | `canUpdate` | `canDelete` |
| ---------------------------------------------------- | :-------: | :---------: | :---------: | :---------: |
| `admin` (Wildcard `*`)                               |    ✅     |     ✅      |     ✅      |     ✅      |
| `staff.hr` (`hr.holidays:create,read,update,delete`) |    ✅     |     ✅      |     ✅      |     ✅      |
| `auditor` (`hr.holidays:read`)                       |    ✅     |     ❌      |     ❌      |     ❌      |
| Non-HR Staff                                         |    ❌     |     ❌      |     ❌      |     ❌      |

### UI Adaptations:

- When user lacks update and create permissions:
  - Blue banner alert displayed: `"Mode Hanya Baca: Anda memiliki izin untuk melihat data hari libur, tetapi tidak memiliki izin untuk menambah, mengubah, atau menghapus pengaturan."`
  - "Tambah Hari Libur" button is hidden.
  - "Ubah" and "Hapus" row action buttons in `HolidayListTable` are hidden.
  - Calendar quick-add hover trigger is disabled.

---

## 4. Export Capabilities

Operators can export monthly holiday reports in two formats:

1. **Excel (.xlsx)**:
   - File naming: `Setting_Hari_Libur_YYYY-MM.xlsx`.
   - Columns: No, Tanggal (DD/MM/YYYY), Hari, Keterangan, Pengecualian Karyawan.
2. **PDF (.pdf)**:
   - File naming: `Setting_Hari_Libur_YYYY-MM.pdf`.
   - Formatted tabular document with company header and landscape orientation.

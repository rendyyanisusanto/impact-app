# Sprint 8 Task 8 — HR System Integration, RBAC & Presensi Readiness

## 1. Overview

Sprint 8 Task 8 ensures seamless coexistence with Master Data Karyawan and Master Data Grup Karyawan, establishes strict Role-Based Access Control (RBAC), and provides a clean read-only contract for future Presensi integration.

---

## 2. Integration with HR Modules & Scope Boundaries

### A. Non-Interference with Master Karyawan & Master Grup

- Setting Jadwal operates independently as a company-wide attendance window matrix.
- Employee profile lookups and Group membership counts in Master Data Karyawan (`/hr/employees`) and Master Data Grup Karyawan (`/hr/employee-groups`) remain fully operational and isolated from schedule modifications.

### B. Strict Avoidance of Fictional Shift / Schedule Assignment

- In accordance with legacy database audit of `u1573701_smm(2).sql`, weekly schedule rules are defined globally in `jadwal`.
- No fictional per-employee or per-group schedule assignment pivot tables were invented.

---

## 3. Downstream Presensi Readiness Contract

To support Sprint 8 Task 11–14 (Presensi & Kehadiran), `scheduleSettingsService` implements the interface `IPresensiScheduleResolver`:

```typescript
export interface IPresensiScheduleResolver {
  getWeeklySchedule(): Promise<ScheduleDayItem[]>
  getScheduleByDayId(dayId: number): Promise<ScheduleDayItem | undefined>
  getScheduleByDate(date: Date | string): Promise<ScheduleDayItem | undefined>
  isWithinCheckInRange(time: string, dayId: number): boolean
  isWithinCheckOutRange(time: string, dayId: number): boolean
}
```

### Key Presensi Helpers:

1. `getScheduleByDate(date)`: Maps a calendar `Date` to its corresponding day-of-week index (`day_id`) and returns the applicable schedule rules.
2. `isWithinCheckInRange(time, dayId)`: Tests whether an employee punch-in timestamp falls inside the configured arrival window.
3. `isWithinCheckOutRange(time, dayId)`: Tests whether an employee punch-out timestamp falls inside the departure window.

---

## 4. Separation from Setting Hari Libur (Task 9–10)

- Setting Jadwal governs **weekly recurring time boundaries** (Senin to Minggu).
- Setting Hari Libur (Sprint 8 Task 9–10) governs **specific non-recurring holiday calendar dates** (e.g. 17 Agustus, Idul Fitri).
- The two modules remain separate and will be resolved together downstream during attendance calculation in Presensi.

---

## 5. Role-Based Access Control (RBAC)

| Role                                   | Read Schedule | Edit / Save Schedule | UI Experience                                                        |
| :------------------------------------- | :-----------: | :------------------: | :------------------------------------------------------------------- |
| **Superadmin**                         |      Yes      |         Yes          | Full editing and saving access                                       |
| **Staff HR & Personalia** (`staff_hr`) |      Yes      |         Yes          | Full editing and saving access (`hr.schedules`)                      |
| **Internal Auditor** (`viewer`)        |      Yes      |        **No**        | Inputs disabled, Save button hidden, Read-Only info banner displayed |

Read-only users are presented with a clear banner:

> _"Mode Hanya Baca: Anda memiliki izin untuk melihat jadwal kerja mingguan, tetapi tidak memiliki hak akses untuk mengubah atau menyimpan pengaturan."_

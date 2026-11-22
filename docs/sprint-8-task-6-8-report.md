# IMPACT FURNITURE V2 — SPRINT 8 TASK 6–8 COMPLETION REPORT

## HR Management: Setting Jadwal Kerja Mingguan

**Author**: Senior Vue 3 Engineer, TypeScript Architect, ERP HR Engineer, UI/UX Engineer, QA Automation Engineer  
**Date**: November 1, 2026  
**Status**: COMPLETED & VERIFIED (Zero Errors, 100% Pass Rate)

---

## 1. Executive Summary

Sprint 8 Tasks 6 through 8 have been fully implemented, rigorously tested, and integrated into the IMPACT FURNITURE V2 codebase:

- **Task 6: Schema Audit, Foundation & Weekly Schedule UI**:
  - Audited legacy MariaDB table `jadwal` from `u1573701_smm(2).sql`.
  - Mapped 7 days and 4 time range groups (8 time columns per day, 56 inputs total).
  - Designed the modern Vue 3 responsive UI with `WeeklyScheduleTable.vue`, `WeeklyScheduleRow.vue`, `ScheduleTimeRange.vue`, and `ScheduleTimeInput.vue`.
  - Handled desktop tabular and mobile card-based responsive views.
- **Task 7: Schedule Editing, Validation & Persistence**:
  - Created controlled state management in `useScheduleSettings.ts`.
  - Implemented single-range completeness/bounds validation and cross-range chronological conflict checks in `schedule-validation.ts`.
  - Built unsaved changes dirty state detection with confirmation dialog guard.
  - Implemented atomic batch persistence and failure recovery simulation in `schedule-settings.service.ts`.
- **Task 8: HR Integration, RBAC, Presensi Readiness & Testing**:
  - Integrated with top navbar and routes (`/hr/schedules` and alias `/hr/schedules/settings`).
  - Implemented RBAC: `hr.schedules` write access for Superadmin and Staff HR, disabled read-only mode for Internal Auditor.
  - Exported reusable `IPresensiScheduleResolver` contract for upcoming Presensi module (Task 11–14).
  - Wrote 3 Vitest suites covering foundation, UI/validation, and the complete 18-step integration workflow.

---

## 2. Verified Legacy Schema Mapping

| SQL Column          | UI Meaning                  | Default (Senin) | Friday Special Rule        |
| :------------------ | :-------------------------- | :-------------- | :------------------------- |
| `shift_in_start`    | Jam Masuk (Mulai)           | 08:00           | 08:00                      |
| `shift_in_end`      | Jam Masuk (Selesai)         | 10:00           | 10:00                      |
| `shift_out_start`   | Jam Pulang (Mulai)          | 14:30           | 14:30                      |
| `shift_out_end`     | Jam Pulang (Selesai)        | 16:00           | 16:00                      |
| `break_start_start` | Mulai Istirahat (Mulai)     | 10:01           | 10:01                      |
| `break_start_end`   | Mulai Istirahat (Selesai)   | 12:00           | **11:30** (_Sholat Jumat_) |
| `break_end_start`   | Selesai Istirahat (Mulai)   | 13:00           | 13:00                      |
| `break_end_end`     | Selesai Istirahat (Selesai) | 14:00           | 14:00                      |

---

## 3. Deliverables and Documentation Inventory

1. `app/docs/sprint-8-task-6-schedule-schema.md` — Database schema audit and column mapping.
2. `app/docs/sprint-8-task-6-schedule-ui.md` — Weekly schedule UI, 56-input grid, and component hierarchy.
3. `app/docs/sprint-8-task-7-schedule-validation.md` — Range validation, cross-range rules, and dirty state.
4. `app/docs/sprint-8-task-7-schedule-persistence.md` — In-memory mock lifecycle and atomic persistence.
5. `app/docs/sprint-8-task-8-schedule-integration.md` — HR coexistence, RBAC enforcement, and Presensi readiness.
6. `app/docs/sprint-8-task-8-schedule-testing.md` — Vitest test inventory and 18-step workflow validation.
7. `app/docs/sprint-8-task-6-8-report.md` — This summary completion report.

# Sprint 8 Task 7 — Schedule Validation & Dirty State Management

## 1. Overview

Sprint 8 Task 7 delivers robust client-side validation, cross-range chronological rule enforcement, and unsaved changes protection for the weekly schedule matrix.

---

## 2. Validation Architecture

Validation logic is cleanly segregated into pure functions in `schedule-validation.ts`:

```
User Input --> [Format Check] --> [Range Completeness] --> [Range Chronology] --> [Cross-Range Rules]
```

### A. Format & Completeness Validation (`validateRange`)

1. **Empty / Off-day Check**: If both `start` and `end` are empty, the range is considered unconfigured or an off day (valid).
2. **Partial Input Rejection**: If only one of the two time points is filled, the range is rejected (_"Rentang [Label] belum lengkap"_).
3. **Format Validation**: Ensures valid 24-hour `HH:mm` format (`00:00` to `23:59`). Invalid strings (e.g. `24:00`, `99:99`, `invalid`) are rejected.
4. **Range Order**: Ensures `start <= end` within each individual activity window.

### B. Cross-Range Chronological Rules (`validateDaySchedule`)

When working hours and breaks are defined for a given day:

1. **Workday Bounds**: Jam Masuk start must be strictly before Jam Pulang end (`checkIn.start < checkOut.end`).
2. **Break Timing**:
   - Mulai Istirahat start must not precede Jam Masuk start (`breakStart.start >= checkIn.start`).
   - Selesai Istirahat start must fall on or after Mulai Istirahat end (`breakEnd.start >= breakStart.end`).
   - Jam Pulang start must not precede Selesai Istirahat end (`checkOut.start >= breakEnd.end`).

---

## 3. UI Error Presentation

- **Inline Input Alerts**: Invalid time inputs receive a red border (`border-red-400`), light red background (`bg-red-50`), and contextual error text below the range pair.
- **Cross-Range Row Banner**: Rows with cross-range conflicts display an amber badge with warning icon highlighting the conflict.
- **Top Summary Alert**: An `AppAlert` danger banner summarizes all validation issues grouped by day name so administrators can quickly locate errors across the 56 inputs.
- **Save Button Interlock**: The "Simpan Setting Jadwal" button is disabled whenever validation errors are present.

---

## 4. Dirty State & Navigation Guard

1. **Reactive Dirty Detection**:
   `useScheduleSettings` compares a JSON serialization of the current editable draft against the snapshot loaded from the repository (`isDirty = computed(...)`).
2. **Dirty Pill Badge**: A live amber pill with an animated pulse dot appears next to the section title whenever uncommitted changes exist.
3. **Route Guard**:
   `onBeforeRouteLeave` intercepts navigation away from the route if `isDirty` is true:
   - Displays `AppConfirmDialog` with options:
     - **Tinggalkan Halaman**: Discards draft changes and proceeds with navigation.
     - **Tetap di Sini**: Cancels navigation, keeping draft inputs intact.
4. **Batalkan Perubahan Action**: A dedicated cancel button allows one-click rollback of all 56 inputs back to the last successfully saved/loaded snapshot.

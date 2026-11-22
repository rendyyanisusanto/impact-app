# Sprint 8 Task 7 — Schedule Persistence & State Lifecycle

## 1. Overview

This document details the persistence lifecycle, atomic batch update flow, and error handling for weekly schedule settings in IMPACT FURNITURE V2.

---

## 2. In-Memory Mock Repository Lifecycle

The service `scheduleSettingsService` maintains an in-memory database initialized with the exact production seeds extracted from `u1573701_smm(2).sql`:

```typescript
export class ScheduleSettingsService implements IPresensiScheduleResolver {
  private state: LegacyJadwalEntity[] = []
  private lastModified: string
  public simulateFailureOnce: boolean = false
  // ...
}
```

---

## 3. Atomic Batch Update Workflow

Since the weekly schedule represents an integrated 7-day organizational policy, saving is performed as an **all-or-nothing atomic batch operation**:

```
[User clicks Simpan Setting Jadwal]
                │
                ▼
[validateWeeklySchedule(items)]
                │
         Is Valid? ──► NO ──► Block save & display error summary
                │
               YES
                │
                ▼
[scheduleSettingsService.saveWeeklySchedule(items)]
                │
         Simulate Error? ──► YES ──► Throw exception & preserve form draft
                │
                NO
                │
                ▼
[Commit updated entities to in-memory state & update timestamp]
                │
                ▼
[Return success response { success: true, updatedCount: 7, updatedAt }]
                │
                ▼
[Update snapshot & reset dirty state, show success alert]
```

---

## 4. Concurrency & Modification Tracking

- **Timestamp Metadata**: Each successful save updates `lastModified` (`ISO 8601`).
- **Draft Preservation on Failure**: If server communication fails during save (e.g. simulated network interruption), user input in the form is never wiped or overwritten. An error alert is shown and the administrator may fix issues and re-try immediately.
- **Rollback via Reset**: Clicking **Batalkan Perubahan** re-populates the form from the clean in-memory snapshot without triggering a full page reload.

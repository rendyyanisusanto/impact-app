# Sprint 8 Task 8 — Weekly Schedule Testing & QA Report

## 1. Test Architecture Overview

Unit, component, and end-to-end integration test suites were constructed in `app/tests/unit/modules/hr/`:

```
app/tests/unit/modules/hr/
├── ScheduleSettingsFoundationAndService.spec.ts  (9 tests)
├── ScheduleSettingsUiAndValidation.spec.ts       (7 tests)
└── ScheduleSettingsIntegrationAndRbac.spec.ts     (1 test, 18-step end-to-end)
```

Combined with earlier Task 1–5 suites, the HR module contains **44 passing tests**.

---

## 2. Test Suite Breakdown

### A. Foundation & Service Tests (`ScheduleSettingsFoundationAndService.spec.ts`)

1. **Schema Audit**: Asserts seeds match legacy `jadwal` table columns and 7 rows.
2. **Friday Special Break**: Verifies Friday morning break ends at `11:30`.
3. **Ordered Sequence**: Confirms Monday (order 1, day_id 2) through Sunday (order 7, day_id 1).
4. **Time Math & Formatting**: Tests normalization, parsing, comparison, and range containment.
5. **Bidirectional Mapping**: Asserts lossless translation between raw database entity and UI ViewModel.
6. **Service Fetching**: Verifies sorted weekly list retrieval.
7. **Atomic Save**: Asserts state persistence and timestamp progression.
8. **Failure Simulation**: Asserts transaction rollback upon network/server interruption.
9. **Presensi Resolver Contract**: Verifies day-of-week resolution and arrival window evaluation.

### B. UI Components & Validation (`ScheduleSettingsUiAndValidation.spec.ts`)

1. **Range Validation**: Tests rejection of incomplete pairs, invalid characters, and reversed ranges.
2. **Cross-Range Logic**: Tests chronological conflict detection (workday bounds and break overlaps).
3. **Weekly Error Aggregation**: Tests error summarization across all 7 days.
4. **ScheduleTimeInput Component**: Tests native input formatting and event emission.
5. **WeeklyScheduleRow Component**: Verifies rendering of all 4 range groups (8 inputs per row).
6. **WeeklyScheduleTable Component**: Verifies rendering of 56 desktop time inputs and mobile cards.
7. **ScheduleSettingsPage Component**: Verifies dirty tracking and Save button activation.

### C. 18-Step Integration Workflow (`ScheduleSettingsIntegrationAndRbac.spec.ts`)

- Step 1: Open Setting Jadwal page.
- Step 2: Verify 7 days appear in strict order (Senin to Minggu).
- Step 3: Modify Jam Masuk Senin (07:30).
- Step 4: Modify Jam Pulang Selasa (16:30).
- Step 5: Modify Mulai Istirahat Jumat (10:15 – 11:45).
- Step 6: Verify form is marked dirty and Save button is enabled.
- Step 7: Click Simpan Setting Jadwal.
- Step 8: Verify success notification and reset of dirty state.
- Step 9: Reload from service and assert modified values persist.
- Step 10: Input invalid time range (11:00 > 10:00).
- Step 11: Assert save is blocked and validation error is displayed.
- Step 12: Simulate server save failure.
- Step 13: Trigger save, assert error is displayed and user draft is NOT lost.
- Step 14: Click Batalkan Perubahan.
- Step 15: Assert values revert to snapshot.
- Step 16: Mount as read-only auditor (`viewer`), assert inputs disabled and banner visible.
- Step 17: Query Presensi resolver contract and verify attendance evaluation.
- Step 18: Query Employee and Group services to confirm zero regressions across prior tasks.

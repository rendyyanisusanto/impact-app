# SPRINT 9 — TASK 1–4: GROUPS TESTING STRATEGY & VERIFICATION REPORT

## 1. Test Architecture Overview

All tests are implemented using **Vitest** and **Vue Test Utils** with TypeScript strict typing. The test suite covers:
1. Domain Validation & Registry (`GroupValidationAndRegistry.spec.ts`)
2. Service, Persistence, RBAC Synchronization & Deletion Protection (`GroupServiceAndSync.spec.ts`)
3. Components, Permission Matrix & UI Interactivity (`GroupComponentsAndMatrix.spec.ts`)
4. Comprehensive 14-Step End-to-End Workflow & RBAC Lifecycle (`GroupWorkflowAndRbac.spec.ts`)

---

## 2. Test Suite Breakdown

### 2.1 Domain Validation & Registry (`GroupValidationAndRegistry.spec.ts`)
- **Number of Tests**: 13 tests.
- **Coverage**:
  - `validateGroupName`: Rejects empty string, rejects names < 2 chars, rejects names > 20 chars, rejects non-alphanumeric special characters, rejects duplicate names (case-insensitive).
  - Superadmin Name Protection: Prevents renaming Group ID 1 from `admin`.
  - `validateGroupDescription`: Rejects empty description, rejects descriptions < 2 chars, rejects descriptions > 100 chars.
  - `createDefaultPermissions`: Generates 34 submenu permissions matching `MENU_REGISTRY`.
  - `MENU_REGISTRY`: Verifies reporting submenus have `allowedActions.u = false` and `allowedActions.d = false`.
  - `serializePermissionsToV2`: Formats granular submenu permissions into `Permission[]` resource maps.
  - `calculatePermissionSummary`: Correctly sums C, R, U, D counts and dashboard access count.

### 2.2 Group Service & Dynamic Sync (`GroupServiceAndSync.spec.ts`)
- **Number of Tests**: 12 tests.
- **Coverage**:
  - Seeds 9 legacy initial groups (`admin`, `pengadaan`, `gudang`, `produksi`, `penjualan`, `pengiriman`, `keuangan`, `hr`, `operator`).
  - Calculates dynamic `userCount` from simulated `users_groups`.
  - Blocks deletion of groups with active users with exact legacy error message:
    `"Tidak dapat menghapus group \"penjualan\" karena masih memiliki 3 user yang terkait"`.
  - Blocks deletion of Superadmin (`admin`, ID 1).
  - Successfully deletes unassigned groups.
  - Supports bulk deletion with partial failures reporting bound users.
  - Updates group permissions and triggers `syncActiveUserSession` to immediately update `authStore.currentUser.permissions` without re-login.
  - Exports data to Excel and PDF formats.

### 2.3 Components & Matrix Interactivity (`GroupComponentsAndMatrix.spec.ts`)
- **Number of Tests**: 6 tests.
- **Coverage**:
  - `GroupPermissionSummary.vue`: Renders 6 KPI metric cards with correct values.
  - `GroupDashboardAccess.vue`: Toggles all 3 widgets on select all; manages indeterminate state when 1 widget is selected.
  - `GroupPermissionMatrix.vue`:
    - Renders 10 categories in accordions.
    - Global Select All / Cancel All checkboxes.
    - Column Select All for C, R, U, D with indeterminate support.
    - Filters submenus via search input without losing checked states.
    - Disables checkboxes for actions not permitted (e.g. reporting Update & Delete).

### 2.4 14-Step End-to-End Workflow & RBAC (`GroupWorkflowAndRbac.spec.ts`)
- **Number of Tests**: 1 integration test (14 sequential workflow assertions).
- **Step-by-Step Flow**:
  1. Initialize `GroupListPage` and verify initial 9 seeded groups rendered with uppercase names (`ADMIN`, `PENGADAAN`, etc.).
  2. Perform search filter for `pengadaan` and verify filtered results.
  3. Verify Superadmin group row has delete button disabled.
  4. Attempt single deletion on `gudang` (has 3 users) → blocked with legacy error message.
  5. Select multiple groups and attempt bulk delete → only unassigned groups deleted, bound groups preserved with error report.
  6. Navigate to `GroupCreatePage`, test validation rules (name length, duplicate name, description).
  7. Fill valid new group: `AUDITOR` / `Auditor Internal Pabrik`.
  8. Configure Dashboard access: enable `All Top Spender` and `Get Recent Mutation`.
  9. Configure Permission Matrix: toggle category Select All on `Pengadaan`, enable `R` on `Laporan`.
  10. Verify KPI summary cards reflect exact counts.
  11. Save new group and verify redirected to list with new group present.
  12. Navigate to `GroupDetailPage` for `AUDITOR` and verify read-only presentation (green checks / red crosses).
  13. Navigate to `GroupEditPage`, update permissions, verify `onBeforeRouteLeave` dirty check.
  14. Save updates and verify `syncActiveUserSession` immediately propagates new permissions into active `authStore.currentUser`.

---

## 3. Test Execution Results

```
Test Files  120 passed (120)
     Tests  754 passed (754)
  Duration  47.09s
```

All 32 tests in `app/tests/unit/modules/system/` passed cleanly with 0 failures and 0 regressions.
Production build `npm run build` completed in 15.10s with 0 errors.


# Sprint 2 — Task 4 Implementation Report: Role-Based Access Control (RBAC)

## 1. Executive Summary

Task 4 establishes the frontend Role-Based Access Control (RBAC) engine for Impact Furniture v2. Access permissions are strictly data-driven using resource identifiers and action sets (`create`, `read`, `update`, `delete`). Navigation menus in both desktop and mobile layouts are filtered reactively while preserving pure function immutability.

---

## 2. Key Deliverables

- **Permissions Engine**: `app/src/shared/utils/permissions.ts`
- **RBAC Composable**: `app/src/shared/composables/usePermission.ts` (aliased to `usePermissions.ts`)
- **Desktop Navbar Menu**: `app/src/app/layouts/components/AppNavigationMenu.vue`
- **Mobile Drawer Nav**: `app/src/app/layouts/components/AppMobileNavigation.vue`
- **Unit & Composable Tests**:
  - `app/tests/unit/auth/permissions.spec.ts` (15 tests)
  - `app/tests/unit/composables/usePermissions.spec.ts` (3 tests)
  - `app/tests/unit/layouts/AppNavigationMenu.spec.ts` (4 tests)

---

## 3. Permission Model & Data-Driven Policy

### Action Verbs

- `read`: Viewing lists, detail views, reports, dashboards.
- `create`: Adding new master data or transactions.
- `update`: Editing existing records or changing statuses.
- `delete`: Deleting or voiding records.

### No Hardcoded Role Names

Permission evaluation strictly checks `user.permissions` rather than `user.roleName === 'Superadmin'`. Superadmin access is represented data-driven via `{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }`.

```ts
// Data-driven wildcard check
const hasWildcard = user.permissions?.some(
  p =>
    (p.resource === '*' || p.resource === 'all') &&
    (p.actions.includes(action) || p.actions.includes('*') || p.actions.length === 0)
)
```

---

## 4. Pure Navigation Filtering

`filterNavigationByPermissions(items, user)`:

1. **Purity**: Clones items recursively without mutating the original `NAVIGATION_ITEMS` array.
2. **Parent Preservation**: Parent modules remain visible if at least one child route is accessible.
3. **Parent Concealment**: If all children of a parent module are forbidden, the parent is completely hidden.
4. **Order Preservation**: The original ERP module ordering (11 main modules) remains intact.

---

## 5. UI Permission Composable (`usePermission`)

```vue
<script setup lang="ts">
import { usePermission } from '@/shared/composables/usePermission'

const { canRead, canCreate, canUpdate, canDelete, hasPermission } = usePermission()
</script>

<template>
  <AppButton v-if="canCreate('sales.orders.impact')"> Tambah Sales Order </AppButton>
</template>
```

---

## 6. Verification & Test Results

All 15 tests in `tests/unit/auth/permissions.spec.ts` passed:

1. Superadmin wildcard full access.
2. Staff Penjualan limited access.
3. Staff Gudang limited access.
4. Read action verification.
5. Create action verification.
6. Update action verification.
7. Delete action verification.
8. Missing permission denial.
9. Unknown resource denial.
10. Parent navigation item retention when child is accessible.
11. Parent navigation item removal when all children are forbidden.
12. Route permission enforcement.
13. `usePermission` composable reactivity.
14. Navigation config array immutability.
15. Multi-permission helper validation.

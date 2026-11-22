# Sprint 1 — Task 7 Implementation Report: Mock Authentication & RBAC

## 1. Executive Summary

Task 7 established a mock authentication and role-based access control (RBAC) foundation for Impact Furniture v2. It emulates the permission matrix of the legacy CodeIgniter ERP system, enforces route-level and component-level authorization, and prevents security vulnerabilities such as open redirect attacks.

---

## 2. Deliverables & Implemented Modules

| Module / File                                    | Description                                                                                                           |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `src/shared/types/auth.types.ts`                 | Strongly typed definitions for `AuthUser`, `Permission`, `PermissionAction`, `MockLoginInput`, and `AuthState`.       |
| `src/mocks/users.mock.ts`                        | 3 testing personas: Superadmin (`*`), Staff Penjualan (`sales.*`), and Staff Gudang (`inventory.*`, `delivery.*`).    |
| `src/shared/utils/permissions.ts`                | Pure functions for wildcard permission resolution, route checking, navigation pruning, and return URL validation.     |
| `src/modules/auth/services/mock-auth.service.ts` | In-memory session mock service supporting login, logout, current user retrieval, and role switching.                  |
| `src/stores/auth.store.ts`                       | Pinia store managing user session, reactive computed permissions, login/logout actions, and role switching.           |
| `src/app/router/guards.ts`                       | Router navigation guards verifying authentication, checking RBAC permissions, and preventing infinite redirect loops. |
| `src/modules/auth/pages/UnauthorizedPage.vue`    | User-friendly 403 Forbidden page with navigation back to safe zones.                                                  |
| `src/shared/composables/usePermissions.ts`       | Vue composable providing convenient template helpers (`hasPermission`, `canAccessRoute`).                             |

---

## 3. Key Security & Engineering Features

1. **Hierarchical Wildcard Resolution**: Supports `*` for full administrator access and domain prefixes (e.g., `sales.*`) for departmental staff.
2. **Open Redirect Defense**: The `isValidReturnUrl` utility strictly enforces that return URLs are relative paths starting with `/` (rejecting protocol-relative `//` and scheme prefixes like `javascript:` and `https:`).
3. **Automated Navigation Pruning**: Navigation menus automatically prune parent menus if the user has no permissions to access any of their child items.
4. **Infinite Loop Prevention**: Router guards detect when target route is `/login` or `/unauthorized` to avoid circular redirects.

---

## 4. Verification & Test Results

All dedicated test suites passed with 100% success:

- `tests/unit/auth/permissions.spec.ts` (7 tests)
- `tests/unit/router/guards.spec.ts` (5 tests)
- `tests/unit/stores/auth.store.spec.ts` (6 tests)
- `tests/unit/composables/usePermissions.spec.ts` (3 tests)

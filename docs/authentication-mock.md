# Mock Authentication & Role-Based Access Control (RBAC) Architecture

## 1. Overview

Impact Furniture v2 implements a client-side mock authentication and RBAC layer designed to simulate the security and permission behavior of the legacy PHP 5 / CodeIgniter 3 ERP system while providing a modern reactive foundation for Sprint 2 backend integration.

The implementation strictly decouples authentication logic into:

- Typed data models (`src/shared/types/auth.types.ts`)
- Pure permission evaluation utilities (`src/shared/utils/permissions.ts`)
- Mock service adapter with configurable latency (`src/modules/auth/services/mock-auth.service.ts`)
- Global reactive Pinia store (`src/stores/auth.store.ts`)
- Vue Router navigation guards (`src/app/router/guards.ts`)
- Reusable UI composables (`src/shared/composables/usePermissions.ts`)

---

## 2. Mock User Accounts & Testing Personas

Three primary user personas are pre-configured for Sprint 1 evaluation:

| User ID | Username          | Full Name           | Role              | Primary Permissions                              |
| :------ | :---------------- | :------------------ | :---------------- | :----------------------------------------------- |
| `1`     | `superadmin`      | Super Administrator | `superadmin`      | `*` (Full access to all 11 ERP modules)          |
| `2`     | `sales_staff`     | Budi Santoso        | `staff_penjualan` | `dashboard:read`, `sales.*`, `report.sales:read` |
| `3`     | `warehouse_staff` | Joko Wahyudi        | `staff_gudang`    | `dashboard:read`, `inventory.*`, `delivery.*`    |

---

## 3. RBAC & Permission Model

Permissions are formatted using hierarchical dot-notation strings (`<module>.<resource>:<action>` or `<module>.*`).

### Permission Match Rules:

1. **Superadmin Wildcard (`*`)**: A user with `*` permission matches any required permission rule.
2. **Domain Wildcard (`<domain>.*`)**: e.g., `sales.*` grants access to `sales.customer:read`, `sales.order:create`, `sales.invoice:update`, etc.
3. **Exact Match**: e.g., `inventory.raw-materials:read` matches only requests for that exact permission.

### Pure Evaluation Utilities (`src/shared/utils/permissions.ts`):

- `hasPermission(user, required)`: Checks a single permission string against the user's granted permissions.
- `hasAnyPermission(user, requiredList)`: Returns `true` if the user satisfies at least one required permission.
- `hasAllPermissions(user, requiredList)`: Returns `true` only if the user satisfies every required permission.
- `canAccessRoute(user, routePermission)`: Evaluates route-level access rules.
- `filterNavigationByPermissions(items, user)`: Recursively filters the ERP navigation tree. If a parent category has all its children filtered out, the parent menu item is automatically pruned from the navigation bar.

---

## 4. Open Redirect Prevention

To guard against malicious open redirect attacks via login queries (e.g., `/login?redirect=https://evil.com`), `isValidReturnUrl` verifies that redirect targets:

- Must start with a single `/`.
- Must not begin with `//` (protocol-relative URLs).
- Must not contain URI schemes (`http:`, `https:`, `javascript:`, `data:`).
- Must not escape to untrusted external domains.

If an invalid or unsafe redirect URL is detected, the router falls back safely to `/dashboard`.

---

## 5. Route Protection & Navigation Guards

Navigation guards are registered in `src/app/router/guards.ts`:

1. **Authentication Check**: Routes requiring `meta.requiresAuth` (or all protected routes by default) verify `authStore.isAuthenticated`. Unauthenticated users are redirected to `/login` with a safe `?redirect` query parameter.
2. **Authorization / RBAC Check**: Routes defining `meta.permissions` verify access via `canAccessRoute`. If the authenticated user lacks permission, they are redirected to `/unauthorized` (403 error page).
3. **Guest Guard**: Authenticated users visiting `/login` are automatically redirected to `/dashboard`.
4. **Loop Prevention**: Dedicated guards prevent recursive redirection between `/login` and `/unauthorized`.

---

## 6. Frontend vs. Production Security Boundary

> [!WARNING]
> Mock authentication and RBAC in Sprint 1 are strictly client-side simulations. In production, client-side permission checks are purely for UX optimization (showing/hiding UI elements). All authorization and access control will be authoritatively enforced by the NestJS backend API with signed JWT tokens in Sprint 2.

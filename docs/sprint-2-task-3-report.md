# Sprint 2 — Task 3 Implementation Report: Route Guards & Protected Pages

## 1. Executive Summary

Task 3 hardens frontend route security across Impact Furniture v2. Using modern Vue Router return-based navigation guards, all ERP operational modules are protected from unauthenticated access, while permission-protected routes redirect unauthorized users to a dedicated 403 error page. Open redirect vulnerabilities are strictly prevented.

---

## 2. Key Deliverables

- **Route Guards**: `app/src/app/router/guards.ts`
- **Route Definitions**: `app/src/app/router/routes.ts`
- **Unauthorized Page**: `app/src/modules/auth/pages/UnauthorizedPage.vue`
- **Open Redirect Validator**: `app/src/shared/utils/permissions.ts` (`isValidReturnUrl`)
- **Unit & Integration Tests**: `app/tests/unit/router/guards.spec.ts`

---

## 3. Route Guard Flow Logic

The `setupRouteGuards` hook evaluates routes in the following deterministic sequence:

```text
Router Navigation Triggered
           ↓
1. Update document.title
           ↓
2. Await authStore.initializeAuth() (if not yet initialized)
           ↓
3. Is user authenticated and visiting /login?
   ├── Yes → Redirect to /dashboard (or /unauthorized if no dashboard permission)
   └── No  → Continue
           ↓
4. Does route require authentication (`meta.requiresAuth !== false`)?
   ├── Unauthenticated → Redirect to /login?redirect=<safeEncodedPath>
   └── Authenticated   → Continue
           ↓
5. Does route specify `meta.permission`?
   ├── User has permission → Return true (allow)
   └── User lacks permission → Redirect to /403 / /unauthorized (preventing loop)
           ↓
6. Allow navigation
```

---

## 4. Open Redirect Prevention

The validator `isValidReturnUrl(url)` ensures that query redirect targets are safe relative paths:

- Must begin with a single `/`.
- Rejects protocol-relative paths beginning with `//` or `/\\`.
- Rejects URI schemes (`http:`, `https:`, `javascript:`, `data:`).
- Malicious or invalid targets fallback safely to `/dashboard`.

---

## 5. 403 Forbidden & 404 Not Found Pages

- **`/403` / `/unauthorized`**:
  - Displays `ShieldAlert` icon, heading _"403 — Akses Ditolak"_, current role name, and action buttons (_Ke Dashboard_, _Ganti Profil Akun_, _Logout_).
  - Protected against redirect loops.
- **404 Catch-All**:
  - Handled by `/:pathMatch(.*)*` rendering `NotFoundPage.vue` with `meta.requiresAuth = false`.

---

## 6. Verification & Test Results

All 12 tests in `tests/unit/router/guards.spec.ts` passed:

1. Guest accessing `/dashboard` redirects to `/login`.
2. Guest accessing protected submenu redirects to `/login` with `?redirect=...`.
3. Guest accessing public `/login` route is allowed.
4. Authenticated user accessing `/login` redirects to `/dashboard`.
5. Authenticated user accessing `/dashboard` is allowed.
6. User lacking permission redirects to `/unauthorized` without loop.
7. User with permission accesses permitted route.
8. Invalid return URLs are rejected.
9. External protocol URLs and protocol-relative URLs (`//evil.com`) are blocked.
10. Unknown routes render 404 without redirect loops.
11. Immediate access block after logout.
12. Session restoration on simulated browser refresh.

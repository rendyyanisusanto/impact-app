# Authentication Flow Architecture — Impact Furniture v2

## 1. Overview

This document specifies the end-to-end authentication lifecycle for the Impact Furniture v2 frontend. During Sprint 2, authentication operates using an enterprise-ready mock service adapter simulating JWT/session tokens, designed for seamless swap with NestJS backend APIs in subsequent sprints.

---

## 2. Authentication Lifecycle Diagram

```text
[ User Opens App / Route Navigation ]
                  │
                  ▼
         [ router.beforeEach ]
                  │
        (auth.isInitialized?)
         ├── No  ──► [ authStore.initializeAuth() ]
         │                     │
         │           [ mockAuthService.getCurrentUser() ]
         │                     │
         │           Restore session from sessionStorage
         │           (Stores mock user ID only)
         └── Yes ──────────────┘
                  │
                  ▼
         [ Access Decision ]
         ├── Guest on Protected Route ──► Redirect /login?redirect=<safePath>
         ├── User on /login           ──► Redirect /dashboard
         ├── User on Forbidden Route  ──► Redirect /403
         └── Permitted                ──► Render View
```

---

## 3. Login Flow Sequence

```text
User Form Input (username, password)
       │
       ▼
validateForm() (Required check, username trim, password preserved)
       │
       ▼
authStore.login(username, password)
       │ (sets isLoading = true, prevents double submit)
       ▼
mockAuthService.login(credentials)
       │
       ├── Credentials Match:
       │     - Sets mock session ID in sessionStorage
       │     - Returns AuthUser object
       │     - authStore updates currentUser & isAuthenticated = true
       │     - Toast welcome message
       │     - Redirect to validated returnUrl or /dashboard
       │
       └── Credentials Mismatch:
             - Throws "Username atau password tidak valid."
             - authStore updates error state
             - LoginPage displays AppAlert (variant="danger")
             - isLoading reset to false
```

---

## 4. Logout Flow Sequence

```text
User clicks Logout (AppUserMenu / UnauthorizedPage)
       │
       ▼
authStore.logout()
       │
       ▼
mockAuthService.logout()
       │
       ▼
sessionStorage.removeItem('impact_mock_session_user_id')
       │
       ▼
authStore resets currentUser = null & isAuthenticated = false
       │
       ▼
router.push('/login')
```

---

## 5. Security Guardrails & Limitations

1. **Frontend RBAC is not Data Security**: All frontend permission checks and route guards control navigation presentation and user guidance. When the NestJS backend is deployed, backend API guards and token verification remain the authoritative barrier.
2. **Storage Safety**: No passwords, tokens, or personal identifiers are stored in `localStorage` or `sessionStorage`. Only the simulated development mock ID (`1`, `2`, `3`) is retained across refreshes.
3. **Open Redirect Protection**: `isValidReturnUrl` prevents open redirects by rejecting absolute URLs with schemes, double-slash protocol-relative URLs (`//evil.com`), and non-path targets.

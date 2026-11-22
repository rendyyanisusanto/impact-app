# Sprint 2 — Task 2 Implementation Report: Authentication Flow

## 1. Executive Summary

Task 2 hardens the mock authentication system across the Pinia store, mock service adapter, and user fixtures. The authentication lifecycle is fully integrated, covering session initialization, login validation, session state management, error handling, and secure logout.

---

## 2. Key Deliverables & Service Contracts

- **Store**: `app/src/stores/auth.store.ts`
- **Service**: `app/src/modules/auth/services/mock-auth.service.ts`
- **Contract Adapter**: `app/src/shared/services/auth.service.ts`
- **Types**: `app/src/shared/types/auth.types.ts`
- **Unit Test Suite**: `app/tests/unit/stores/auth.store.spec.ts`

### TypeScript Interfaces

```ts
export interface LoginCredentials {
  username: string
  password?: string
}

export interface AuthUser {
  id: string | number
  name: string
  username: string
  roleId: string
  roleName: string
  role?: RoleType
  email?: string
  avatar?: string
  permissions: Permission[]
}

export interface AuthService {
  login(input: MockLoginInput): Promise<AuthUser>
  logout(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
  switchUser(userId: string | number): Promise<AuthUser>
}
```

---

## 3. Store State & Lifecycle

```ts
interface AuthState {
  currentUser: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}
```

### Action Behaviors:

1. **`initializeAuth()`**:
   - Checks `sessionStorage` or in-memory mock session.
   - Sets `currentUser` and `isAuthenticated`.
   - Sets `isInitialized = true` before routing decisions execute.

2. **`login(credentials)`**:
   - Guards against double submission (`if (isLoading.value) throw new Error(...)`).
   - Normalizes and verifies username against mock fixtures.
   - Sets `currentUser` and `isAuthenticated = true`.
   - Propagates clear Indonesian error messages on mismatch without leaking system internals.

3. **`logout()`**:
   - Calls `authService.logout()`.
   - Clears `currentUser = null` and `isAuthenticated = false`.
   - Clears stored session identifiers.

4. **`switchUser(userId)`**:
   - Rapid development utility to toggle between Superadmin, Staff Penjualan, and Staff Gudang roles.

---

## 4. Security Considerations & Storage Safety

- **No Passwords or Tokens in Storage**: Only the mock user ID (`'1'`, `'2'`, `'3'`) is stored in `sessionStorage` under the key `impact_mock_session_user_id`. No raw passwords or mock tokens are saved in browser storage.
- **Generic Error Messaging**: The service does not disclose whether a particular username exists, returning the uniform message _"Username atau password tidak valid."_

---

## 5. Verification & Testing

All 8 tests in `tests/unit/stores/auth.store.spec.ts` passed:

- Default superadmin initialization in development.
- Successful mock login.
- Failed mock login handling.
- Session clearing on logout.
- In-memory service session restoration.
- Role switching & permission updates.
- Double-submission locking.
- Error clearance via `clearError()`.

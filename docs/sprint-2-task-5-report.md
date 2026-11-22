# Sprint 2 — Task 5 Report: User Profile & Account Menu

## 1. Executive Summary

Task 5 enhances the user identity display and profile dropdown in `AppHeader.vue` via `AppUserMenu.vue`. The user menu displays the active session data from Pinia `authStore.currentUser`, shows calculated initial avatar and user role, and provides a functional, secure logout flow that clears credentials and redirects the user to `/login`.

## 2. Implemented Features & Architecture

- **Reactive User Identity**: Reads from `authStore.currentUser` with fallback to `authStore.user`.
- **Initials Computation**: Automatically computes initials (e.g., "SA" for Super Admin, first letters of names, or 2-character slice).
- **Role Display**: Shows `currentUser.roleName` or `currentUser.role` with a Shield icon badge.
- **Account Dropdown**:
  - Displays user avatar, name, email/username, and active role pill.
  - Links to "Profil Saya" (`/system/edit-account`) and "Pengaturan Akun" (`/settings/app`).
  - Active logout button with loading indicator (`Loader2` spin), prevention of double-clicks, session clearing via `authStore.logout()`, and navigation to `/login`.
- **Keyboard & Click Accessibility**:
  - Closes on click outside with safe `instanceof Node` guard.
  - Closes on `Escape` key and returns focus to trigger button.
  - ARIA attributes: `role="menu"`, `role="menuitem"`, `aria-expanded`, `aria-haspopup="menu"`.

## 3. Verification & Test Coverage

- Unit tests in `tests/unit/layouts/AppUserMenu.spec.ts`:
  - Avatar, username, and role rendering from authStore.
  - Dropdown toggle, Escape key closure, and focus return.
  - Click outside detection and automatic closure.
  - Logout trigger, store state clearing, and `/login` redirection.
- All 4 tests in `AppUserMenu.spec.ts` passing.

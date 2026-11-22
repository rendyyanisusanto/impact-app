# Sprint 2 — Task 1 Implementation Report: Login Page UI & UX

## 1. Executive Summary

Task 1 implements the enterprise Login Page for **Impact Furniture v2**. Built using Vue 3, TypeScript strict, and Tailwind CSS without third-party UI component frameworks, it features a split-screen desktop layout, high-density responsive presentation, and accessible authentication controls tailored for enterprise ERP internal operations.

---

## 2. Key Deliverables & Architecture

- **File Location**: `app/src/modules/auth/pages/LoginPage.vue`
- **Re-export View Wrapper**: `app/src/modules/auth/views/LoginView.vue`
- **Unit Test Suite**: `app/tests/unit/modules/auth/LoginPage.spec.ts`

### Layout & Component Structure

1. **Desktop Split-Screen Layout (`lg:flex`)**:
   - **Left Panel (Branding)**:
     - Background token `#34454F` (`bg-navbar`), border accent `#28363E`, and subtle radial gradient glows.
     - Brand Monogram ("IF" gradient badge) + System Title ("IMPACT FURNITURE") + Subtitle ("Management Information System").
     - Clear ERP value proposition: _"Kelola penjualan, persediaan, produksi, dan keuangan dalam satu sistem terintegrasi dengan performa tinggi dan tata kelola berbasis peran."_
     - Feature highlights: Modular ERP, RBAC granular security, consistent design tokens.
     - Metadata footer: Application version (`v2.0 • Sprint 2`) and internal enterprise network designation.
   - **Right Panel (Login Form)**:
     - Clean, focused form surface (`bg-surface`, `border-border`, `shadow-card`, max width `28rem`).
     - Heading: _"Selamat Datang"_ / _"Masuk ke akun Anda"_.
     - Semantic HTML `<form novalidate @submit.prevent="handleLogin">`.
     - Username input with validation feedback.
     - Password input with accessible show/hide toggle (`Eye` & `EyeOff` icons from `lucide-vue-next`).
     - Submit button with spinner loading state (`AppButton :loading="isLoading" :disabled="isLoading"`).
     - Security notice indicating restricted internal ERP usage.
     - Development Mock Profiles selector labeled explicitly as **"Mode Pengujian (Mock RBAC) • Development Only"**.

2. **Mobile Adaptability (< 1024px)**:
   - Left branding panel gracefully hides.
   - Mobile compact brand header rendered at the top of the form.
   - Touch-friendly input targets (minimum 40px height) and no horizontal viewport overflow.

---

## 3. Form Validation & Behavior

| Field                    | Rules                                                    | Error Message (Bahasa Indonesia)        |
| :----------------------- | :------------------------------------------------------- | :-------------------------------------- |
| **Username**             | Required, leading/trailing whitespace trimmed, non-blank | _"Username wajib diisi."_               |
| **Password**             | Required, character preserving (no trimming)             | _"Password wajib diisi."_               |
| **Authentication Error** | Invalid credentials                                      | _"Username atau password tidak valid."_ |

- **Double-Submission Prevention**: Form submission locks when `isLoading` is active.
- **Accessible Password Visibility Toggle**:
  - `type="button"`, accessible `aria-label` (_"Tampilkan password"_ / _"Sembunyikan password"_).
  - Tab accessible, does not submit form, does not alter input text.

---

## 4. Verification & Testing

Unit tests in `tests/unit/modules/auth/LoginPage.spec.ts` verify all requirements:

- Split-screen layout and brand elements.
- Username whitespace trimming & validation.
- Password preservation & validation.
- Show/hide password button functionality and accessibility labels.
- Successful login & dashboard redirection.
- Authentication failure error alert.
- Development mock profile quick login.

All 7 tests passed.

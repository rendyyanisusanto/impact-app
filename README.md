# Impact Furniture v2 — Frontend Foundation

## Project Overview

**Impact Furniture v2** adalah remake dari sistem informasi manajemen internal (ERP) perusahaan furniture yang sebelumnya dikembangkan menggunakan PHP 5 dan CodeIgniter 3. Proyek ini memigrasikan fondasi arsitektur ke Vue 3, TypeScript, dan Vite dengan prinsip:

> **Familiar in workflow, modern in appearance, professional in execution.**

Seluruh pengembangan Sprint 1 (Task 1 s.d. Task 11) telah selesai diimplementasikan secara komprehensif di dalam folder `app/` tanpa dependensi framework UI eksternal (bebas dari PrimeVue, Vuetify, Bootstrap, Element Plus, Tailwind component libraries, dsb.).

---

## Technology Stack

- **Vue 3** (Composition API, `<script setup lang="ts">`)
- **TypeScript 5.7** (Strict Mode, 0 `any`, 0 `@ts-ignore`)
- **Vite 6** (Next-generation build tool & dev server)
- **Tailwind CSS 3** (Satu-satunya styling framework utilitas)
- **Vue Router 4** (HTML5 History Mode routing dengan typed metadata)
- **Pinia 2** (State management terpusat)
- **lucide-vue-next** (Icon set berbasis SVG)
- **ESLint 9** (Flat config dengan vue, typescript-eslint, dan eslint-config-prettier)
- **Prettier 3** (Standardisasi format kode konsisten)
- **Vitest 3 & @vue/test-utils** (Unit test runner dengan jsdom)

---

## Requirements

- **Node.js**: v20.x, v22.x, atau v25.x
- **Package Manager**: npm 10.x atau 11.x

---

## Installation & Setup

Pastikan Anda berada di direktori `app/`:

```bash
cd app
npm install
```

---

## Quality Gate Verification Commands

Proyek ini menerapkan 5 tahapan quality gate yang seluruhnya wajib lolos dengan 0 error sebelum release:

```bash
# 1. Typecheck TypeScript (strict mode)
npm run typecheck

# 2. Lint kode menggunakan ESLint
npm run lint

# 3. Periksa format Prettier
npm run format:check

# 4. Jalankan seluruh unit test suite (Vitest)
npm run test

# 5. Build bundle produksi
npm run build
```

---

## Development Server

Jalankan local development server:

```bash
npm run dev
```

Aplikasi dapat diakses pada: `http://localhost:3000`

### Rute Khusus Development:

- `/dev/design-system`: Interactive Design System Showcase (Katalog lengkap token, komponen UI, formulir, alert, modal, tabel, dan warna).
- `/dev/theme-preview`: Visual token & typography palette preview.

---

## Project Structure

```text
app/
├── docs/                             # Dokumentasi arsitektur & laporan per-task
│   ├── architecture.md               # Arsitektur frontend modular
│   ├── design-system.md              # Dokumentasi design tokens
│   ├── component-guidelines.md       # Panduan penggunaan komponen UI
│   ├── navigation-architecture.md    # Arsitektur navigasi & 11 menu ERP
│   ├── authentication-mock.md        # Desain mock autentikasi & RBAC
│   ├── service-architecture.md       # Arsitektur service layer & mock adapter
│   ├── sprint-1-task-*-report.md     # Laporan individual Task 1–10
│   └── sprint-1-final-report.md      # Laporan akhir komprehensif Sprint 1
├── public/                           # Favicon & aset statis
├── src/
│   ├── app/                          # Core shell aplikasi
│   │   ├── layouts/                  # AppLayout, AuthLayout, Header, Navbar, Breadcrumb, UserMenu
│   │   ├── navigation/               # Definisi hierarki 11 menu navigasi ERP
│   │   └── router/                   # Vue Router, routes.ts, router.d.ts, navigation guards
│   ├── assets/styles/                # tokens.css, base.css, main.css
│   ├── mocks/                        # Mock data user, session, static navigation
│   ├── modules/                      # Modul fitur bisnis
│   │   ├── auth/                     # LoginPage, UnauthorizedPage (403), MockAuthService
│   │   ├── dashboard/                # DashboardPage, Filters, KpiCard, ChartPlaceholder, WidgetPlaceholder
│   │   ├── dev/                      # DesignSystemShowcaseView, ThemePreviewPage
│   │   ├── sales/                    # Domain Sales Order (types, mock data, service)
│   │   └── system/                   # NotFoundView (404)
│   ├── shared/                       # Reusable assets
│   │   ├── components/               # ui/, feedback/, data/, forms/, navigation/
│   │   ├── composables/              # useToast, useConfirm, usePermissions
│   │   ├── services/                 # service-factory, api-error, mock helpers, query-params
│   │   ├── types/                    # auth, navigation, pagination, table, ui, api
│   │   └── utils/                    # permissions, query-params
│   └── stores/                       # auth.store.ts, ui.store.ts
└── tests/
    └── unit/                         # 38 unit test suites (162 tests)
```

---

## Environment Variables

File `.env.example`:

```env
VITE_APP_NAME="Impact Furniture v2"
VITE_API_BASE_URL="/api/v1"
VITE_USE_MOCK=true
```

- `VITE_APP_NAME`: Nama aplikasi.
- `VITE_API_BASE_URL`: Endpoint dasar backend NestJS.
- `VITE_USE_MOCK`: `true` untuk mengaktifkan mock service layer; `false` untuk mengaktifkan koneksi HTTP riil.

---

## Sprint 1 Summary

- **Task 1 — Repository Audit & Project Initialization**: Fondasi teknis Vue 3, Vite, Tailwind CSS, Pinia, Vue Router, Vitest.
- **Task 2 — Design Tokens & Global Styling**: Tokens warna (Primary Teal `#0F766E`, Header Slate `#34454F`), tipografi desktop ERP, spacing, CSS variables.
- **Task 3 — Main Application Layout & Navigation**: Shell aplikasi, header, horizontal navbar, multi-level dropdown, breadcrumb dinamis, mobile drawer, user menu.
- **Task 4 — Navigation Hardening & Routing**: 11 modul ERP lengkap, typed route metadata, 404 catch-all.
- **Task 5 — Core UI Components**: 19 komponen antarmuka mandiri (Button, Input, Card, Select, Badge, Skeleton, dsb.).
- **Task 6 — Advanced Shared Components**: Modal, ConfirmDialog, Toast container, Tabs, Pagination, Data Table (sortable, selectable, compact density).
- **Task 7 — Mock Authentication & RBAC**: Multi-role personas (`superadmin`, `staff_penjualan`, `staff_gudang`), wildcard permission engine, route guards, open redirect protection.
- **Task 8 — Mock Service Infrastructure**: Service factory, pagination/sorting standards, error normalization, delay simulation, sales order mock domain.
- **Task 9 — Design System Showcase**: Visual interactive showcase view dan showcase mock datasets.
- **Task 10 — Dashboard Skeleton**: Layout dashboard operasional, KPI cards, chart visual skeletons, operational widgets.
- **Task 11 — Testing, QA & Final Documentation**: Full test pass (162 unit tests), linting, formatting, bundle optimization, and complete documentation.

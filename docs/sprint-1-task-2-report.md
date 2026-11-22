# Sprint 1 — Task 2 Report: Design Tokens & Global Styling

**Proyek**: Impact Furniture ERP v2  
**Role**: Senior Frontend Engineer, UI Architect, and Design System Engineer  
**Tanggal**: 31 Oktober 2026  
**Status**: SELESAI (Completed)

---

## 1. Summary

Task 2 berhasil membangun fondasi visual enterprise untuk Impact Furniture ERP v2 dengan pendekatan **Modern Enterprise ERP — Compact Light Theme**. Fondasi ini mempertahankan nuansa profesional dan alur kerja familiar dari sistem lama berbasis CodeIgniter 3, sambil meningkatkan ketajaman visual, konsistensi token, kepatuhan aksesibilitas (WCAG AA), dan kesiapan modular untuk Sprint berikutnya.

Seluruh styling dibangun murni menggunakan **Tailwind CSS v3** dan CSS custom properties standar, tanpa framework UI pihak ketiga (PrimeVue, Vuetify, Bootstrap, DaisyUI, dll. dilarang keras dan tidak digunakan).

---

## 2. Files Created

1. `app/src/assets/styles/tokens.css`: Definisi terpusat seluruh CSS custom properties (Brand, Neutral, Semantic, Interactive states, Typography scale, Spacing, Border radii, Shadows, Layout dimensions).
2. `app/src/assets/styles/base.css`: Styling global baseline untuk HTML/body, reset, tipografi heading, tabular numerals (`.tabular-nums`), focus-visible ring, form baseline native HTML, compact enterprise scrollbar, dan prefers-reduced-motion media query.
3. `app/src/modules/dev/pages/ThemePreviewPage.vue`: Halaman visual preview interaktif yang menyajikan 10 komponen fondasi visual design system.
4. `app/tests/unit/tokens/theme.spec.ts`: Unit test suite (9 test cases) yang menguji kelengkapan token, rendering halaman theme preview, dan isolasi rute dev-only.
5. `app/docs/sprint-1-task-2-report.md`: Laporan komprehensif implementasi dan verifikasi Task 2.

---

## 3. Files Modified

1. `app/src/assets/styles/main.css`: Menjadi entry point CSS global yang mengimpor `tokens.css` dan `base.css` sebelum direktif `@tailwind base; @tailwind components; @tailwind utilities;`.
2. `app/tailwind.config.js`: Dikonfigurasi ulang untuk memetakan seluruh token warna (`brand`, `navbar`, `neutral`, `semantic`), skala tipografi (`xs` s.d. `3xl`), radius (`sm` s.d. `xl`), utility tinggi komponen (`header`, `navbar`, `input`, `btn`, `table-row`), dan bayangan (`subtle`, `dropdown`, `modal`).
3. `app/src/shared/constants/tokens.ts`: Menyediakan konstanta TypeScript `DESIGN_TOKENS` bertipe ketat (`as const`) yang mencakup semua token desain untuk kebutuhan komputasi atau pengujian programatik.
4. `app/src/app/router/routes.ts`: Mengintegrasikan rute `/dev/theme-preview` secara kondisional hanya saat `import.meta.env.DEV` bernilai true, menjamin rute tidak ada pada hasil build production.
5. `app/docs/design-system.md`: Diperbarui secara lengkap dengan panduan filosofi desain, palet warna, skala tipografi, tabular numerals, spacing 4px, border radius, bayangan, layout dimensions, formulir baseline, dan aturan aksesibilitas.

---

## 4. Design Tokens Summary

| Kategori             | Token Utama                                                                                                                                  | Nilai                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Brand Colors**     | Brand Primary<br>Brand Primary Hover<br>Brand Primary Light<br>Navbar Background<br>Navbar Text<br>Navbar Muted                              | `#0F766E`<br>`#115E59`<br>`#F0FDFA`<br>`#34454F`<br>`#F8FAFC`<br>`#CBD5E1`                           |
| **Neutral Colors**   | Background<br>Surface<br>Surface Secondary<br>Border<br>Border Strong<br>Text Primary<br>Text Secondary<br>Text Muted                        | `#F5F7FA`<br>`#FFFFFF`<br>`#F8FAFC`<br>`#D9E0E7`<br>`#CBD5E1`<br>`#1F2937`<br>`#64748B`<br>`#94A3B8` |
| **Semantic Colors**  | Success (Solid / Tint)<br>Warning (Solid / Tint)<br>Danger (Solid / Tint)<br>Info (Solid / Tint)                                             | `#16A34A` / `#F0FDF4`<br>`#D97706` / `#FFFBEB`<br>`#DC2626` / `#FEF2F2`<br>`#2563EB` / `#EFF6FF`     |
| **Typography Scale** | xs (12px / 18px)<br>sm (13px / 20px)<br>base (14px / 22px)<br>lg (16px / 24px)<br>xl (20px / 28px)<br>2xl (24px / 32px)<br>3xl (30px / 38px) | Font Family: Inter, sans-serif<br>Tabular Numerals: `.tabular-nums`                                  |
| **Spacing Scale**    | Kelipatan 4px (1 s.d. 12)                                                                                                                    | 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px                                                   |
| **Border Radii**     | sm, md, lg, xl                                                                                                                               | 4px, 6px, 8px, 10px                                                                                  |
| **Shadows**          | subtle, dropdown, modal                                                                                                                      | Halus, terstandarisasi 3 tingkat elevasi                                                             |
| **Layout Baseline**  | Header: 44px<br>Navbar: 44px<br>Input/Button: 38px<br>Table Row: 42px                                                                        | Content padding: 24px, Card padding: 20px                                                            |

---

## 5. Theme Preview Verification

- **Route**: `/dev/theme-preview`
- **Tampilan Interaktif**:
  1. Header status pengembangan dengan badge `DEVELOPMENT ONLY`.
  2. Palet warna (Brand, Neutral, Semantic solid & tint) disertai kode hex dan token CSS.
  3. Skala tipografi lengkap dengan contoh teks dan demonstrasi perataan Tabular Numerals untuk data finansial/rupiah.
  4. Skala spacing 4px dengan batang visual representatif.
  5. Kotak perbandingan border radius (`sm: 4px`, `md: 6px`, `lg: 8px`, `xl: 10px`).
  6. Elevasi bayangan (`subtle`, `dropdown`, `modal`).
  7. Dimensi standar layout ERP.
  8. Baseline formulir HTML native (Default, Hover, Focus, Invalid dengan pesan error, Readonly, Disabled, Checkbox & Radio native).
  9. Badges status semantik transaksional (Selesai, Menunggu, Ditolak, Proses, Draft).
  10. Panduan pengujian responsif (375px, 768px, 1366px, 1920px).
- **Isolasi Lingkungan**:
  - Pada `npm run build`, rute `/dev/theme-preview` dan chunk `ThemePreviewPage.vue` secara otomatis tidak disertakan dalam bundle distribusi `dist/`.

---

## 6. Verification Results

Seluruh 5 perintah verifikasi dijalankan langsung dari folder `app/` dan berhasil 100%:

| Perintah               | Hasil                           | Keterangan                                                            |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `npm run typecheck`    | **PASS (0 errors)**             | `vue-tsc --noEmit` validasi TypeScript ketat (strict mode)            |
| `npm run lint`         | **PASS (0 warnings, 0 errors)** | `eslint .` sesuai standar ESLint 9                                    |
| `npm run format:check` | **PASS (100% matched)**         | `prettier --check .` seluruh file terformat rapi                      |
| `npm run test`         | **PASS (52/52 tests)**          | 14 test suites lulus, termasuk 9 unit tests baru pada `theme.spec.ts` |
| `npm run build`        | **PASS (0 errors)**             | Kompilasi Vite production sukses dalam 1.76s; chunk dev terisolasi    |

---

## 7. Known Issues

- **None**: Tidak ada blocker, lint warning, type error, atau visual mismatch.

---

## 8. Pending Items

- Tidak ada pending items untuk Task 2. Seluruh acceptance criteria telah terpenuhi.

---

## 9. Next Task Readiness

Fondasi visual telah lengkap, terpusat, teruji, dan terdokumentasi. Kode siap untuk dilanjutkan ke:

- **Sprint 1 — Task 3: Application Shell & Layout System** (membangun `AppLayout`, `AppHeader`, `AppNavbar` horizontal desktop-first, mobile drawer, dan breadcrumb terintegrasi).

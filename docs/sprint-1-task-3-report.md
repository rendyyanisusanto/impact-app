# Sprint 1 — Task 3 Report: Main Application Layout & Navigation

**Proyek**: Impact Furniture ERP v2  
**Role**: Senior Vue.js Engineer, Frontend Architect, and Enterprise UI/UX Engineer  
**Tanggal**: 31 Oktober 2026  
**Status**: SELESAI (Completed)

---

## A. Summary

Implementasi **Sprint 1 — Task 3: Main Application Layout & Navigation** telah berhasil diselesaikan secara menyeluruh.

Kerangka aplikasi ERP Impact Furniture v2 kini memiliki shell layout yang profesional, modular, responsif, dan mempertahankan alur kerja familiar dari sistem lama (PHP 5 / CodeIgniter 3). Navigasi horizontal desktop menyajikan seluruh 11 menu utama dengan dropdown submenu yang interaktif, didukung oleh breadcrumb dinamis, user profile menu dengan mock RBAC, page container yang ramah data padat, drawer navigasi mobile responsif, serta rute placeholder untuk seluruh submenu operasional.

Semua komponen visual dibangun murni menggunakan **Vue 3 Composition API (`<script setup lang="ts">`)**, **TypeScript strict mode**, dan **Tailwind CSS v3** dengan design tokens terpusat dari Task 2, tanpa framework UI pihak ketiga (PrimeVue, Vuetify, Bootstrap, DaisyUI, dll. dilarang keras dan tidak digunakan).

---

## B. Layout Components

1. **`AppLayout.vue`**: Shell aplikasi utama dengan susunan:
   - `<AppHeader>`: Header gelap (#34454F) dengan branding "IMPACT FURNITURE", identitas "Management System", tombol hamburger mobile, dan `<AppUserMenu>`.
   - `<AppNavbar>`: Bar navigasi horizontal desktop yang membungkus `<AppNavigationMenu>` (tersembunyi pada layar < 1024px).
   - `<AppMobileNavigation>`: Drawer samping responsif untuk layar tablet dan mobile.
   - `<AppBreadcrumb>`: Jejak navigasi dinamis berstandar aksesibilitas.
   - `<AppPageContainer>`: Kontainer konten fleksibel (max-w-[1920px]) untuk tabel transaksi lebar tanpa batasan sempit.
   - Global Footer & Teleported dialogs (`<AppToast>`, `<AppConfirmDialog>`).
2. **`AppHeader.vue`**: Header semantik berdimensi 44px dengan layout tokens Task 2.
3. **`AppNavbar.vue`**: Wrapper navigasi horizontal desktop dengan kontainer terpusat.
4. **`AppNavigationMenu.vue`**: Horizontal menu bar dengan indikator route aktif, dukungan click & hover debounced, serta proteksi overflow dropdown.
5. **`AppNavigationDropdown.vue`**: Komponen dropdown submenu berstandar disclosure navigation dengan keyboard support (Esc, Enter, Space, ArrowDown).
6. **`AppUserMenu.vue`**: Profil pengguna dengan avatar/inisial ('SA' untuk Superadmin), nama, role, link "Profil Saya" & "Pengaturan Akun", dan status logout mock yang disiapkan untuk Task 7.
7. **`AppBreadcrumb.vue`**: Breadcrumb otomatis berbasis rute aktif dengan semantic `<nav aria-label="Breadcrumb">` dan `aria-current="page"`.
8. **`AppPageContainer.vue`**: Kontainer halaman responsif dengan padding 24px desktop / 16px mobile.
9. **`AppMobileNavigation.vue`**: Dialog drawer mobile (`role="dialog"`, `aria-modal="true"`) dengan accordion submenu, backdrop click, Escape key listener, auto-focus, dan scroll lock body.
10. **`AuthLayout.vue`**: Layout autentikasi sederhana untuk halaman login.
11. **`ModulePlaceholderPage.vue`**: Halaman placeholder reusable untuk seluruh submenu dalam antrean rute.

---

## C. Navigation Structure

Seluruh 11 menu utama terdefinisi secara terpusat pada `src/app/navigation/navigation.config.ts` dengan urutan baku:

1. **Dashboard** (`/dashboard`)
2. **Pengadaan**:
   - Master Data Suplier (`/procurement/suppliers`)
   - Purchase Order (`/procurement/purchase-orders`)
   - Penerimaan Barang (`/procurement/goods-receipts`)
   - Pembayaran Tagihan (`/procurement/bill-payments`)
3. **Persediaan**:
   - Master Data Bahan (`/inventory/materials`)
   - Master Data Produk (`/inventory/products`)
   - Penyesuaian Stok Bahan (`/inventory/stock-adjustments`)
   - Mutasi Bahan (`/inventory/material-mutations`)
4. **Produksi**:
   - Proses Produksi (`/production/orders`)
   - Template Produk (BoM) (`/production/bom`)
5. **Penjualan**:
   - Master Data Customer (`/sales/customers`)
   - Sales Order (IMPACT) (`/sales/orders/impact`)
   - Sales Order (POLA) (`/sales/orders/pola`)
   - Sales Order (KS) (`/sales/orders/ks`)
   - Pembayaran Invoice (`/sales/invoice-payments`)
   - Pemasukan Lain (`/sales/other-income`)
6. **Pengiriman**:
   - Form Surat Jalan (`/delivery/notes`)
7. **Keuangan**:
   - Chart Of Account (`/accounting/chart-of-accounts`)
   - Pemasukan Lain (`/accounting/other-income`)
   - Pengeluaran Lain (`/accounting/other-expenses`)
   - Jurnal Umum (`/accounting/general-journal`)
8. **Laporan**:
   - Pembelian (`/reporting/purchases`)
   - Penjualan (`/reporting/sales`)
   - Laporan Per Produk (`/reporting/per-product`)
   - Laporan Per Customer (`/reporting/per-customer`)
   - Penjualan per Customer & Produk (`/reporting/sales-by-customer-product`)
   - Kartu Stok (`/reporting/stock-card`)
   - Laporan Mutasi Stok (`/reporting/stock-mutations`)
   - Laporan Stok Bahan (`/reporting/material-stock`)
   - Jurnal Harian (`/reporting/daily-journal`)
   - Neraca (`/reporting/balance-sheet`)
   - Laba Rugi (`/reporting/income-statement`)
   - Buku Besar (`/reporting/general-ledger`)
   - Statistic Sales (`/reporting/statistic-sales`)
   - Statistic Customer (`/reporting/statistic-customer`)
   - Statistic Driver (`/reporting/statistic-driver`)
9. **HR**:
   - Master Data Karyawan (`/hr/employees`)
   - Master Data Grup Karyawan (`/hr/employee-groups`)
   - Setting Jadwal (`/hr/schedules`)
   - Setting Hari Libur (`/hr/holidays`)
   - Presensi (`/hr/attendance`)
10. **Setting**:
    - Master Data Bank (`/settings/banks`)
    - Master Data Gudang (`/settings/warehouses`)
    - Master Data Jabatan (`/settings/positions`)
    - Master Data Status Karyawan (`/settings/employee-statuses`)
    - Master Data Kategori Bahan (`/settings/material-categories`)
    - Master Data Kategori Barang/Produk (`/settings/product-categories`)
    - Master Data Satuan Bahan (`/settings/material-units`)
    - Master Data Satuan Produk (`/settings/product-units`)
    - Master Data PPN (`/settings/tax`)
    - Setting Aplikasi (`/settings/app`)
11. **System Setting**:
    - Master Data Groups (Role) (`/system/groups`)
    - Master Data User (`/system/users`)
    - Setting Status (`/system/status`)
    - Import Data (`/system/import`)
    - Edit Akun (`/system/edit-account`)

_Semua ID dan nama rute dijamin unik secara global._

---

## D. Route Mapping

- Seluruh 48+ rute submenu terpetakan di `src/app/router/routes.ts` sebagai child routes dari `AppLayout.vue`.
- Halaman belum berfitur bisnis mengarah ke `ModulePlaceholderPage.vue` secara lazy-loaded.
- Rute dev `/dev/theme-preview` dilindungi flag `import.meta.env.DEV` dan terbukti tereliminasi saat build production.
- Rute catch-all `/:pathMatch(.*)*` mengarahkan rute yang tidak terdaftar ke `NotFoundPage.vue`.

---

## E. Responsive Behavior

- **Desktop (1024px – 1920px)**:
  - Header ramping 44px dengan user profile.
  - Navigasi horizontal penuh dengan dropdown multi-kolom. Dropdown di tepi kanan layar otomatis disejajarkan ke kanan (`right-0`) agar tidak memotong viewport.
  - Page container memanfaatkan lebar layar maksimal 1920px dengan padding horizontal 24px (`px-6`).
  - Tidak ada sidebar permanen pada desktop.
- **Tablet (768px – 1023px)**:
  - Navigasi horizontal disembunyikan; tombol hamburger di header membuka drawer mobile.
- **Mobile (375px – 767px)**:
  - Header ringkas dengan logo dan inisial avatar.
  - Drawer navigasi vertikal bersistem accordion yang otomatis membuka modul yang sedang aktif.
  - Backdrop blur menutup layar di belakang drawer.
  - Drawer otomatis tertutup saat link dipilih, tombol tutup diklik, backdrop diklik, atau tombol Escape ditekan.

---

## F. Accessibility & Keyboard Navigation

- **WAI-ARIA Attributes**:
  - `<nav aria-label="Navigasi Horizontal Utama">` dan `<nav aria-label="Navigasi Utama">`.
  - `<nav aria-label="Breadcrumb">` dengan `aria-current="page"` pada halaman saat ini.
  - `button[aria-expanded="..."][aria-haspopup="true"]` pada trigger dropdown.
  - `role="dialog"` dan `aria-modal="true"` pada mobile drawer.
- **Keyboard Navigation**:
  - `Escape`: Menutup dropdown yang sedang aktif dan mengembalikan fokus ke tombol trigger. Menutup drawer mobile jika sedang terbuka.
  - `Enter` / `Space` / `ArrowDown`: Membuka dropdown navigasi.
  - `Tab` / `Shift+Tab`: Melewati menu navigasi secara sekuensial dengan `:focus-visible` ring kontras tinggi.
- **Body Scroll Lock**: Saat drawer mobile terbuka, `document.body.style.overflow = 'hidden'` mencegah scrolling latar belakang secara tidak disengaja.

---

## G. Verification Results

Seluruh 5 perintah verifikasi dijalankan langsung dari folder `app/` dan lulus 100%:

| Perintah               | Hasil                           | Keterangan                                                                 |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `npm run typecheck`    | **PASS (0 errors)**             | `vue-tsc --noEmit` validasi TypeScript ketat (strict mode)                 |
| `npm run lint`         | **PASS (0 warnings, 0 errors)** | `eslint .` sesuai standar ESLint 9 tanpa pelanggaran `any`                 |
| `npm run format:check` | **PASS (100% clean)**           | Prettier code style terverifikasi di seluruh file                          |
| `npm run test`         | **PASS (65/65 tests)**          | 16 test suites lulus (termasuk 13 unit tests baru untuk layout & navigasi) |
| `npm run build`        | **PASS (0 errors)**             | Kompilasi Vite production sukses dalam 3.69s; bundle teroptimasi           |

---

## H. Known Issues

- **None**: Tidak ada blocker, lint warning, type error, atau visual mismatch.

---

## I. Next Task Readiness

Kerangka layout utama dan sistem navigasi horizontal telah selesai, stabil, dan teruji. Sistem siap dilanjutkan ke:

- **Sprint 1 — Task 4: Common Reusable UI Components** (membangun `AppButton`, `AppInput`, `AppSelect`, `AppCheckbox`, `AppRadio`, `AppCard`, `AppBadge`, `AppAlert`, dll. sesuai spesifikasi design tokens Task 2).

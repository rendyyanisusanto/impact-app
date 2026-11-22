# Arsitektur Frontend — Impact Furniture v2

Dokumen ini menjelaskan prinsip rekayasa perangkat lunak, pola arsitektur, dan struktur modular yang diterapkan pada frontend **Impact Furniture ERP v2**.

---

## 1. Prinsip Desain & Rekayasa

Pengembangan frontend ini berlandaskan pada prinsip arsitektur tingkat enterprise:

1. **Feature-Based Modular Architecture**: Kode dikelompokkan berdasarkan domain bisnis (`modules/`), bukan mencampurkan seluruh halaman dalam folder tunggal.
2. **Single Responsibility Principle (SRP)**: Setiap komponen, service, dan composable hanya menangani satu tanggung jawab jelas.
3. **Decoupled Service Layer**: Komponen UI tidak pernah memanggil mock data secara langsung. Seluruh interaksi data melewati service layer (`SupplierService`, `AuthService`) yang mengembalikan interface standar `ApiResponse<T>`. Pola ini memungkinkan migrasi tanpa friksi ke adapter HTTP NestJS di fase backend.
4. **Zero-UI-Framework Policy**: Komponen visual murni dibangun dengan Vue 3 Composition API dan Tailwind CSS, memberikan kendali penuh terhadap performa, bundle size, dan kebebasan kustomisasi.
5. **Strict Type Safety**: TypeScript strict mode diaktifkan di seluruh level konfigurasi tanpa penggunaan `any`.

---

## 2. Pola Lapisan Arsitektur (Layering Pattern)

```text
┌─────────────────────────────────────────────────────────┐
│                      Presentation                       │
│    AppLayout, AuthLayout, DashboardView, ShowcaseView   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Shared UI Layer                      │
│   AppDataTable, AppButton, AppInput, AppModal, etc.     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   State & Composables                   │
│   auth.store, ui.store, useToast, useConfirm, etc.      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Service Abstraction                  │
│       supplierService, authService (Contracts)         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│             Mock Adapter / Future HTTP Client           │
│      simulateApiCall(data)  ==>  Axios / Fetch API      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Autentikasi Mock & Otorisasi RBAC

Sprint 1 mengimplementasikan mock role-based access control (RBAC) yang memetakan otorisasi lama:

- **Struktur Perizinan**: Berbasis string hierarkis dot-notation (contoh: `sales.*`, `inventory.*`, `dashboard:read`).
- **Superadmin Bypass**: Pengguna dengan role `superadmin` atau token perizinan `*` memiliki akses penuh ke seluruh 11 modul ERP.
- **Testing Personas**: Disimulasikan melalui `src/mocks/users.mock.ts`:
  - `superadmin`: Akses ke seluruh 11 modul (`*`).
  - `sales_staff`: Akses modul Penjualan (`sales.*`, `report.sales:read`, `dashboard:read`).
  - `warehouse_staff`: Akses modul Persediaan dan Pengiriman (`inventory.*`, `delivery.*`, `dashboard:read`).
- **Route Guard**: File `src/app/router/guards.ts` memverifikasi status autentikasi dan RBAC. Pengguna tanpa izin diarahkan ke halaman 403 (`/unauthorized`) dengan pencegahan loop pengalihan tak terbatas.
- **Open Redirect Defense**: Utility `isValidReturnUrl` memastikan redirect URL login hanya berupa path relatif aman (`/`) dan menolak manipulasi domain eksternal.
- **Navigation Pruning**: Composable `usePermissions()` dan fungsi `filterNavigationByPermissions()` menyaring pohon menu navigasi secara reaktif.

---

## 4. Pola Navigasi Desktop & Responsivitas

- **Desktop Navigasi Horizontal**: Sesuai dengan alur kerja pengguna sistem lama, sistem menggunakan navbar horizontal gelap (`#34454F`) dengan dropdown bertingkat untuk 11 modul utama.
- **Mobile Drawer**: Pada layar mobile (`< 1024px`), sistem bertransisi ke accordion drawer tanpa merusak hierarki atau urutan 11 modul.
- **Breadcrumb Dinamis**: `AppBreadcrumb.vue` pada header membaca rantai `route.matched` untuk menghasilkan jejak breadcrumb yang konsisten dan akurat.

---

## 5. Mock Service Infrastructure

Setiap panggilan data dibungkus dalam service interface yang diabstraksikan melalui `createService`:

- **Service Factory (`src/shared/services/service-factory.ts`)**: Mengatur resolusi runtime antara mock adapter dan HTTP adapter berdasarkan variabel `VITE_USE_MOCK`.
- **Fail-Fast Error**: Jika mock dimatikan tanpa adapter HTTP, sistem melempar `ServiceConfigurationError` untuk mencegah fallback diam-diam ke data mock di lingkungan produksi.
- **Standardized Response Envelope**: Mendukung paginasi (`PaginatedResponse<T>`), sorting, dan normalisasi galat (`ApiError` dengan `ApiErrorCode`).
- **Simulasi Latensi**: Helper `mockDelay` menyimulasikan latency jaringan riil (0ms otomatis pada mode test).

---

## 6. Dashboard Skeleton Modularity

Modul dashboard (`src/modules/dashboard/`) dipecah menjadi komponen modular:

- `DashboardFilters.vue`: Area filter periode preset dan tombol segarkan.
- `DashboardKpiCard.vue`: Kartu metrik dengan status loading skeleton dan label "Mock" eksplisit.
- `DashboardChartPlaceholder.vue`: Kerangka visual grafik SVG/CSS tanpa dependensi library eksternal.
- `DashboardWidgetPlaceholder.vue`: Widget operasional (Transaksi Terakhir, Top Spender, Peringatan Stok Limit).
- `DashboardPage.vue`: Halaman utama pengatur tata letak responsif desktop, tablet, dan mobile.

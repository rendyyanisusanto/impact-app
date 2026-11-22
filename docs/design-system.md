# Impact Furniture v2 — Design System & Global Styling

Dokumentasi resmi Design System untuk **Impact Furniture ERP v2**, remake modern dari sistem lama berbasis PHP 5 & CodeIgniter 3.

**Prinsip Utama**: _Familiar in workflow, modern in appearance, professional in execution._

---

## 1. Design Philosophy

**Modern Enterprise ERP — Compact Light Theme**

Sistem dirancang untuk menunjang operasional perusahaan furniture dengan volume data tinggi (persediaan kayu, SPK produksi, pesanan penjualan, pengadaan, dan akuntansi finansial).

### Karakteristik Desain:

- **Clean & Professional**: Tampilan bersih tanpa ornamen dekoratif non-fungsional.
- **Information-Dense**: Mengoptimalkan luas layar desktop untuk menampilkan tabel multi-kolom dan ringkasan metrik.
- **Desktop-First & Responsive**: Dirancang optimal untuk monitor desktop kerja (1366px - 1920px), namun tetap fleksibel dan adaptif pada tablet (768px) dan mobile (375px).
- **Accessible (A11y)**: Memenuhi rasio kontras WCAG AA, navigasi keyboard `:focus-visible`, dukungan `prefers-reduced-motion`, dan angka tabular (`tabular-nums`).
- **No Heavy Effects**: Menghindari glassmorphism, warna neon, gradien mencolok, dan shadow berlebihan yang membebani mata pengguna kerja harian.

---

## 2. Color System

Semua warna didefinisikan secara terpusat di `tokens.css` dan dikonfigurasikan pada `tailwind.config.js`.

### 2.1 Brand & Navigation Colors

| Token Name              | Hex Code  | CSS Variable                  | Tailwind Class                       | Penggunaan                          |
| ----------------------- | --------- | ----------------------------- | ------------------------------------ | ----------------------------------- |
| **Brand Primary**       | `#0F766E` | `--color-brand-primary`       | `bg-brand-primary` / `bg-primary`    | Tombol utama, tab aktif, ring focus |
| **Brand Primary Hover** | `#115E59` | `--color-brand-primary-hover` | `hover:bg-primary-hover`             | State hover aksi utama              |
| **Brand Primary Light** | `#F0FDFA` | `--color-brand-primary-light` | `bg-primary-light` / `bg-primary-50` | Latar item terseleksi, badge        |
| **Navbar Background**   | `#34454F` | `--color-navbar-bg`           | `bg-navbar-dark` / `bg-navbar-bg`    | Header & menu navigasi atas         |
| **Navbar Text**         | `#F8FAFC` | `--color-navbar-text`         | `text-navbar-text`                   | Label menu navigasi utama           |
| **Navbar Muted**        | `#CBD5E1` | `--color-navbar-muted`        | `text-navbar-muted`                  | Ikon & deskripsi navigasi           |
| **Navbar Hover**        | `#3E525E` | `--color-navbar-hover`        | `hover:bg-navbar-hover`              | State hover menu navigasi           |

### 2.2 Neutral Colors

| Token Name            | Hex Code  | CSS Variable                | Tailwind Class           | Penggunaan                                |
| --------------------- | --------- | --------------------------- | ------------------------ | ----------------------------------------- |
| **Background**        | `#F5F7FA` | `--color-background`        | `bg-background`          | Kanvas latar belakang halaman             |
| **Surface**           | `#FFFFFF` | `--color-surface`           | `bg-surface`             | Latar kartu, modal, popover, formulir     |
| **Surface Secondary** | `#F8FAFC` | `--color-surface-secondary` | `bg-surface-secondary`   | Header tabel, toolbar filter, card nested |
| **Border**            | `#D9E0E7` | `--color-border`            | `border-border`          | Garis batas input, card, pemisah tabel    |
| **Border Strong**     | `#CBD5E1` | `--color-border-strong`     | `border-border-strong`   | Garis batas aktif, pembatas kolom         |
| **Text Primary**      | `#1F2937` | `--color-text-primary`      | `text-content-primary`   | Teks utama, judul, data transaksi         |
| **Text Secondary**    | `#64748B` | `--color-text-secondary`    | `text-content-secondary` | Label form, deskripsi kolom, sub-header   |
| **Text Muted**        | `#94A3B8` | `--color-text-muted`        | `text-content-muted`     | Placeholder, state disabled, timestamp    |

### 2.3 Semantic Colors

| Token Name  | Solid Hex | Tint Latar | CSS Variable                             | Penggunaan                                  |
| ----------- | --------- | ---------- | ---------------------------------------- | ------------------------------------------- |
| **Success** | `#16A34A` | `#F0FDF4`  | `--color-success` / `--color-success-bg` | Transaksi selesai, approved, stok aman      |
| **Warning** | `#D97706` | `#FFFBEB`  | `--color-warning` / `--color-warning-bg` | Menunggu approval, stok minimum             |
| **Danger**  | `#DC2626` | `#FEF2F2`  | `--color-danger` / `--color-danger-bg`   | Dibatalkan, error validasi, stok kritis     |
| **Info**    | `#2563EB` | `#EFF6FF`  | `--color-info` / `--color-info-bg`       | Dalam proses produksi, informasi pengiriman |

### 2.4 Interactive States

- **Hover**: Menggelapkan warna latar utama satu tingkat (cth: `#0F766E` -> `#115E59`).
- **Active / Pressed**: `#0D6760`.
- **Focus**: Focus ring dengan kontras tinggi (`outline: 2px solid #0F766E` dengan offset `2px`).
- **Disabled**: Latar `#F1F5F9`, border `#E2E8F0`, teks `#94A3B8`, kursor `not-allowed`.
- **Read-only**: Latar `#F8FAFC`, border `#D9E0E7`, kursor `default`.
- **Invalid**: Border `#DC2626`, latar `#FEF2F2`, focus ring `rgba(220, 38, 38, 0.25)`.

---

## 3. Typography System

- **Font Family**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Skala Tipografi

| Token  | Size | Line Height | Weight    | Penggunaan ERP                                 |
| ------ | ---- | ----------- | --------- | ---------------------------------------------- |
| `xs`   | 12px | 18px        | 400 / 500 | Caption, helper text, breadcrumb, micro-badges |
| `sm`   | 13px | 20px        | 500 / 600 | Label formulir, sel data tabel, tombol kecil   |
| `base` | 14px | 22px        | 400 / 500 | Body teks default, input teks, isi modal       |
| `lg`   | 16px | 24px        | 600       | Judul kartu, sub-bagian formulir, modal header |
| `xl`   | 20px | 28px        | 600       | Judul halaman sub-modul, header drawer         |
| `2xl`  | 24px | 32px        | 700       | Judul utama modul ERP, heading dashboard       |
| `3xl`  | 30px | 38px        | 700       | Indikator KPI finansial, metrik agregat utama  |

### Aturan Tipografi ERP:

1. **Body Default**: 14px / 22px (`text-base`).
2. **Dense Data Cells**: 13px / 20px (`text-sm`).
3. **Tabular Numerals**: Sel tabel finansial dan nominal menggunakan class `.tabular-nums` (`font-variant-numeric: tabular-nums`) dengan text align ke kanan (`text-right`).
4. **Contrast Compliance**: Teks body memenuhi rasio kontras minimal 4.5:1 terhadap latar belakang.

---

## 4. Spacing System (4px Baseline)

Sistem kelipatan 4px menjamin konsistensi ritme visual vertikal dan horizontal:

| Token | Ukuran | Penggunaan Tipikal ERP                                            |
| ----- | ------ | ----------------------------------------------------------------- |
| `1`   | 4px    | Jarak mikro, jarak ikon ke teks                                   |
| `2`   | 8px    | Padding badge, jarak antar input rapat                            |
| `3`   | 12px   | Padding horizontal input, gutter kompak                           |
| `4`   | 16px   | Jarak antar form field, padding kartu mobile                      |
| `5`   | 20px   | Padding kartu desktop standar (`--layout-card-padding`)           |
| `6`   | 24px   | Padding halaman desktop (`--layout-content-padding`), section gap |
| `8`   | 32px   | Pemisah antar grup modul utama                                    |
| `10`  | 40px   | Spacing section layout besar                                      |
| `12`  | 48px   | Margin kontainer                                                  |

---

## 5. Border Radius Tokens

| Token       | Ukuran | CSS Variable  | Tailwind Class                 | Komponen Target                       |
| ----------- | ------ | ------------- | ------------------------------ | ------------------------------------- |
| `radius-sm` | 4px    | `--radius-sm` | `rounded-sm`                   | Badges, status pill kecil, checkbox   |
| `radius-md` | 6px    | `--radius-md` | `rounded-md` / `rounded-input` | Input text, select, button, textarea  |
| `radius-lg` | 8px    | `--radius-lg` | `rounded-lg` / `rounded-card`  | Kartu konten, dropdown menu container |
| `radius-xl` | 10px   | `--radius-xl` | `rounded-xl` / `rounded-modal` | Modal dialog, konfirmasi popover      |

_Catatan_: Hindari radius di atas 10px pada elemen fungsional inti agar mempertahankan kesan antarmuka profesional dan terstruktur.

---

## 6. Shadow System (Elevations)

Tiga tingkatan elevasi halus yang tidak mendominasi visual:

- **Shadow Subtle**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (`shadow-subtle`) — Kartu dan tabel data.
- **Shadow Dropdown**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)` (`shadow-dropdown`) — Menu navigasi melayang, autocomplete.
- **Shadow Modal**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)` (`shadow-modal`) — Dialog modal, drawer samping.

---

## 7. ERP Layout Dimensions

Baseline dimensi vertikal dan horizontal terstandarisasi untuk konsistensi seluruh modul:

- **Header Height**: `44px` (`--layout-header-height` / `h-header`)
- **Navigation Height**: `44px` (`--layout-nav-height` / `h-navbar`)
- **Content Padding**: `24px` (`--layout-content-padding`)
- **Card Padding**: `20px` (`--layout-card-padding`)
- **Input Height**: `38px` (`--layout-input-height` / `h-input`)
- **Button Height**: `38px` (`--layout-button-height` / `h-btn`)
- **Table Row Height**: `42px` (`--layout-table-row-height` / `h-table-row`)

---

## 8. Form Visual Baseline

Styling elemen formulir HTML native diterapkan secara global melalui `base.css`:

```css
input[type='text'],
select,
textarea {
  font-family: inherit;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}
```

### Visual States:

- **Hover**: Border berubah menjadi `var(--color-border-strong)`.
- **Focus**: Border `var(--color-brand-primary)` + Focus Ring `var(--focus-ring)`.
- **Invalid**: Selektor `[aria-invalid='true']` menghasilkan border merah `#DC2626` dan latar lembut `#FEF2F2`.
- **Disabled**: Latar `#F1F5F9`, border `#E2E8F0`, kursor `not-allowed`.
- **Readonly**: Latar `#F8FAFC`, border `#D9E0E7`.

---

## 9. Focus, Accessibility & Scrollbars

- **Keyboard Focus Ring**: `:focus-visible` memiliki ring tebal 2px dengan kontras tinggi (`outline: 2px solid var(--color-brand-primary); outline-offset: 2px;`).
- **Motion Reduction**: `@media (prefers-reduced-motion: reduce)` menonaktifkan seluruh animasi transisi untuk kenyamanan pengguna yang sensitif terhadap gerakan.
- **Compact Scrollbar**: Lebar scrollbar 6px dengan thumb berwarna netral `#CBD5E1` dan latar `#F8FAFC`, tidak menutupi informasi dalam tabel data lebar.

---

## 10. Responsive Breakpoint Guidelines

- **Mobile (375px)**: Form stack 1 kolom, padding 12–16px, tabel dapat digeser horizontal dengan kolom aksi tetap terbaca.
- **Tablet (768px)**: Form 2 kolom proporsional, navbar berganti ke drawer responsif.
- **Desktop (1366px)**: Baseline kerja utama ERP; compact layout, informasi padat tanpa scroll vertikal berlebihan.
- **Wide Screen (1920px)**: Grid multi-kolom luas dengan pembatasan kontainer agar teks tetap nyaman dibaca.

---

## 11. Theme Preview (Development Only)

Halaman tinjauan visual interaktif tersedia khusus selama mode pengembangan:

- **URL**: `http://localhost:3000/dev/theme-preview`
- **Isi**: Preview lengkap seluruh palet warna (brand, neutral, semantic), skala tipografi dengan demonstrasi tabular numerals, penggaris spacing 4px, kotak border radius, level bayangan, state formulir interaktif, status badges, hierarki surface, dan panduan breakpoint.
- **Isolasi Rute**: Rute ini dibungkus dengan pengecekan `import.meta.env.DEV`, sehingga otomatis tereliminasi (tree-shaken) dari artefak kompilasi production (`npm run build`).

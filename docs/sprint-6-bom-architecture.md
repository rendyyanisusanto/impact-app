# Sprint 6 — Bill of Materials (BoM) Architecture

## 1. Overview & Architecture Design

Fitur Bill of Materials (BoM) / Template Produk pada Impact Furniture v2 dirancang mengikuti standar enterprise ERP Manufacturing dengan arsitektur decoupled frontend-first:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Enterprise Navbar #34454F                       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴──────────────────────────────┐
    ▼                                                              ▼
[BomListPage.vue]                                          [BomDetailPage.vue]
  - DataTable Server-side like                               - Header Specification
  - KPI Metrics                                               - Tab Resep Komposisi
  - Realtime Search & Filter                                  - Simulasi Kebutuhan (MRP Preview)
  - Duplicate, Export PDF/Excel, Print                        - Action Duplicate & PDF
    │                                                              ▲
    └─────────────────┬────────────────────────────┐               │
                      ▼                            ▼               │
             [BomCreatePage.vue]           [BomEditPage.vue]───────┘
               - Full Page View              - Full Page View
               - Product Selector            - Dirty Tracking
               - Spreadsheet Grid            - Spreadsheet Grid
               - Live Total Bar              - Live Total Bar
```

---

## 2. Component Hierarchy

1. **`BomListPage.vue`**: Halaman utama data list template BoM dengan KPI header (Total Template, Produk Memiliki BoM, Rata-rata Bahan per BoM, Rata-rata Est. Biaya per Unit), filter pencarian multi-field, filter produk furniture, filter status template, serta aksi Duplikasi dan Hapus/Nonaktifkan.
2. **`BomCreatePage.vue`**: Halaman form pembuatan BoM baru (Full Page, bukan modal), pemilihan produk furniture target, input nama resep, status aktif, desktop spreadsheet editor, serta **Sticky Bottom Bar** dengan live total indicator tepat di samping tombol "Batalkan".
3. **`BomEditPage.vue`**: Halaman pengubahan BoM (Full Page, bukan modal), pemuatan otomatis rincian komposisi ke dalam spreadsheet, pelacakan dirty state dengan konfirmasi pembatalan.
4. **`BomDetailPage.vue`**: Halaman dokumen spesifikasi resep read-only dengan integrasi simulasi kebutuhan material per target produksi, cetak format dokumen standar manufaktur, dan duplikasi resep.
5. **`BomSpreadsheet.vue`**: Komponen reusable spreadsheet grid dengan navigasi keyboard, double-click material picker, input kuantitas numerik desimal, format mata uang dinamis, dan kalkulasi subtotal.
6. **`BomMaterialPicker.vue`**: Modal pemilihan bahan baku dari Master Data Bahan dengan pencarian instan, paginasi, informasi stok gudang, dan keyboard navigation (Enter / Escape / Double click).
7. **`BomMaterialRequirements.vue`**: Komponen simulator kebutuhan bahan baku interaktif (MRP Preview) berbasis target kuantitas produksi dengan indikator ketersediaan stok riil gudang (CUKUP / KURANG).

---

## 3. Scope Boundary Enforcement

- **TIDAK ADA Import Excel**: Sesuai arahan teknis sistem manufaktur, import template BoM tidak diaktifkan pada UI BoM untuk menjamin integritas resep produk.
- **Master Data Only**: Seluruh manipulasi data BoM sama sekali tidak memicu mutasi stok (`stockPostingService` tidak dipanggil, `master_data_bahan.qty` tidak diubah).

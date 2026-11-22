# Sprint 6 — Production (Produksi) Architecture

## 1. Executive Summary

Modul Transaksi Produksi (Sprint 6 Fitur 2: Task 7–12) dibangun untuk mengelola siklus produksi furniture dari penerbitan SPK, alokasi produk jadi, pelacakan status lantai produksi, hingga penyelesaian transaksi dan pemutakhiran kartu stok.

Arsitektur modul ini memisahkan:

1. **Presentation Layer**: Spreadsheet input full-width yang mematuhi UX legacy, product modal picker dengan navigasi keyboard, read-only preview MRP / kebutuhan bahan baku, serta print preview SPK resmi.
2. **State & Orchestration Layer**: Composable `useProductionForm` yang mengisolasi draft spreadsheet, tracking dirty state, dan kalkulasi dinamis tanpa re-render berlebih.
3. **Domain & Calculation Layer**: Pure TypeScript functions untuk validasi nomor, penomoran urut otomatis, penjumlahan kuantitas agregat, dan agregasi kebutuhan bahan baku dari template BoM.
4. **Service Boundary Layer**: `production.service.ts` yang menangani operasi CRUD atomik, resolusi master data produk dan BoM, posting stok masuk barang jadi, posting pemakaian bahan baku, pencegahan double-posting (idempotency), dan transactional rollback/reversal pada pembatalan.

---

## 2. Component Hierarchy & Data Flow

```
ProductionListPage.vue
├── AppHeader / AppPageHeader
├── KPI Summary Cards (Total Transaksi, Pending, Dalam Proses, Selesai)
├── Filter Toolbar (Search, Tanggal, Jenis, Status, Export PDF/Excel, Refresh)
├── AppDataTable
│   ├── Selection Checkboxes
│   ├── Production Rows (No SPK, Tanggal, Jenis, Status, Jml Jenis Produk, Total Qty, Keterangan)
│   └── Row Action Menu (Lihat Detail, Ubah Data, Cetak SPK, Batalkan)
├── AppConfirmDialog (Konfirmasi Pembatalan Dokumen / Reversal Stok)
└── AppTableSkeleton / AppEmptyState

ProductionCreatePage.vue / ProductionEditPage.vue
├── Header Action Bar (Back Button, Page Title, Action Buttons)
├── Production Information Card (Form Header)
│   ├── No Produksi (Input + Generate Auto Code Button)
│   ├── Jenis Produksi (Dropdown: Non Pesanan [Stok] / Pesanan [SO])
│   ├── Tanggal (Date Picker)
│   ├── Status Produksi (Select: Pending / Proses / Selesai)
│   └── Keterangan (Textarea)
├── Production Spreadsheet Card (Detail Barang Jadi)
│   ├── Toolbar (Tambah Baris, Hapus Baris, Reset Baris Kosong)
│   └── ProductionSpreadsheet.vue (Gridlines, Keyboard Navigation, Inline Validation)
│       └── ProductionProductPicker.vue (Searchable Modal, Arrow Keys, Enter/Escape)
├── ProductionMaterialRequirements.vue (Read-only BoM Preview Panel & Stock Sufficiency)
└── Sticky Bottom Action Bar (Kuantitas Total, Jumlah Jenis Produk, Simpan, Batal)

ProductionDetailPage.vue
├── Header Bar (Status Badges, Back, Edit, Print SPK, Cancel/Void)
├── Workflow Status Progression Bar (Pending -> Proses -> Selesai)
├── Header Summary Cards
├── Detail Produk Table (Read-only)
├── Alokasi Kebutuhan Bahan Baku (BoM Preview / Pemakaian Riil)
├── Audit Log & Timestamps (Dibuat, Diperbarui, Status Posting)
└── ProductionPrintDocument.vue (Hidden from screen, active during window.print())
```

---

## 3. Layer Separation & Responsibilities

### 3.1 Domain Types (`production.types.ts`)

- **Entities**: `Produksi`, `DetailProduksiProduk`, `DetailBahanProduksi`, `KartuStokProduk`.
- **Enums**:
  - `JENIS_PRODUKSI`: `1` (Pesanan), `0` (Non Pesanan / Stok).
  - `STATUS_PRODUKSI`: `0` (Pending), `1` (Proses), `2` (Selesai).
  - `DOKUMEN_STATUS`: `0` (Draft / Belum Diposting), `1` (Posted / Selesai).
- **ViewModels**: `ProductionListItem`, `ProductionProductRow`, `CalculatedMaterialRequirement`, `SelectableProduct`.

### 3.2 Utilities (`production-calculations.ts` & `production-validation.ts`)

- **Auto-number Generator**: Menghasilkan kode sesuai formula legacy `PD{month}{year}-{last_number}`.
- **Aggregators**: Menghitung total variasi produk unik dan total akumulasi kuantitas unit.
- **BoM Resolver**: Mengalikan rasio pemakaian bahan baku per unit dari `bomService` dengan `qty` produk untuk memproyeksikan kebutuhan total material pabrik.
- **Validators**: Menjamin nomor SPK terisi dan unik, tanggal valid, jenis terpilih, dan minimal ada 1 baris produk dengan kuantitas integer positif.

### 3.3 State Management (`useProductionForm.ts`)

- Menyediakan inisialisasi 10 baris kosong saat create sesuai screenshot legacy.
- Membuka Product Picker modal saat cell nama produk di-double-click atau ditekan Enter.
- Mengatur keyboard shortcut (Arrow Keys, Tab, Enter, Backspace) untuk pengalaman spreadsheet desktop modern.
- Menghitung kalkulasi live requirement bahan secara reaktif saat `qty` produk diubah.

### 3.4 Service Boundary (`production.service.ts`)

- Berperan sebagai Single Source of Truth untuk data transaksi produksi.
- Berinteraksi dengan `productService` untuk validasi produk dan mutasi stok barang jadi (`kartu_stok_produk`).
- Berinteraksi dengan `materialService` untuk mutasi stok bahan baku (`histori_stok_bahan`).
- Menyediakan proteksi idempotensi: transaksi yang sudah berstatus `Selesai` atau `Posted` tidak dapat di-posting ulang ganda.
- Menyediakan rollback atomik: pembatalan transaksi berstatus `Selesai` membalikkan stok barang jadi (keluar) dan memulihkan saldo bahan baku (masuk).

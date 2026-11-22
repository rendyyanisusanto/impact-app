# Sprint 5 — Fitur 2: Penyesuaian Stok Bahan Architecture & UI Guide

## 1. Arsitektur Komponen & Halaman

Fitur Penyesuaian Stok Bahan dibangun dengan arsitektur halaman penuh (full-page CRUD) dan Spreadsheet UI interaktif:

```
src/modules/inventory/stock-adjustments/
├── components/
│   ├── StockAdjustmentStatusBadge.vue     # Badge visual status (Selesai/Posted vs Draft)
│   ├── StockAdjustmentMaterialPicker.vue  # Modal picker bahan baku dengan keyboard shortcut & balance
│   └── StockAdjustmentSpreadsheet.vue     # Grid desktop-style spreadsheet dengan live calculation
├── mocks/
│   └── stock-adjustments.mock.ts          # Fixtures mock data awal
├── pages/
│   ├── StockAdjustmentListPage.vue        # List view, KPI metrics, filter, data table, export
│   ├── StockAdjustmentCreatePage.vue      # Form tambah data halaman penuh & sticky bottom action bar
│   ├── StockAdjustmentEditPage.vue        # Form edit data halaman penuh dengan audit warning
│   └── StockAdjustmentDetailPage.vue      # View dokumen read-only, KPI selisih, dan cetak PDF
├── services/
│   └── stock-adjustment.service.ts        # Typed business logic service, atomic posting & rollback
├── types/
│   └── stock-adjustment.types.ts          # Domain interfaces & payload definitions
└── utils/
    └── stock-adjustment-export.ts         # PDF generation (3 tanda tangan) & print handling
```

---

## 2. Spreadsheet Editor & Fitur Interaksi

Spreadsheet editor mengadopsi pengalaman input desktop legacy dengan kecepatan tinggi:

1. **Double-Click Selector**:
   - Double-click pada kolom **Kode Bahan** atau **Nama Bahan Baku** akan membuka modal picker.
   - Kolom pencarian otomatis terfokus; mendukung navigasi keyboard `ArrowUp`, `ArrowDown`, `Enter`, dan `Esc`.
2. **Auto-Populate Data Master**:
   - Saat bahan dipilih, sistem mengisi otomatis: Kode Bahan, Nama Bahan, Gudang, Satuan Pakai, Stok Sistem (`stok_awal`), dan Harga Satuan.
   - Stok Fisik default terisi sama dengan Stok Sistem sehingga selisih awal adalah 0.
3. **Kalkulasi Real-time Selisih & Estimasi Nilai**:
   - Mengetik angka pada **Stok Fisik** langsung memperbarui:
     - $\text{Selisih} = \text{Stok Fisik} - \text{Stok Sistem}$
     - $\text{Nilai Selisih} = \text{Selisih} \times \text{Harga Satuan}$
   - Badge selisih diberi warna visual:
     - Hijau `+N` jika surplus
     - Merah `-N` jika susut / kurang
     - Slate `0` jika cocok
4. **Navigasi Tab & Baris**:
   - Menekan `Tab` dari Stok Fisik memindahkan kursor ke Keterangan/Alasan.
   - Menekan `Tab` dari Keterangan baris terakhir otomatis menambah baris baru.

---

## 3. Sticky Bottom Action Bar Requirement

Sesuai instruksi khusus: **"waktu di create atau edit harusnya di samping batal itu tunjukkan totalnya"**.

Bottom bar dibuat mengambang (sticky bottom) dengan layout:

- **Sisi Kiri**:
  - Tombol **Batalkan**
  - **Indikator Ringkasan Total** tepat di sebelahnya:
    - `Total Item`: X baris
    - `Positif / Negatif`: +Y / -Z
    - `Net Selisih`: W unit
    - `Nilai Selisih`: Rp ...
- **Sisi Kanan**:
  - Tombol **Simpan sebagai Draft** (`status = 0`)
  - Tombol **Simpan & Posting Stok** (`status = 1`)

---

## 4. Routing & RBAC

Terdaftar pada router utama `src/app/router/routes.ts`:

| Route Path                              | Page Component                  | Permission Required | Deskripsi                    |
| --------------------------------------- | ------------------------------- | ------------------- | ---------------------------- |
| `/inventory/stock-adjustments`          | `StockAdjustmentListPage.vue`   | `inventory:read`    | Daftar data penyesuaian stok |
| `/inventory/stock-adjustments/create`   | `StockAdjustmentCreatePage.vue` | `inventory:create`  | Form input stock opname baru |
| `/inventory/stock-adjustments/:id/edit` | `StockAdjustmentEditPage.vue`   | `inventory:update`  | Form revisi opname           |
| `/inventory/stock-adjustments/:id`      | `StockAdjustmentDetailPage.vue` | `inventory:read`    | Rincian berita acara opname  |

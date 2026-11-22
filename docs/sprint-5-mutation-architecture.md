# SPRINT 5 — FITUR 1: MUTASI STOK BAHAN

## SYSTEM ARCHITECTURE & INTERACTION DESIGN

### 1. Modul Mutasi Stok Bahan

Modul `material-mutations` diimplementasikan secara modular di dalam `app/src/modules/inventory/material-mutations/`:

```
src/modules/inventory/material-mutations/
├── components/
│   ├── MaterialMutationStatusBadge.vue       # Badge status (Selesai/Draft)
│   ├── MaterialMutationMaterialPicker.vue     # Modal selektor bahan dengan pencarian & keyboard navigation
│   └── MaterialMutationSpreadsheet.vue        # Spreadsheet editor desktop grid dengan inline inputs
├── mocks/
│   └── material-mutations.mock.ts             # Mock seed data mutasi & detail mutasi
├── pages/
│   ├── MaterialMutationListPage.vue           # Halaman List & DataTable
│   ├── MaterialMutationCreatePage.vue         # Halaman Create full-page dengan live total bar
│   ├── MaterialMutationEditPage.vue           # Halaman Edit full-page dengan safe posting notice
│   └── MaterialMutationDetailPage.vue         # Halaman Detail read-only & printable
├── services/
│   └── material-mutation.service.ts           # Mock service CRUD, pagination, auto code, atomic posting
├── types/
│   └── material-mutation.types.ts             # Type definition MariaDB legacy & frontend
└── utils/
    └── material-mutation-export.ts            # PDF export bukti mutasi & window print
```

---

### 2. Desktop-Style Spreadsheet Editor

Fitur utama dari form Create dan Edit adalah **Spreadsheet Editor** bergaya desktop:

- **Double-Click Cell Picker**: Melakukan double-click pada cell `Kode Bahan` atau `Nama Bahan` langsung membuka `MaterialMutationMaterialPicker` dengan fokus input pencarian instan.
- **Single-Click Search Button**: Ikon pencarian tersedia di cell nama bahan untuk fleksibilitas pengguna.
- **Keyboard Navigation**:
  - Tombol `Tab` berpindah antar kolom: Kode -> Nama -> Qty -> Keterangan -> Baris berikutnya.
  - Tombol `ArrowUp` dan `ArrowDown` di modal selektor bahan.
  - Tombol `Enter` untuk memilih bahan.
  - Tombol `Esc` untuk menutup modal selektor.
- **Multi-Row Management**: Tombol `Tambah Baris` dan `Hapus Baris` di toolbar serta ikon hapus per baris.
- **Real-Time Stock Warning**: Indikator peringatan muncul secara real-time apabila kuantitas mutasi yang diinput melebihi stok fisik bahan saat ini di gudang.

---

### 3. Live Total Indicator di Sticky Bottom Bar

Sesuai instruksi khusus: _"waktu di create atau edit harusnya di samping batal itu tunjukkan totalnya"_:
Di bagian bawah halaman (sticky bottom bar), tepat di samping tombol **"Batalkan"**, tersedia badge ringkasan total dinamis:

- **Total Item**: Menghitung jumlah baris bahan yang dipilih dengan qty > 0.
- **Total Qty**: Akumulasi kuantitas seluruh item yang dimutasi.
- **Estimasi Nilai**: Akumulasi nilai rupiah dari `qty * harga_satuan` bahan baku.

---

### 4. RBAC Permissions

Modul Mutasi Bahan terikat dengan permission permission guard persediaan:

- `inventory:read`: Mengakses daftar dan detail mutasi bahan.
- `inventory:create`: Mengakses form tambah mutasi dan posting baru.
- `inventory:update`: Mengakses form edit dan melakukan posting ulang.
- `inventory:delete`: Membatalkan atau menghapus mutasi bahan serta mengembalikan stok.

# Laporan Akhir Engineering: Sales Order Enhancement & Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Ringkasan Eksekutif & Objektif

Sprint 7 Enhancement berfokus pada penyempurnaan aksi baris data Sales Order (SO) dan penyelesaian modul Sales Invoice per Sales Order sesuai screenshot legacy:

- Menyelaraskan urutan 7 item menu aksi (_Actions Menu_) pada tabel SO Impact, SO Pola, dan SO KS.
- Mengimplementasikan fitur jejak audit _History Sales Order_ berbasis `histori_table`.
- Mengimplementasikan modal _Edit Tanggal_ SO dengan validasi dan logging audit.
- Membangun halaman dan arsitektur _Sales Invoice_ per SO dengan kemampuan penerbitan banyak invoice bertahap (multi-invoice: DP, termin, pelunasan).
- Mengimplementasikan modal dialog _Buat Invoice_ dengan auto-penomoran `INV/...-1` dan kalkulasi pajak gross-inclusive (PPN 11% untuk Impact, Non-PPN untuk Pola/KS).
- Menghitung agregat total: DPP, PPN, Total SO, Sudah Invoice, dan Sisa Invoice.
- Menyiapkan kontrak antarmuka integrasi menuju modul Pembayaran masa mendatang tanpa mutasi kas/bank otomatis.

---

## 2. Poin 1–14 Laporan Lengkap

### 1. Database & Legacy Audit Findings

- **Tabel Invoice**: Data faktur/invoice penjualan pada sistem legacy disimpan dalam tabel `pembayaran_sales_order` dengan foreign key `so_id` yang merujuk ke `sales_order.id`.
- **Tabel Histori**: Audit trail mutasi dicatat pada tabel `histori_table` (`table = 'sales_order'`, `table_id = :id`).
- **Pola Penomoran**: Konfigurasi `setting_table` (ID 37) mendefinisikan `INV/{year}/{last_number}`, sedangkan UX legacy (Screenshot 2) menerapkan format berbasis kode SO: `${soKode.replace('SO/', 'INV/')}-${sequence}` (contoh: `SO/26/X/0343` menghasilkan `INV/26/X/0343-1`).

### 2. Actions Menu Enhancement

Dropdown aksi pada ketiga varian SO (`SalesOrderActionsMenu.vue`) telah disesuaikan tepat 7 item berurutan:

1. `History Sales Order` (Ikon `History`)
2. `Edit Tanggal` (Ikon `Calendar`)
3. `Lihat` (Ikon `Eye`)
4. `Invoice` (Ikon `Receipt`)
5. `Cetak Surat Jalan` (Ikon `Truck`, disabled dengan info ketersediaan modul)
6. `Ubah` (Ikon `Edit2`)
7. `Batalkan Transaksi` (Ikon `XCircle`, varian danger dengan konfirmasi dialog)

### 3. History Sales Order Feature

- Menampilkan modal dialog `SalesOrderHistoryModal.vue` dengan linimasa vertikal event transaksi.
- Terkoneksi ke `histori_table` via `salesOrderTransactionService.getHistory(orderId)`.
- Mencatat aksi: `CREATE` (pembuatan awal), `EDIT_DATE` (revisi tanggal), `INVOICE_CREATE` (penerbitan tagihan invoice), dan `CANCEL` (pembatalan order).

### 4. Edit Tanggal Feature

- Menampilkan modal dialog `SalesOrderEditDateModal.vue`.
- Field: No SO (read-only), Tanggal Lama (read-only), Tanggal Baru (date picker), Alasan Perubahan (textarea wajib).
- Validasi: Mencegah perubahan jika SO dibatalkan (`status_aktif === 0`).
- Menyimpan perubahan tanggal dan mencatat log mutasi ke `histori_table`.

### 5. Sales Invoice per Sales Order Architecture

- Halaman didedikasikan per SO: `/sales/:variant/:id/invoices`.
- Menampilkan header dengan breadcrumbs kembali ke daftar SO, badge varian, No SO, Customer, dan status SO.
- Panel ringkasan 2 kolom: Info SO (No, Tanggal, Customer, PPN) dan Finansial (Total SO, Sudah Invoice, Sisa Invoice).
- Tabel 12 kolom daftar invoice sesuai screenshot legacy:
  `No`, `No Invoice`, `No SO`, `Jenis`, `Tanggal`, `No Faktur Pajak`, `Sub Total`, `PPN`, `Total`, `Terbayar`, `Status Pembayaran`, `Aksi`.

### 6. Modal Buat Invoice (Modal Dialog)

- Diimplementasikan dalam bentuk modal dialog `SalesInvoiceCreateModal.vue` (bukan halaman terpisah), matching Screenshot 2.
- Field:
  - No Invoice (read-only auto-generated).
  - Jenis Invoice (select: 'Penjualan', 'DP', 'Pelunasan').
  - Tanggal Invoice (default tanggal hari ini).
  - No Faktur Pajak (hanya aktif pada SO Impact; disabled/kosong pada Pola & KS).
  - Total (input nominal penagihan).
  - DPP & PPN (auto-kalkulasi readonly di bawah input total).
  - Keterangan (textarea catatan opsional).
- Terdapat tombol helper "Buat Sesuai Sisa SO" untuk mengisi nilai tepat sebesar sisa plafon.

### 7. Pengelolaan Invoice yang Diterbitkan

- **Lihat Detail**: Modal dialog `SalesInvoiceDetailModal.vue` menampilkan rincian dokumen penagihan.
- **Cetak Faktur Invoice**: Modal dialog `SalesInvoicePrintModal.vue` menyediakan pratinjau faktur standar A4 siap cetak dengan kop surat resmi varian dan 3 kolom tanda tangan.
- **Batalkan Invoice**: Dialog konfirmasi pembatalan. Jika dibatalkan (`status = 0`), nilai nominal invoice dikeluarkan dari akumulasi `sudahInvoice` sehingga plafon sisa tagihan SO seketika pulih.

### 8. Aturan Kalkulasi Finansial & Pajak

- **SO Impact (Gross-Inclusive 11%)**:
  $$\text{DPP} = \text{round}\left(\frac{\text{Total}}{1.11}\right)$$
  $$\text{PPN} = \text{Total} - \text{DPP}$$
  $$\text{DPP} + \text{PPN} \equiv \text{Total}$$
- **SO Pola & SO KS (Non-PPN)**:
  $$\text{DPP} = \text{Total}$$
  $$\text{PPN} = 0$$
- **Over-invoicing Guard**: Menolak pembuatan invoice dengan nominal melebihi sisa tagihan SO.

### 9. Perhitungan Agregat & Status Invoice

- $\text{Sudah Invoice} = \sum (\text{Total Invoice Aktif})$.
- $\text{Sisa Invoice} = \max(0, \text{Total SO} - \text{Sudah Invoice})$.
- Status Invoice SO:
  - $\text{Sudah Invoice} = 0 \implies \textbf{"Belum Invoice"}$
  - $0 < \text{Sudah Invoice} < \text{Total SO} \implies \textbf{"Sebagian Invoice"}$
  - $\text{Sudah Invoice} \ge \text{Total SO} \implies \textbf{"Sudah Invoice"}$

### 10. Kesiapan Integrasi Pembayaran (Payment Readiness)

- Setiap entitas invoice telah dilengkapi atribut:
  - `terbayar: number` (default 0)
  - `status_pembayaran: 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS'`
- Status pembayaran dihitung otomatis:
  - `terbayar === 0` $\implies$ `BELUM_BAYAR`
  - `0 < terbayar < total` $\implies$ `SEBAGIAN`
  - `terbayar >= total` $\implies$ `LUNAS`
- Invoice dan Sales Order yang sudah memiliki pembayaran (`terbayar > 0`) dilindungi dari aksi pembatalan.
- **Scope Compliance**: Tidak ada mutasi kas/bank atau pencatatan transaksi pembayaran aktual pada sprint ini.

### 11. Isolasi Tiga Varian (Impact, Pola, KS)

- Navigasi rute terpisah: `/sales/so-impact`, `/sales/so-pola`, `/sales/so-ks`.
- Penomoran dan kode invoice mengikuti prefix masing-masing dokumen SO.
- Aturan pajak (PPN 11% vs Non-PPN) dan field Faktur Pajak terisolasi secara ketat.

### 12. Hasil Verifikasi Kualitas (Quality Gates)

- **TypeScript**: `vue-tsc --noEmit` $\implies$ 0 errors (strict mode).
- **ESLint**: `eslint .` $\implies$ 0 errors, 0 warnings.
- **Prettier**: `prettier --check .` $\implies$ 100% compliant.
- **Vite Build**: `vite build` $\implies$ Sukses tanpa bundle error (2285 modul).
- **Vitest Suite**: 90/90 test files passed (517/517 unit tests passed).

### 13. Daftar File yang Ditambahkan & Dimodifikasi

- **Tipe & Model**:
  - `app/src/modules/sales/types/sales-history.types.ts` (Baru)
  - `app/src/modules/sales/types/sales-invoice.types.ts` (Baru)
  - `app/src/modules/sales/types/sales-order.types.ts` (Diperbarui)
- **Kalkulasi & Utilities**:
  - `app/src/modules/sales/utils/sales-invoice-calculations.ts` (Baru)
- **Service & Mock**:
  - `app/src/modules/sales/services/sales-invoice.service.ts` (Baru)
  - `app/src/modules/sales/services/sales-order-transaction.service.ts` (Diperbarui)
  - `app/src/modules/sales/mocks/sales-orders-data.mock.ts` (Diperbarui)
- **Komponen & Halaman**:
  - `app/src/modules/sales/components/SalesOrderActionsMenu.vue` (Baru)
  - `app/src/modules/sales/components/SalesOrderHistoryModal.vue` (Baru)
  - `app/src/modules/sales/components/SalesOrderEditDateModal.vue` (Baru)
  - `app/src/modules/sales/components/SalesInvoiceCreateModal.vue` (Baru)
  - `app/src/modules/sales/components/SalesInvoiceDetailModal.vue` (Baru)
  - `app/src/modules/sales/components/SalesInvoicePrintModal.vue` (Baru)
  - `app/src/modules/sales/pages/SalesInvoicePage.vue` (Baru)
  - `app/src/modules/sales/pages/SalesOrderListPage.vue` (Diperbarui)
- **Routing**:
  - `app/src/app/router/routes.ts` (Diperbarui dengan rute `/sales/so-*/:id/invoices`)
- **Unit Tests**:
  - `app/tests/unit/modules/sales/SalesInvoiceCalculations.spec.ts` (Baru)
  - `app/tests/unit/modules/sales/SalesInvoiceWorkflow.spec.ts` (Baru)
  - `app/tests/unit/modules/sales/SalesInvoicePage.spec.ts` (Baru)
  - `app/tests/unit/modules/sales/SalesOrderList.spec.ts` (Diperbarui)
- **Dokumentasi**:
  - 7 file markdown di `app/docs/`.

### 14. Keterbatasan & Kesiapan Sprint Berikutnya

- Transaksi pembayaran aktual dan pencatatan mutasi kas/bank ditunda hingga modul Pembayaran Penjualan diimplementasikan.
- Cetak Surat Jalan saat ini berstatus disabled dengan pemberitahuan informasi ketersediaan modul Pengiriman.
- Seluruh fondasi model, service contract, dan validasi finansial telah teruji 100% dan siap diintegrasikan pada modul Pembayaran dan Pengiriman di sprint mendatang.

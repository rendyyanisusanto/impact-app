# Sprint 7 — Laporan Akhir: Standalone Invoice Payment & Multi-Payment Module

## 1. Ringkasan Eksekutif

Implementasi modul **Pembayaran Invoice** sebagai menu tersendiri pada modul **Penjualan** telah diselesaikan secara menyeluruh pada aplikasi **Impact Furniture V2**.

Modul ini memperkuat tata kelola keuangan perusahaan dengan menegakkan aturan bisnis ERP:
$$\textbf{Sales Order} \longrightarrow \textbf{Sales Invoice} \longrightarrow \textbf{Pembayaran}$$
Di mana setiap transaksi pembayaran terikat secara valid ke `invoice_id`, bukan langsung ke Sales Order, mendukung skema _multi-payment_ (DP, termin, cicilan, dan pelunasan bertahap), serta menyediakan pencatatan audit reversal yang andal.

---

## 2. Pencapaian Fitur & Fungsionalitas Utama

1. **Menu Navigasi Penjualan**:
   - Menambahkan submenu ke-4: **`Pembayaran Invoice`** pada navigasi horizontal dan mobile drawer (`/sales/invoice-payments`).
2. **Halaman Utama Pembayaran (`InvoicePaymentListPage.vue`)**:
   - **Mode A: Daftar Tagihan Invoice (Default)**:
     - 13 kolom lengkap: Checkbox, No, Kode Invoice, No SO, Jenis SO, Customer, Tanggal, Total Tagihan, Sudah Dibayar, Sisa Tagihan, Status Pembayaran, Jumlah Pembayaran, Aksi (Bayar, Riwayat, Detail, Cetak).
     - KPI Summary Cards: Total Tagihan, Sudah Dibayar, Sisa Tagihan, Invoice Belum Lunas.
   - **Mode B: Riwayat Transaksi Pembayaran**:
     - 10 kolom lengkap: No, Kode Bayar, Tanggal Bayar, Kode Invoice, Customer, Metode, Bank / Kas, Nominal, Status, Aksi (Detail, Edit, Cetak Kuitansi, Batal).
     - KPI Summary Cards: Total Penerimaan, Transaksi Berhasil, Transaksi Dibatalkan, Rata-rata Pembayaran.
   - Filter lengkap: Search real-time, filter varian SO, status pembayaran, metode pembayaran, rentang tanggal.
   - Ekspor data: Dukungan ekspor data tabel ke format Excel (`.xlsx`) dan PDF (`.pdf`).
3. **Pencatatan Pembayaran Mandiri (`InvoicePaymentCreatePage.vue`)**:
   - Mendukung dua mode:
     - Pre-selected via parameter `?invoiceId=...` (terkunci dari daftar invoice).
     - Standalone via dialog **`InvoicePicker.vue`** yang mendukung pencarian cepat dan navigasi keyboard (`ArrowUp`, `ArrowDown`, `Enter`, `Esc`).
4. **Formulir Pembayaran Reusable (`InvoicePaymentForm.vue`)**:
   - Bagian 1: Ringkasan Informasi Invoice (read-only dengan badge varian SO dan status tagihan).
   - Bagian 2: Input Transaksi Pembayaran (Tanggal, Metode Bank/Tunai/Giro, Rekening Bank, Nominal Pembayaran dengan tombol pintas "Bayar Penuh / Lunas", Terbilang Rupiah otomatis, Nomor Bukti, Catatan).
5. **Halaman Detail Pembayaran (`InvoicePaymentDetailPage.vue`)**:
   - Menampilkan voucher penerimaan kas/bank resmi.
   - Rincian invoice dan Sales Order terkait.
   - Status banner transaksi (Aktif vs Dibatalkan beserta alasan pembatalan).
   - Aksi cetak kuitansi resmi, edit, dan pembatalan pembayaran.
6. **Halaman Edit Pembayaran (`InvoicePaymentEditPage.vue`)**:
   - Memungkinkan koreksi data tanggal, metode, bank, nomor bukti, keterangan, dan nominal pembayaran (selama belum terkunci oleh posting modul Keuangan).
7. **Pencetakan Kuitansi Resmi (`SalesInvoicePaymentReceiptModal.vue`)**:
   - Dokumen tanda terima pembayaran dengan kop surat perusahaan resmi sesuai varian (Impact, Pola, KS), nomor kuitansi, nama customer, terbilang rupiah, rincian pembayaran, serta kolom tanda tangan kasir dan penyetor.
8. **Integritas Database & Reversal**:
   - Rekalkulasi saldo otomatis saat pembayaran dibuat, diedit, atau dibatalkan.
   - Pencatatan log transaksi permanen ke `histori_table`.

---

## 3. Manifest File

### File Baru:

- `app/src/modules/sales/components/InvoicePicker.vue`
- `app/src/modules/sales/components/InvoicePaymentForm.vue`
- `app/src/modules/sales/pages/InvoicePaymentListPage.vue`
- `app/src/modules/sales/pages/InvoicePaymentCreatePage.vue`
- `app/src/modules/sales/pages/InvoicePaymentDetailPage.vue`
- `app/src/modules/sales/pages/InvoicePaymentEditPage.vue`
- `app/tests/unit/modules/sales/InvoicePicker.spec.ts`
- `app/tests/unit/modules/sales/InvoicePaymentListPage.spec.ts`
- `app/tests/unit/modules/sales/InvoicePaymentCreatePage.spec.ts`
- `app/tests/unit/modules/sales/InvoicePaymentDetailAndEdit.spec.ts`
- `app/docs/sprint-7-invoice-payment-schema.md`
- `app/docs/sprint-7-invoice-payment-architecture.md`
- `app/docs/sprint-7-invoice-payment-multi-payment.md`
- `app/docs/sprint-7-invoice-payment-workflow.md`
- `app/docs/sprint-7-invoice-payment-testing.md`
- `app/docs/sprint-7-invoice-payment-report.md`

### File yang Disempurnakan:

- `app/src/app/router/routes.ts` (registrasi 4 route baru pembayaran)
- `app/src/modules/sales/services/sales-payment.service.ts` (`getAllPayments`, `getAllInvoicesForListing`, `getEligibleInvoicesForPayment`, `updatePayment`)
- `app/src/modules/sales/services/sales-invoice.service.ts` (`getAllInvoicesWithSummary`)
- `app/src/modules/sales/services/sales-order-transaction.service.ts` (`getAllOrders`)
- `app/src/modules/sales/types/sales-payment.types.ts` (`UpdatePaymentPayload`)
- `app/src/modules/sales/types/sales-invoice.types.ts` (`SalesInvoiceListItem` fields)
- `app/src/modules/sales/mocks/sales-orders-data.mock.ts`
- `app/src/modules/sales/mocks/sales-payments-data.mock.ts`

---

## 4. Kesiapan Menuju Sprint 8 (Kas & Bank / Keuangan)

Setiap entitas pembayaran telah dilengkapi dengan kontrak bendera integrasi:

```typescript
is_posted_to_finance: boolean
```

Pada Sprint 8 (Modul Kas/Bank dan Jurnal Akuntansi), modul keuangan dapat langsung membaca transaksi pembayaran yang berstatus `is_posted_to_finance: false` untuk membukukan mutasi debet/kredit ke buku besar (_General Ledger_) tanpa perlu merombak skema pembayaran penjualan yang telah teruji.

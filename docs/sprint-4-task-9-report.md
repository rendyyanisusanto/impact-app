# Sprint 4 — Task 9 Implementation Report

## Pembayaran Tagihan — List & DataTable

---

### 1. Executive Summary

Task 9 mengimplementasikan modul daftar **Pembayaran Tagihan Supplier** pada rute `/procurement/bill-payments`. Tampilan menggunakan arsitektur enterprise layout yang konsisten dengan Purchase Order dan Penerimaan Barang.

---

### 2. Schema Verification

Berdasarkan audit schema MariaDB legacy `u1573701_smm.sql`:

- **Tabel Header**: `pembayaran_tagihan` (`id`, `kode`, `total`, `tanggal`, `status`, `status_aktif`, `no_tagihan`, `penagih`, `jatuh_tempo`, `keterangan`, `diskon`, `is_ppn`, `ppn_id`, `subtotal`, `total_ppn`, `suplier_id`, `total_bayar`, `uuid`).
- **Tabel Detail**: `detail_pembayaran_tagihan` (`id`, `pembayaran_tagihan_id`, `metode_pembayaran`, `bank_id`, `jumlah`, `keterangan`).
- **Tabel Relasi**: `detail_pb_pt` (`id`, `pb_id`, `pt_id`) menghubungkan Pembayaran Tagihan dengan Penerimaan Barang.

---

### 3. List Page Features

- **Route**: `/procurement/bill-payments`
- **Toolbar Aksi**:
  - Tombol **Tambah Pembayaran** (navigasi ke `/procurement/bill-payments/create`).
  - **Ekspor Excel** (.xlsx) via SheetJS dengan sanitasi formula injection.
  - **Ekspor PDF** via jsPDF AutoTable berformat formal landscape.
  - **Cetak (Print)** dan **Refresh Data**.
  - **Tidak ada tombol Impor Excel** (sesuai arahan scope).
- **Filter Panel**:
  - Pencarian fleksibel (Kode PT, No. Tagihan, Penagih, Supplier).
  - Filter Supplier.
  - Filter Status Pembayaran (Semua, Belum Lunas, Lunas).
  - Date Range picker (Mulai Tanggal s/d Sampai Tanggal).
- **DataTable Responsif**:
  - Checkbox selection untuk bulk processing.
  - Kolom: No, Kode PT, Tanggal, No. Tagihan, Supplier, Penagih, Metode / Bank, Total Tagihan, Nominal Bayar, Status (Badge), Aksi.
  - Status badge: `Lunas` (Emerald), `Belum Lunas` (Amber), `Dibatalkan` (Rose).
  - Baris aksi: Lihat Detail (`/:id`), Edit (`/:id/edit`), Batalkan (AppConfirmDialog).

---

### 4. Verification & Testing

Unit test suite terdedikasi diimplementasikan pada `app/tests/unit/modules/procurement/BillPaymentList.spec.ts`:

- **9.1**: Memverifikasi render AppPageHeader, action buttons, dan peniadaan tombol Impor Excel.
- **9.2**: Memverifikasi pemuatan data pembayaran dengan schema legacy yang akurat.
- **9.3**: Memverifikasi filter pencarian berdasarkan keyword.
- **9.4**: Memverifikasi pembukaan modal konfirmasi saat pembatalan pembayaran.
- **Hasil**: 4 dari 4 unit test lulus (100% Passed).

# Sprint 4 — Task 10 Implementation Report

## Pembayaran Tagihan — CRUD & Payment Allocation

---

### 1. Executive Summary

Task 10 mengimplementasikan form transaksi penuh (bukan modal) untuk **Pembayaran Tagihan Supplier** pada rute Create, Edit, dan Detail, lengkap dengan alokasi multi-dokumen Penerimaan Barang (PB) dan pencegahan overpayment secara desimal-aman.

---

### 2. Routes & Pages Implemented

| Route                                 | Component                   | Purpose                                                                  |
| ------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `/procurement/bill-payments/create`   | `BillPaymentCreatePage.vue` | Form pembuatan pembayaran baru dengan pemilihan PB dan metode pembayaran |
| `/procurement/bill-payments/:id/edit` | `BillPaymentEditPage.vue`   | Form penyuntingan alokasi pembayaran untuk dokumen yang berstatus aktif  |
| `/procurement/bill-payments/:id`      | `BillPaymentDetailPage.vue` | Tampilan read-only faktur bukti pembayaran dan cetak PDF                 |

---

### 3. Payment Allocation & Business Rules

1. **Pemilihan Dokumen PB Eligible**:
   - Ketika Supplier dipilih, sistem secara otomatis mengambil dokumen Penerimaan Barang (`penerimaan_barang`) berstatus Diterima (`status = 1`) yang masih memiliki sisa tagihan (`sisa_tagihan > 0`).
   - Sisa tagihan dihitung dari: $\text{Total PB} - \sum \text{Pembayaran Valid Sebelumnya}$.
2. **Rincian Metode Pembayaran (`detail_pembayaran_tagihan`)**:
   - Mendukung multi-baris metode: Transfer Bank, Cash (Tunai), Giro / Cek.
   - Pilihan rekening bank dari master data `bank`.
3. **Pencegahan Overpayment (Kelebihan Bayar)**:
   - Validasi ketat diterapkan di UI dan mock service boundary:
     $\text{Total Bayar} \le \text{Sisa Tagihan}$
   - Jika pembayaran melebihi sisa tagihan, pesan error interaktif muncul dan tombol simpan diblokir.
4. **Indikator Live Total**:
   - Di samping tombol **Batalkan**, terdapat tampilan real-time nominal pembayaran dan label status pelunasan (`Lunas` / `Belum Lunas`).
5. **Dirty State Tracking**:
   - Pengguna dilindungi dari kehilangan data saat keluar halaman tanpa menyimpan melalui `onBeforeRouteLeave` dan `AppConfirmDialog`.

---

### 4. Verification & Testing

Unit test suite terdedikasi diimplementasikan pada `app/tests/unit/modules/procurement/BillPaymentForm.spec.ts`:

- **10.1**: Memverifikasi render halaman Create, summary card finansial, dan indikator total footer.
- **10.2**: Memverifikasi validasi field wajib dan keharusan memilih minimal satu dokumen PB.
- **10.3**: Memverifikasi pemblokiran overpayment saat pembayaran melebihi sisa tagihan.
- **10.4**: Memverifikasi pemuatan data pembayaran existing pada halaman Edit.
- **10.5**: Memverifikasi tampilan komprehensif pada halaman Detail (read-only).
- **Hasil**: 5 dari 5 unit test lulus (100% Passed).

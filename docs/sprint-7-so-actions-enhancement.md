# Dokumentasi Enhancement Actions Menu Sales Order (Sprint 7)

Impact Furniture V2

## 1. Latar Belakang & Tujuan

Pada versi legacy Impact Furniture, setiap baris transaksi pada daftar Sales Order (SO) memiliki menu dropdown aksi yang menyediakan operasi lanjutan terkait siklus hidup pesanan penjualan. Pada implementasi Sprint 7 awal, menu aksi masih terbatas. Enhancement ini memperbarui dan menyelaraskan dropdown tindakan agar 100% konsisten dengan screenshot legacy dan aturan bisnis ERP.

## 2. Urutan & Spesifikasi Item Tindakan (Actions Menu)

Dropdown aksi pada ketiga varian (`SO Impact`, `SO Pola`, `SO KS`) diimplementasikan melalui komponen shared `SalesOrderActionsMenu.vue`. Urutan tindakan disusun persis sesuai spesifikasi:

| No  | Label Tindakan          | Ikon (Lucide)             | Handler / Navigasi                                                         | State & Guard                                                    |
| --- | ----------------------- | ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **History Sales Order** | `History`                 | Membuka modal `SalesOrderHistoryModal.vue`                                 | Aktif untuk semua SO                                             |
| 2   | **Edit Tanggal**        | `Calendar`                | Membuka modal `SalesOrderEditDateModal.vue`                                | Disabled jika status SO dibatalkan (`status_aktif === 0`)        |
| 3   | **Lihat**               | `Eye`                     | Navigasi ke rute detail nota SO (`/sales/:variant/:id`)                    | Selalu aktif                                                     |
| 4   | **Invoice**             | `Receipt`                 | Navigasi ke sub-halaman daftar invoice SO (`/sales/:variant/:id/invoices`) | Disabled jika SO dibatalkan                                      |
| 5   | **Cetak Surat Jalan**   | `Truck`                   | Menampilkan toast informasi ketersediaan modul                             | Disabled dengan badge _"Modul Pengiriman Segera Hadir"_          |
| 6   | **Ubah**                | `Edit2`                   | Navigasi ke halaman form edit SO (`/sales/:variant/edit/:id`)              | Disabled jika SO dibatalkan atau sudah ada pembayaran            |
| 7   | **Batalkan Transaksi**  | `XCircle` (Varian Danger) | Membuka dialog konfirmasi pembatalan                                       | Disabled jika SO sudah dibatalkan atau sudah terdapat pembayaran |

## 3. Fitur History Sales Order

- **Tujuan**: Menampilkan jejak audit (audit trail) perubahan dan tahapan siklus hidup Sales Order.
- **Sumber Data**: Tabel legacy `histori_table` (`table = 'sales_order'`, `table_id = :id`).
- **Pencatatan Otomatis**:
  - `CREATE`: Pembuatan order awal.
  - `EDIT_DATE`: Perubahan tanggal transaksi oleh user dengan alasan perubahan.
  - `INVOICE_CREATE`: Pembuatan invoice baru beserta nomor invoice dan nilai nominal.
  - `CANCEL`: Pembatalan transaksi SO beserta alasan pembatalan.
- **Komponen**: `SalesOrderHistoryModal.vue` menyajikan linimasa vertikal lengkap dengan timestamp format Indonesia, nama user penanggung jawab, metode aksi, badge visual status, dan deskripsi detail.

## 4. Fitur Edit Tanggal

- **Tujuan**: Memungkinkan pengguna berwenang mengoreksi tanggal transaksi Sales Order tanpa merusak integritas nomor urut atau detail item.
- **Form Input**:
  - No SO (Read-only / terarsip jelas).
  - Tanggal Lama (Read-only).
  - Tanggal Baru (Input tanggal, wajib diisi).
  - Alasan Perubahan (Textarea alasan audit, minimal 3 karakter).
- **Integritas Data**:
  - Memanggil `salesOrderTransactionService.updateOrderDate()`.
  - Memvalidasi bahwa SO tidak dalam status dibatalkan.
  - Mencatat mutasi secara otomatis ke `histori_table` dengan metode `EDIT_DATE`.

## 5. Hubungan Navigasi Aksi "Lihat"

- Aksi "Lihat" memicu navigasi langsung ke rute detail nota penjualan sesuai varian aktif:
  - SO Impact: `/sales/so-impact/:id` (alias `/sales/orders/impact/:id`)
  - SO Pola: `/sales/so-pola/:id` (alias `/sales/orders/pola/:id`)
  - SO KS: `/sales/so-ks/:id` (alias `/sales/orders/ks/:id`)
- Halaman detail nota menyajikan breakdown header, identitas customer, rincian baris barang, perhitungan subtotal, PPN (khusus Impact), grand total, status pembayaran, serta tombol cetak faktur.

## 6. Aksesibilitas & User Experience (UX)

- Dropdown memiliki auto-positioning, event listener `click-outside`, tombol esc untuk menutup menu.
- Menggunakan `lucide-vue-next` dengan visual compact (tidak memakan ruang berlebih pada DataTable).
- Item yang berstatus non-aktif memiliki atribut `disabled` dengan tooltip penjelasan alasan penonaktifan.

# SPRINT 7 — SURAT JALAN & PENGIRIMAN: LAPORAN PENYELESAIAN FITUR

## 1. Executive Summary

Fitur **Pengiriman → Surat Jalan & Pengambilan Sendiri** pada Impact Furniture V2 telah berhasil diimplementasikan secara komprehensif sesuai dengan dua screenshot legacy, skema database MariaDB `u1573701_smm.sql`, serta standar arsitektur clean code Vue 3 + TypeScript.

Seluruh 12 persyaratan wajib telah diselesaikan:

1. **Daftar Surat Jalan**: DataTable 13-kolom matching persis Screenshot 1.
2. **Tambah Surat Jalan**: Form 2-kolom full page matching persis Screenshot 2.
3. **Pengambilan Sendiri (Self Pickup)**: Alur formulir khusus dengan penomoran `SJA/`, flag `status_ambil = 1`, dan dokumen bertajuk Pengambilan Sendiri.
4. **Edit Surat Jalan**: Form edit full page untuk dokumen berstatus Draft.
5. **Detail Surat Jalan**: Halaman detail read-only dengan kartu KPI, ringkasan serah terima, dan preview bukti penerimaan.
6. **Cetak Surat Jalan**: Tampilan cetak A4 dengan CSS `@media print`, kop surat perusahaan dinamis sesuai varian SO, 4 kolom tanda tangan resmi, dan **tanpa kolom harga** (strictly logistics).
7. **Status Pengiriman & Status Dokumen**: Pengelolaan dua status independen (Status Dokumen: Draft/Succeeded/Batal, Status Pengiriman: Belum Dikirim/Terkirim/Ambil Sendiri).
8. **Bukti Pengiriman**: Modal interaktif untuk melihat dan mengunggah bukti serah terima (foto, cap, nama penerima, dan tanggal terima).
9. **Integrasi Sales Order**: Searchable SO Picker lintas 3 varian (Impact, Pola, KS), kalkulasi sisa kuantitas belum terkirim, serta sinkronisasi otomatis status `delivery_status` pada Sales Order.
10. **Integrasi Persediaan**: Pengurangan otomatis stok produk barang jadi saat berstatus Succeeded/Terkirim, pencegahan double posting, dan pembalikan stok (reversal) saat pembatalan.
11. **Export PDF & Excel**: Ekspor daftar surat jalan lengkap dengan rincian status dan kuantitas.
12. **RBAC & Quality Gates**: Pengamanan izin akses granular (`delivery:read`, `delivery:create`, `delivery:update`), 47 unit test baru, dan lulus seluruh quality gate.

---

## 2. Navigasi & Konfigurasi Routing

| Route                           | Name                           | Component                    | Deskripsi                     |
| ------------------------------- | ------------------------------ | ---------------------------- | ----------------------------- |
| `/delivery/notes`               | `delivery-notes`               | `DeliveryNoteListPage.vue`   | Daftar Surat Jalan (13 kolom) |
| `/delivery/notes/create`        | `delivery-notes-create`        | `DeliveryNoteCreatePage.vue` | Form Tambah Surat Jalan       |
| `/delivery/notes/pickup/create` | `delivery-notes-pickup-create` | `DeliveryNotePickupPage.vue` | Form Pengambilan Sendiri      |
| `/delivery/notes/:id`           | `delivery-notes-detail`        | `DeliveryNoteDetailPage.vue` | Detail Surat Jalan & Bukti    |
| `/delivery/notes/:id/edit`      | `delivery-notes-edit`          | `DeliveryNoteEditPage.vue`   | Edit Surat Jalan (Draft)      |
| `/delivery/notes/:id/print`     | `delivery-notes-print`         | `DeliveryNotePrintPage.vue`  | Cetak Surat Jalan Resmi       |

---

## 3. Checklist Penyelesaian Komponen & Fitur

- [x] Audit skema `surat_jalan` dan `detail_surat_jalan` dari dump SQL legacy.
- [x] Tipe TypeScript strict pada `delivery-note.types.ts`.
- [x] Utilitas kalkulasi dan penomoran resmi pada `delivery-note-calculations.ts`.
- [x] Mock fixtures realistis pada `delivery-notes.mock.ts`.
- [x] Service transactional `delivery-note.service.ts` dengan integrasi stok & SO.
- [x] Komponen picker Sales Order `DeliveryNoteSalesOrderPicker.vue`.
- [x] Spreadsheet detail produk `DeliveryNoteSpreadsheet.vue` dengan aksi cepat "Kirim Semua".
- [x] Modal bukti penerimaan `DeliveryNoteProofModal.vue`.
- [x] Template cetak logistik `DeliveryNotePrintDocument.vue`.
- [x] 6 Halaman web responsif di `app/src/modules/delivery/pages/`.
- [x] Tombol "Cetak Surat Jalan" pada menu aksi Sales Order terhubung langsung ke pengiriman.
- [x] Utilitas ekspor file Excel & PDF pada `delivery-note-export.ts`.
- [x] 8 Dokumen teknis lengkap pada direktori `app/docs/`.
- [x] Pengujian unit & integrasi 47 skenario lulus 100%.

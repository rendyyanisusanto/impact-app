# Sprint 7 — Alur Kerja & Workflow Pembayaran Sales Invoice

## 1. Alur Transaksi End-to-End

```mermaid
sequenceDiagram
    autonumber
    actor Kasir as Kasir / Finance
    participant Page as InvoicePaymentListPage
    participant Picker as InvoicePicker
    participant Form as InvoicePaymentForm
    participant PayService as salesPaymentService
    participant InvService as salesInvoiceService
    participant SOService as salesOrderTransactionService

    Kasir->>Page: Buka Menu Pembayaran Invoice (/sales/invoice-payments)
    Page->>PayService: getAllInvoicesForListing() & getAllPayments()
    Page-->>Kasir: Tampilkan Daftar Tagihan (Mode A) & Riwayat (Mode B)

    alt Entry via Tombol "Bayar" di Baris Invoice
        Kasir->>Page: Klik "Bayar" pada Invoice X
        Page->>Form: Navigasi /create?invoiceId=X
    else Entry via Tombol "Catat Pembayaran" Mandiri
        Kasir->>Page: Klik "Catat Pembayaran"
        Page->>Picker: Buka Searchable Invoice Picker
        Kasir->>Picker: Cari & Pilih Invoice Aktif
        Picker->>Form: Kirim invoiceId terpilih
    end

    Form-->>Kasir: Render Ringkasan Tagihan & Form Input
    Kasir->>Form: Isi Tanggal, Metode (Bank/Tunai), Nominal, No Bukti
    Kasir->>Form: Klik "Simpan Pembayaran"
    Form->>PayService: createPayment(payload)

    PayService->>InvService: updateInvoicePayment(invoiceId, totalPaid, status)
    PayService->>SOService: updateOrderPayment(soId, totalSoPaid)
    PayService->>SOService: addHistory(PAYMENT audit log)

    PayService-->>Form: Return SalesPayment sukses
    Form-->>Page: Toast Sukses & Redirect ke List Page
```

---

## 2. Alur Pembatalan Pembayaran (Payment Reversal)

Jika kasir melakukan kesalahan pencatatan atau dana bilyet giro/transfer ditolak oleh pihak perbankan, kasir dapat melakukan aksi pembatalan:

1. **Syarat Pembatalan**:
   - `payment.status === 1` (transaksi masih aktif).
   - `payment.is_posted_to_finance === false` (belum terkunci oleh tutup buku modul Keuangan).
2. **Langkah Reversal**:
   - Pengguna menekan tombol icon **Batal** (`XCircle`).
   - Sistem membuka dialog konfirmasi `AppConfirmDialog` dengan input wajib **Alasan Pembatalan**.
   - Saat disetujui, `salesPaymentService.cancelPayment(id, reason)` dieksekusi:
     - `payment.status` diubah menjadi `0` (Dibatalkan).
     - `payment.alasan_batal` dan timestamp pembatalan dicatat.
     - Saldo `terbayar` invoice dikurangi sebesar nominal yang dibatalkan, status tagihan invoice kembali menjadi `SEBAGIAN` atau `BELUM_BAYAR`.
     - Saldo `terbayar` pada Sales Order disinkronkan kembali.
     - Jejak audit `PAYMENT_CANCEL` dicatat permanen ke `histori_table`.

# Arsitektur Modul Pembayaran Berbasis Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Arsitektur Komponen & Prinsip Desain

Modul Pembayaran Penjualan dirancang dengan mematuhi hierarki transaksi ERP manufaktur yang ketat:

$$\textbf{Sales Order (SO)} \longrightarrow \textbf{Sales Invoice (Tagihan/Faktur)} \longrightarrow \textbf{Pembayaran (Kas/Bank)}$$

Setiap transaksi pembayaran **wajib mengacu ke `invoice_id`** (bukan langsung ke `sales_order_id`). Sales Order hanya menjadi referensi konteks dan pelaporan tidak langsung.

### Struktur Modul Pembayaran Penjualan:

```
app/src/modules/sales/
├── components/
│   ├── SalesInvoicePaymentCreateModal.vue    # Form modal tambah pembayaran (matching Section 5)
│   ├── SalesInvoicePaymentDetailModal.vue    # Modal detail transaksi pembayaran (Section 8)
│   ├── SalesInvoicePaymentReceiptModal.vue   # Kwitansi cetak bukti pembayaran A4/voucher
│   ├── SalesInvoiceCreateModal.vue           # Modal buat invoice
│   ├── SalesInvoiceDetailModal.vue           # Modal detail invoice
│   ├── SalesInvoicePrintModal.vue            # Cetak faktur invoice
│   ├── SalesOrderActionsMenu.vue             # Actions menu 7-item pada SO
│   └── ...
├── mocks/
│   └── sales-payments-data.mock.ts           # Mock payments data mapped to legacy schema
├── pages/
│   ├── SalesInvoicePage.vue                  # Halaman daftar invoice (dengan aksi Bayar & Lihat Pembayaran)
│   ├── SalesInvoicePaymentPage.vue           # Halaman utama histori & manajemen pembayaran invoice
│   └── ...
├── services/
│   ├── sales-payment.service.ts              # Service transaksi pembayaran & validasi
│   ├── sales-invoice.service.ts              # Service faktur invoice dengan hook pembayaran
│   └── sales-order-transaction.service.ts    # Service Sales Order dengan hook sinkronisasi pembayaran
├── types/
│   ├── sales-payment.types.ts                # TypeScript interfaces untuk pembayaran & finance contract
│   └── ...
└── utils/
    ├── sales-payment-calculations.ts         # Fungsi murni (pure) kalkulasi sisa & terbilang rupiah
    └── ...
```

---

## 2. Diagram Alur Transaksi & Reaktivitas Komponen (Mermaid)

```mermaid
flowchart TD
    SOL[SalesOrderListPage] -->|Aksi 'Invoice'| SIP[SalesInvoicePage /:variant/:id/invoices]
    SIP -->|Aksi 'Bayar'| SIPCM[SalesInvoicePaymentCreateModal]
    SIP -->|Aksi 'Lihat Pembayaran'| SIPP[SalesInvoicePaymentPage /:variant/:id/invoices/:invoiceId/payments]

    SIPP -->|Tombol '+ Tambah Pembayaran'| SIPCM
    SIPP -->|Aksi 'Detail'| SIPDM[SalesInvoicePaymentDetailModal]
    SIPP -->|Aksi 'Cetak Kwitansi'| SIPRM[SalesInvoicePaymentReceiptModal]
    SIPP -->|Aksi 'Batalkan'| SICD[ConfirmDialog Pembatalan Reversal]

    SIPCM -->|createPayment()| SPS[salesPaymentService]
    SICD -->|cancelPayment()| SPS

    SPS -->|updateInvoicePayment()| SIS[salesInvoiceService]
    SPS -->|updateOrderPayment()| SOTS[salesOrderTransactionService]
    SPS -->|addHistory()| SOTS
```

---

## 3. Rute Navigasi

1. **Rute Pembayaran Terisolasi per Varian SO**:
   - SO Impact: `/sales/so-impact/:id/invoices/:invoiceId/payments` (`sales-orders-impact-invoice-payments`)
   - SO Pola: `/sales/so-pola/:id/invoices/:invoiceId/payments` (`sales-orders-pola-invoice-payments`)
   - SO KS: `/sales/so-ks/:id/invoices/:invoiceId/payments` (`sales-orders-ks-invoice-payments`)
2. **Rute Langsung Invoice**:
   - `/sales/invoices/:invoiceId/payments` (`sales-invoice-payments-direct`)

Rute ini memastikan pengguna selalu melihat informasi konteks lengkap: nomor invoice yang dibayar, nomor SO referensi, customer, serta rincian pembayaran.

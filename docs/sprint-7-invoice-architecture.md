# Arsitektur Modul Sales Invoice & Alur Komponen (Sprint 7)

Impact Furniture V2

## 1. Arsitektur Komponen & Halaman

Implementasi modul Sales Invoice dirancang dengan memegang teguh prinsip Single Responsibility, reusability tingkat tinggi, dan isolasi data per varian Sales Order (`SO Impact`, `SO Pola`, `SO KS`).

### Struktur File:

```
app/src/modules/sales/
├── components/
│   ├── SalesInvoiceCreateModal.vue    # Modal dialog pembuatan invoice baru (matching Screenshot 2)
│   ├── SalesInvoiceDetailModal.vue    # Modal popup ringkasan rincian invoice
│   ├── SalesInvoicePrintModal.vue     # Modal cetak faktur A4 dengan CSS print-preview
│   ├── SalesOrderActionsMenu.vue      # Dropdown aksi 7 item pada DataTable SO
│   ├── SalesOrderEditDateModal.vue    # Modal pengubahan tanggal SO terintegrasi audit
│   └── SalesOrderHistoryModal.vue     # Modal timeline jejak audit (histori_table)
├── mocks/
│   └── sales-orders-data.mock.ts      # Initial state invoice & audit history
├── pages/
│   ├── SalesInvoicePage.vue           # Halaman utama daftar invoice per SO (matching Screenshot 1)
│   ├── SalesOrderDetailPage.vue       # Halaman detail nota SO
│   └── SalesOrderListPage.vue         # Halaman daftar SO dengan integrasi actions menu
├── services/
│   ├── sales-invoice.service.ts       # Service CRUD invoice, validasi finansial, & status
│   └── sales-order-transaction.service.ts # Service SO transaction, edit tanggal, & history
├── types/
│   ├── sales-history.types.ts         # Kontrak tipe data audit trail histori_table
│   ├── sales-invoice.types.ts         # Kontrak tipe data invoice, ringkasan, payload
│   └── sales-order.types.ts           # Kontrak tipe data SO & varian
└── utils/
    └── sales-invoice-calculations.ts  # Fungsi murni (pure functions) kalkulasi pajak & ringkasan
```

---

## 2. Diagram Alur Relasi & Komponen (Mermaid)

```mermaid
flowchart TD
    SOL[SalesOrderListPage] -->|Aksi 'Invoice'| SIP[SalesInvoicePage /:variant/:id/invoices]
    SOL -->|Aksi 'History'| SOHM[SalesOrderHistoryModal]
    SOL -->|Aksi 'Edit Tanggal'| SOEDM[SalesOrderEditDateModal]
    SOL -->|Aksi 'Lihat'| SOD[SalesOrderDetailPage]

    SIP -->|Tombol '+ Buat Invoice'| SICM[SalesInvoiceCreateModal]
    SIP -->|Aksi 'Lihat'| SIDM[SalesInvoiceDetailModal]
    SIP -->|Aksi 'Cetak'| SIPM[SalesInvoicePrintModal]
    SIP -->|Aksi 'Batal'| SICD[ConfirmDialog Pembatalan]

    SICM -->|createInvoice()| SIS[salesInvoiceService]
    SOEDM -->|updateOrderDate()| SOTS[salesOrderTransactionService]
    SICD -->|cancelInvoice()| SIS

    SIS -->|Perhitungan Pajak & Sisa| SIC[sales-invoice-calculations]
    SIS -->|Logging Audit| SOTS
```

---

## 3. Rute Navigasi & Pola URL

Setiap varian SO memiliki rute invoice sendiri yang terdaftar pada Vue Router (`app/src/app/router/routes.ts`):

- **SO Impact**:
  - URL Standar: `/sales/so-impact/:id/invoices`
  - URL Legacy Alias: `/sales/orders/impact/:id/invoices`
  - Nama Rute: `sales-order-impact-invoices`
- **SO Pola**:
  - URL Standar: `/sales/so-pola/:id/invoices`
  - URL Legacy Alias: `/sales/orders/pola/:id/invoices`
  - Nama Rute: `sales-order-pola-invoices`
- **SO KS**:
  - URL Standar: `/sales/so-ks/:id/invoices`
  - URL Legacy Alias: `/sales/orders/ks/:id/invoices`
  - Nama Rute: `sales-order-ks-invoices`

Parameter rute dideteksi secara reaktif sehingga perubahan ID atau varian langsung memicu pembaruan state pada `SalesInvoicePage.vue`.

---

## 4. State Management & Reaktivitas

1. **Mock In-Memory Store**: Disimpan di level modul via `sales-invoice.service.ts` dengan data awal dari `INITIAL_MOCK_INVOICES`.
2. **Reactivity Safe**: Seluruh manipulasi data invoice (buat, batal) mengembalikan object baru (`spread operator`), mencegah side-effect mutasi mutable objek referensi.
3. **Penyelarasan Nilai Finansial SO**: Setiap penambahan atau pembatalan invoice secara otomatis mengkalkulasi ulang `sudahInvoice`, `sisaInvoice`, dan `status_invoice` pada header SO terkait.

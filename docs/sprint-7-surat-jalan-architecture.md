# SPRINT 7 — SURAT JALAN & PENGIRIMAN: ARSITEKTUR MODUL

## 1. Desain Arsitektur Berlapis (Layered Architecture)

Modul Pengiriman & Surat Jalan diimplementasikan di bawah `app/src/modules/delivery/` dengan pemisahan tanggung jawab yang modular, decoupling tinggi, dan tipe data ketat tanpa `any`:

```
app/src/modules/delivery/
├── types/
│   └── delivery-note.types.ts           # Domain models, Enums, DTOs, dan ViewModels
├── utils/
│   ├── delivery-note-calculations.ts   # Formatter kode, validasi kuantitas, resolver status
│   └── delivery-note-export.ts         # Utility ekspor PDF (jspdf) & Excel (xlsx)
├── mocks/
│   └── delivery-notes.mock.ts          # Seed data fixtures legacy MariaDB
├── services/
│   └── delivery-note.service.ts        # Business logic, state in-memory, stock & SO sync
├── components/
│   ├── DeliveryNoteSalesOrderPicker.vue # Modal pencarian SO (lintas varian Impact, Pola, KS)
│   ├── DeliveryNoteSpreadsheet.vue      # Detail spreadsheet produk & kuantitas pengiriman
│   ├── DeliveryNoteProofModal.vue       # Viewer & upload bukti penerimaan / foto serah terima
│   └── DeliveryNotePrintDocument.vue    # Template cetak logistik surat jalan (tanpa harga)
└── pages/
    ├── DeliveryNoteListPage.vue         # DataTable 13-kolom matching Screenshot 1
    ├── DeliveryNoteCreatePage.vue       # Form 2-kolom full page matching Screenshot 2
    ├── DeliveryNotePickupPage.vue       # Form Pengambilan Sendiri (Self Pickup)
    ├── DeliveryNoteDetailPage.vue       # Halaman detail read-only & KPI pengiriman
    ├── DeliveryNoteEditPage.vue         # Form edit surat jalan berstatus Draft
    └── DeliveryNotePrintPage.vue        # Halaman cetak dengan CSS @media print
```

---

## 2. Alur Data & Integrasi Antar-Modul

```
[Sales Order (Impact / Pola / KS)]
               │
               ▼
   [DeliveryNoteService] ─────────► [ProductService]
   (Hitung Sisa Kuantitas)           (Pengurangan Stok Produk)
               │                                │
               ├────────────────────────────────┤
               ▼                                ▼
    [Surat Jalan Terbit]            [Stok Fisik Berkurang]
               │
               ▼
   [Konfirmasi Terkirim / Bukti]
               │
               ▼
[Update Status SO: TERKIRIM]
```

### Integrasi Utama:

1. **Sales Order Service**: Menarik data pesanan, customer, salesman, total nilai pembelian, dan kuantitas baris pesanan. Menghitung akumulasi kuantitas terkirim dari seluruh surat jalan aktif untuk memperbarui `delivery_status` pada Sales Order.
2. **Product Service**: Mengurangi kuantitas stok produk fisik (`qty`) ketika surat jalan berstatus `SUCCEEDED` atau terkonfirmasi `TERKIRIM`. Mengembalikan stok jika surat jalan dibatalkan (`BATAL`).
3. **Customer & Reference Service**: Mengisi otomatis nama customer, alamat pengiriman, dan nomor telepon.
4. **Auth & RBAC**: Akses create/read/update dikontrol oleh permission `delivery:read`, `delivery:create`, dan `delivery:update`.

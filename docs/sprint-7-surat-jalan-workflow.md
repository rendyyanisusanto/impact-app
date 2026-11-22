# SPRINT 7 — SURAT JALAN & PENGIRIMAN: WORKFLOW & STATUS LIFECYCLE

## 1. Siklus Hidup Dokumen & Status Pengiriman

Modul Pengiriman memiliki dua status independen yang mencerminkan status hukum dokumen dan status fisik barang:

```
[STATUS DOKUMEN]
  DRAFT (0) ──────► SUCCEEDED (1) ──────► BATAL (2)
                     (Sah / Siap Kirim)    (Dibatalkan / Void)

[STATUS PENGIRIMAN]
  BELUM DIKIRIM (0) ──────► TERKIRIM (1)
          │
          └───────────────► AMBIL SENDIRI (2)
```

### Tabel Status Transisi:

| Status Dokumen    | Status Kirim      | Metode        | Efek Stok                   | Status SO Terkait                                   |
| ----------------- | ----------------- | ------------- | --------------------------- | --------------------------------------------------- |
| **DRAFT (0)**     | BELUM DIKIRIM (0) | Dikirim       | Belum berkurang             | BELUM_KIRIM                                         |
| **SUCCEEDED (1)** | BELUM DIKIRIM (0) | Dikirim       | **Berkurang**               | BELUM_KIRIM (jika parsial) / TERKIRIM (jika tuntas) |
| **SUCCEEDED (1)** | TERKIRIM (1)      | Dikirim       | **Berkurang**               | TERKIRIM (jika seluruh pesanan telah terkirim)      |
| **SUCCEEDED (1)** | AMBIL SENDIRI (2) | Ambil Sendiri | **Berkurang**               | TERKIRIM (jika seluruh pesanan telah terambil)      |
| **BATAL (2)**     | -                 | -             | **Dikembalikan (Reversal)** | Revert ke BELUM_KIRIM                               |

---

## 2. Alur Transaksi End-to-End

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff Gudang / Logistik
    participant UI as Halaman Surat Jalan
    participant Svc as DeliveryNoteService
    participant SO as SalesOrderService
    participant Prod as ProductService

    Staff->>UI: Buka Tambah Surat Jalan
    UI->>SO: Muat daftar Sales Order aktif
    Staff->>UI: Pilih Sales Order (Impact / Pola / KS)
    UI->>Svc: Hitung sisa kuantitas belum terkirim
    UI-->>Staff: Tampilkan spreadsheet produk & sisa
    Staff->>UI: Isi QTY Pengiriman & simpan (SUCCEEDED)
    UI->>Svc: createDeliveryNote(payload)
    Svc->>Prod: adjustStock(produk_id, -qty_kirim)
    Svc->>SO: Evaluasi & update delivery_status SO
    Svc-->>UI: Surat Jalan terbit
    Staff->>UI: Cetak Surat Jalan logistik (Cetak)
    Staff->>UI: Upload bukti & konfirmasi penerimaan
    UI->>Svc: confirmDelivery(id, proof)
    Svc-->>UI: Status berubah menjadi TERKIRIM
```

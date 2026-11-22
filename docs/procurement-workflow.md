# Procurement Workflow & Business Lifecycle

## Impact Furniture v2 ERP

---

```mermaid
flowchart TD
    PO_Draft[1. Buat Draft Purchase Order] --> PO_Approve[2. Setujui PO / Status = 1]
    PO_Approve --> PB_Create[3. Penerimaan Barang / Masukkan Qty Terima]
    PB_Create --> Stock_Post[4. Mutasi Tambah Stok & Catat Kartu Stok]
    Stock_Post --> PT_Create[5. Buat Pembayaran Tagihan Supplier]
    PT_Create --> PT_Check{Lunas atau Sebagian?}
    PT_Check -- Sebagian --> PT_Partial[Sisa Tagihan Berkurang / Status = Belum Lunas]
    PT_Check -- Lunas --> PT_Done[Dokumen PB Selesai / Status = Lunas]

    PB_Create -.->|Pembatalan PB| Stock_Reverse[Reversal Pengurangan Stok]
```

### Business Rules & Guardrails

1. **PO Terkunci**: Purchase Order yang sudah disetujui (`status = 1`) tidak dapat dihapus jika telah memiliki dokumen Penerimaan Barang.
2. **Kuantitas Parsial**: Penerimaan barang tidak dapat menerima lebih dari sisa kuantitas pesanan PO ($\text{qty\_terima} \le \text{sisa\_po}$).
3. **Double Posting Prevention**: Dokumen PB yang telah diposting tidak akan menambahkan stok untuk kedua kalinya.
4. **Overpayment Prevention**: Jumlah nominal pembayaran tidak dapat melampaui sisa tagihan dokumen Penerimaan Barang.

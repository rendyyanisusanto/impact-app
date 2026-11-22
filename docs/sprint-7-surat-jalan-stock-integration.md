# SPRINT 7 — SURAT JALAN: INTEGRASI PERSEDIAAN & STOK PRODUK

## 1. Aturan Pengurangan Stok Persediaan

Berdasarkan aturan bisnis ERP manufaktur Impact Furniture:

1. **Pengurangan Stok Otomatis**:
   - Pengurangan stok barang jadi (`Produk`) terjadi ketika Surat Jalan diterbitkan dengan status **SUCCEEDED (1)** atau ketika dokumen DRAFT dikonfirmasi menjadi **TERKIRIM (1)** / **AMBIL SENDIRI (2)**.
   - Nilai pengurangan adalah kuantitas pengiriman aktual (`qty_kirim`) per baris produk.
2. **Pencegahan Double Posting (Idempotensi)**:
   - Setiap entitas surat jalan dilengkapi penanda boolean `is_stock_deducted: boolean`.
   - Jika `is_stock_deducted === true`, operasi posting stok berikutnya diabaikan untuk menjamin stok tidak terkurang berulang kali.
3. **Pembalikan Stok Saat Pembatalan (Stock Reversal)**:
   - Apabila surat jalan dibatalkan (`BATAL`), seluruh kuantitas produk yang telah dikurangi dikembalikan secara otomatis (`productService.adjustStock(id, +qty_kirim)`).
   - Penanda `is_stock_deducted` diubah kembali menjadi `false`.

---

## 2. Sinkronisasi Status Pengiriman Sales Order

Sales Order memiliki kolom status pengiriman `delivery_status: 'BELUM_KIRIM' | 'TERKIRIM'`.

Aturan sinkronisasi otomatis:

1. `DeliveryNoteService` menghitung total kuantitas seluruh produk pada SO (`totalOrdered`).
2. Menghitung akumulasi kuantitas terkirim dari seluruh surat jalan aktif (`totalDelivered`).
3. Evaluasi:
   $$\text{totalDelivered} \ge \text{totalOrdered} \implies \text{delivery\_status} = \text{'TERKIRIM'}$$
   $$\text{totalDelivered} < \text{totalOrdered} \implies \text{delivery\_status} = \text{'BELUM\_KIRIM'}$$
4. Jika surat jalan dibatalkan sehingga `totalDelivered` turun di bawah `totalOrdered`, status delivery SO secara otomatis di-revert menjadi `BELUM_KIRIM`.

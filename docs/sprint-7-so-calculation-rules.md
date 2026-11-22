# SPRINT 7 — SALES ORDER FINANCIAL CALCULATION RULES

## 1. FORMULA PERHITUNGAN

Sistem kalkulasi finansial (`sales-order-calculations.ts`) menerapkan aturan presisi tinggi tanpa pembulatan mengambang yang keliru:

### A. Subtotal Per Baris Item

$$\text{Subtotal Baris} = \text{Qty} \times \text{Harga Satuan} \times \left(1 - \frac{\text{Diskon}}{100}\right)$$

### B. Total Akumulasi Produk (Subtotal SO)

$$\text{Items Subtotal} = \sum_{i=1}^{n} \text{Subtotal Baris}_i$$

### C. Total Biaya Tambahan

$$\text{Total Additional Costs} = \sum_{j=1}^{m} \text{Jumlah Komponen}_j$$

### D. Dasar Pengenaan Pajak (DPP) & PPN

Untuk **SO Impact**:
$$\text{DPP} = \text{Items Subtotal} + \text{Total Additional Costs}$$
$$\text{Total PPN} = \text{round}\left(\text{DPP} \times \frac{\text{Tarif PPN}}{100}\right) \quad (\text{Default: } 11\%)$$

Untuk **SO Pola** & **SO KS**:
$$\text{Total PPN} = 0$$

### E. Grand Total / Total Bayar (Neto)

$$\text{Grand Total} = \text{Items Subtotal} + \text{Total Additional Costs} + \text{Total PPN}$$

---

## 2. STATUS PEMBAYARAN

Status pembayaran dihitung secara dinamis dari perbandingan nilai `total` dan `terbayar`:

- **`BELUM_BAYAR`**: `terbayar === 0`.
- **`SEBAGIAN`**: `0 < terbayar < total`.
- **`LUNAS`**: `terbayar >= total` (di mana `total > 0`).

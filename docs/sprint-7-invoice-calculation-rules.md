# Aturan Kalkulasi Finansial & Pajak Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Prinsip Dasar Perhitungan Pajak

Sistem membedakan perlakuan kalkulasi pajak berdasarkan varian Sales Order:

- **SO Impact**: Menggunakan PPN 11% secara _gross-inclusive_ (nilai total yang diinput pengguna sudah mencakup PPN).
- **SO Pola & SO KS**: Transaksi Non-PPN (PPN 0%, DPP sama dengan Total).

---

## 2. Rumus Gross-Inclusive PPN 11% (Khusus SO Impact)

Berdasarkan peraturan perpajakan dan UX legacy (Screenshot 2), ketika pengguna menginput nilai **Total** tagihan invoice:

$$\text{DPP (Dasar Pengenaan Pajak)} = \text{round}\left(\frac{\text{Total}}{1 + \text{Tarif PPN}}\right) = \text{round}\left(\frac{\text{Total}}{1.11}\right)$$

$$\text{PPN} = \text{Total} - \text{DPP}$$

### Karakteristik & Bukti Konsistensi:

- **Integritas Penjumlahan**: $\text{DPP} + \text{PPN} \equiv \text{Total}$ (dijamin tepat hingga digit rupiah satuan terkecil tanpa selisih pembulatan).
- **Contoh Numerik**:
  - Total = Rp 1.110.000:
    - DPP = Rp 1.000.000
    - PPN = Rp 110.000
    - Penjumlahan: $1.000.000 + 110.000 = 1.110.000$ (Valid).
  - Total = Rp 25.000.000:
    - DPP = $\text{round}(25.000.000 / 1.11) = 22.522.523$
    - PPN = $25.000.000 - 22.522.523 = 2.477.477$
    - Penjumlahan: $22.522.523 + 2.477.477 = 25.000.000$ (Valid).

---

## 3. Rumus Non-PPN (SO Pola & SO KS)

Untuk transaksi Non-PPN:

$$\text{DPP} = \text{Total}$$

$$\text{PPN} = 0$$

- Field `no_faktur_pajak` diabaikan / `null` dan input dinonaktifkan pada form UI.

---

## 4. Agregasi Invoice per Sales Order

Setiap Sales Order dapat memiliki beberapa invoice bertahap (multi-invoice: Uang Muka / DP, Termin 1, Pelunasan).

### Definisi Agregat:

1. **Total SO**: Nilai akhir pesanan penjualan yang disepakati (`order.total_setelah_pajak` atau `order.total`).
2. **Sudah Di-Invoice (`sudahInvoice`)**:
   $$\text{Sudah Invoice} = \sum_{\substack{\text{inv} \in \text{Invoices}(\text{SO}) \\ \text{inv.status} = 1}} \text{inv.total}$$
   _(Hanya menghitung invoice berstatus AKTIF `status === 1`. Invoice yang dibatalkan `status === 0` dikeluarkan dari penjumlahan)._
3. **Sisa Belum Di-Invoice (`sisaInvoice`)**:
   $$\text{Sisa Invoice} = \max(0, \text{Total SO} - \text{Sudah Di-Invoice})$$
4. **Status Pemenuhan Invoice SO (`status_invoice`)**:
   - Jika $\text{Sudah Invoice} = 0 \implies \textbf{"Belum Invoice"}$
   - Jika $0 < \text{Sudah Invoice} < \text{Total SO} \implies \textbf{"Sebagian Invoice"}$
   - Jika $\text{Sudah Invoice} \ge \text{Total SO} \implies \textbf{"Sudah Invoice"}$

---

## 5. Validasi Batas Maksimal (Over-Invoicing Guard)

Sistem secara ketat mencegah pembuatan invoice yang melebihi sisa plafon SO:

- Pada form pembuatan (`SalesInvoiceCreateModal.vue`), tombol "Buat Sesuai Sisa SO" memudahkan pengisian otomatis sisa tagihan.
- Validasi form menolak submit jika $\text{Total Input} > \text{Sisa Invoice}$.
- Service layer (`salesInvoiceService.createInvoice()`) melempar exception:
  `"Nominal invoice melebihi sisa total Sales Order..."`
  jika terdapat upaya manipulasi input melampaui sisa plafon.
- Toleransi pembulatan mengizinkan selisih kecil maksimal Rp 1 jika terjadi pembagian desimal berulang.

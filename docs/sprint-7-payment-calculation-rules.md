# Aturan Perhitungan Finansial & Validasi Pembayaran Sales Invoice (Sprint 7)

Impact Furniture V2

## 1. Rumus Dasar Finansial Pembayaran

Perhitungan pembayaran berlandaskan pada prinsip matematika terisolasi pada level dokumen tagihan invoice:

$$\textbf{Total Tagihan Invoice} = \text{Nominal final yang tercantum pada faktur invoice}$$

$$\textbf{Sudah Dibayar} = \sum_{\substack{\text{pay} \in \text{Payments}(\text{Invoice}) \\ \text{pay.status} = 1}} \text{pay.jumlah}$$

$$\textbf{Sisa Pembayaran} = \max\left(0, \textbf{Total Tagihan Invoice} - \textbf{Sudah Dibayar}\right)$$

### Resolusi Status Pembayaran Invoice (`status_pembayaran`):

- Jika $\textbf{Sudah Dibayar} = 0 \implies \textbf{"BELUM\_BAYAR"}$
- Jika $0 < \textbf{Sudah Dibayar} < \textbf{Total Tagihan Invoice} \implies \textbf{"SEBAGIAN"}$
- Jika $\textbf{Sudah Dibayar} \ge \textbf{Total Tagihan Invoice} \implies \textbf{"LUNAS"}$

---

## 2. Pemisahan Tiga Agregat pada Sales Order

Sistem secara tegas memisahkan tiga nilai finansial pada Sales Order:

1. **Total Sales Order (`total_so`)**: Nilai akhir pesanan yang disepakati.
2. **Total Sudah Di-Invoice (`total_sudah_invoice`)**: Total nominal tagihan invoice yang telah terbit.
3. **Total Sudah Dibayar (`total_sudah_dibayar`)**: Total kas/bank pembayaran valid yang telah disetor pelanggan.

$$\text{Sisa Pelunasan SO} = \max\left(0, \text{Total SO} - \text{Total Sudah Dibayar}\right)$$

### Status Pembayaran Sales Order:

- `BELUM_BAYAR`: Jika `total_sudah_dibayar === 0`.
- `SEBAGIAN`: Jika `0 < total_sudah_dibayar < total_so`.
- `LUNAS`: Jika `total_sudah_dibayar >= total_so`.

> [!IMPORTANT]
> Total Sales Order **TIDAK PERNAH** digunakan sebagai batas plafon input pembayaran individual. Plafon pembayaran individual strictly dibatasi oleh **Sisa Pembayaran Invoice** yang dipilih.

---

## 3. Perlakuan Pajak (PPN)

- Nilai PPN (khusus SO Impact 11%) telah dihitung dan ditetapkan secara permanen pada saat penerbitan dokumen Sales Invoice.
- Saat pembayaran diterima, sistem **tidak menghitung ulang PPN** atau membagi kembali penerimaan kas/bank ke dalam komponen pajak. Pembayaran murni merupakan penerimaan kas/bank pelunasan tagihan bruto.

---

## 4. Validasi Keamanan Transaksi (Transaction Safety & Guards)

1. **Validasi ID Invoice**: Wajib menyertakan `invoice_id` yang valid. Permintaan pembayaran tanpa ID invoice ditolak seketika oleh service boundary.
2. **Status Invoice**: Invoice berstatus dibatalkan (`status === 0`) dilarang menerima pembayaran.
3. **Plafon Tagihan**: Nominal pembayaran yang melebihi sisa tagihan invoice ditolak dengan pesan:
   `"Nominal pembayaran (Rp ...) melebihi sisa tagihan invoice (Rp ...)"`.
4. **Pencegahan Double-Submit**: Tombol submit dinonaktifkan (`disabled`) secara reaktif saat request sedang diproses (`isSubmitting === true`).
5. **Pencegahan Double-Reversal**: Pembayaran yang sudah berstatus batal (`status === 0`) tidak dapat dibatalkan untuk kedua kalinya.
6. **Guard Modul Keuangan**: Pembayaran yang telah diposting ke Keuangan (`is_posted_to_finance === true`) dilindungi dari penghapusan atau pembatalan mentah, mewajibkan pembuatan jurnal pembalik pada modul Kas/Bank.

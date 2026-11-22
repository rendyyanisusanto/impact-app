# Sprint 7 — Multi-Payment & Cicilan Management

## 1. Konsep Multi-Payment pada Sales Invoice

Dalam operasional manufaktur furnitur B2B, pelanggan sering kali membayar pesanan secara bertahap:

1. **Uang Muka (Down Payment / DP)**: Dibayar saat pesanan disepakati sebelum proses produksi berjalan.
2. **Termin Progres**: Dibayar saat barang dalam proses finishing atau siap kirim.
3. **Pelunasan Akhir**: Dibayar saat barang diterima di lokasi proyek pelanggan.

Selain itu, **satu lembar tagihan invoice** juga dapat dibayar dengan beberapa transaksi terpisah (misal: transfer split bank atau pembayaran bertahap mingguan).

---

## 2. Aturan Perhitungan Sisa Tagihan & Integritas Nilai Uang

Untuk mencegah terjadinya _rounding drift_ atau selisih pecahan sen, seluruh nominal pembayaran dikonversi menjadi bilangan bulat (`Math.round` / integer IDR) sebelum disimpan dan diagregasi.

### Rumus Perhitungan Status Pembayaran

Diberikan invoice dengan total $T$ dan daftar pembayaran aktif $P = [p_1, p_2, \dots, p_k]$ di mana status $p_i = 1$:

$$\text{Sudah Dibayar} = \sum_{i=1}^{k} p_i.\text{jumlah}$$

$$\text{Sisa Pembayaran} = \max(0, T - \text{Sudah Dibayar})$$

$$ \text{Status Pembayaran} = \begin{cases}
\text{LUNAS}, & \text{jika } \text{Sudah Dibayar} \ge T \\
\text{SEBAGIAN}, & \text{jika } 0 < \text{Sudah Dibayar} < T \\
\text{BELUM\_BAYAR}, & \text{jika } \text{Sudah Dibayar} = 0
\end{cases}$$

### Validasi Pembayaran Lebih (Over-Payment Prevention)
Sistem menolak penyimpanan pembayaran jika:
$$\text{Nominal Input} > \text{Sisa Pembayaran}$$
Pesan kesalahan ramah pengguna:
> *"Nominal pembayaran (Rp X) melebihi sisa tagihan invoice (Rp Y)."*

---

## 3. Fitur Tombol Pintas "Bayar Penuh / Lunas"

Form pembayaran menyediakan tombol pintas satu-klik `Bayar Penuh / Lunas`. Ketika diklik, input nominal otomatis terisi tepat sebesar `maxAllowedNominal` (sisa tagihan), memudahkan kasir menyelesaikan transaksi pelunasan tanpa risiko saltik (*typo*).

---

## 4. Konversi Terbilang Rupiah Otomatis

Setiap kali kasir mengetik nominal pembayaran, fungsi murni `terbilangRupiah(nominal)` secara *real-time* menerjemahkan nilai angka ke dalam kata-kata bahasa Indonesia formal (misal: `Rp 4.162.500` $\to$ *"Empat Juta Seratus Enam Puluh Dua Ribu Lima Ratus Rupiah"*). Kata terbilang ini otomatis dicetak pada lembar kuitansi resmi.

$$

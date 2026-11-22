# Kontrak Integrasi Modul Pembayaran Penjualan Menuju Modul Keuangan (Sprint 7)

Impact Furniture V2

## 1. Lingkup & Batasan Integrasi Sprint 7

Sesuai arahan teknis:

- **Sprint 7**: Mengimplementasikan tata kelola pembayaran invoice penjualan, validasi saldo, riwayat pembayaran, cetak bukti tanda terima, dan isolasi relasi dokumen.
- **Sprint 8**: Akan mengimplementasikan Modul Keuangan / Kas & Bank (Buku Kas, Mutasi Bank, Rekonsiliasi, Jurnal Akuntansi).
- **Scope Boundary**: Pada Sprint 7, **tidak dibuat mutasi kas/bank otomatis** atau transaksi finansial nyata, guna mencegah pembuatan jurnal liar sebelum modul Keuangan resmi dibuka.

---

## 2. Kontrak Data Transaksi Menuju Sprint 8 (`FinancePostingContract`)

Untuk menjamin kesiapan integrasi yang mulus dan bebas regresi saat Sprint 8 diaktifkan, telah disiapkan antarmuka kontrak data `FinancePostingContract`:

```typescript
export interface FinancePostingContract {
  payment_id: number
  payment_kode: string
  tanggal: string
  metode: PaymentMethod
  bank_id: number | null
  nominal: number
  keterangan: string
  is_posted: boolean
  posted_at?: string | null
}
```

### Jaminan Keamanan Idempotensi:

1. Atribut `is_posted_to_finance: boolean` disematkan pada setiap objek `SalesPayment`.
2. Ketika modul Keuangan membukukan transaksi ini, flag diubah menjadi `true`.
3. Pengecekan guard:
   ```typescript
   if (payment.is_posted_to_finance) {
     throw new Error('Pembayaran telah tercatat di Keuangan; lakukan jurnal pembalik.')
   }
   ```
   Hal ini menjamin bahwa pembayaran tidak akan pernah tercatat dua kali di buku besar kas/bank.

---

## 3. Integrasi Master Bank

Modul pembayaran memanfaatkan layanan master data `bankService` (`app/src/modules/settings/banks/services/bank.service.ts`):

- Pilihan rekening bank (contoh: BCA PT Impact `3123128309`, Danamon, Mandiri).
- Nama bank dan nomor rekening terekam langsung di header transaksi pembayaran sehingga tetap utuh meskipun master data bank mengalami pembaruan di kemudian hari.

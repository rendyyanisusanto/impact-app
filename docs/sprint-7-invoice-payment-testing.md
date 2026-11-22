# Sprint 7 — Pengujian & QA Automation: Pembayaran Sales Invoice

## 1. Rangkuman Hasil Pengujian (Vitest & TypeScript)

Seluruh rangkaian pengujian unit, integrasi, dan tipe data lulus 100% tanpa kompromi:

- **Vitest Suites**: 97 file pengujian lulus (100%).
- **Vitest Total Tests**: 566 tes passed (100%).
- **TypeScript Typecheck (`vue-tsc --noEmit`)**: 0 error.
- **ESLint (`eslint .`)**: 0 error, 0 warning.
- **Prettier (`prettier --check .`)**: 100% konsisten.
- **Vite Production Build (`vite build`)**: Sukses (0 warning, 0 error, bundle teroptimasi).

---

## 2. Struktur File Pengujian Modul Pembayaran

| File Pengujian                        | Lingkup & Cakupan Uji                                                                                   | Jumlah Tes |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| `InvoicePaymentListPage.spec.ts`      | Header, Mode Switcher, 13 Kolom Mode A, 10 Kolom Mode B, KPI Cards, Filter, Cancel Dialog, Export       | 6 Tes      |
| `InvoicePaymentCreatePage.spec.ts`    | Entri pembayaran mandiri, pre-selected query param `?invoiceId=...`, picker populating, form submit     | 4 Tes      |
| `InvoicePaymentDetailAndEdit.spec.ts` | Voucher detail, relasi invoice & SO, receipt modal, edit page guard jika dibatalkan/posted              | 5 Tes      |
| `InvoicePicker.spec.ts`               | Navigasi keyboard (ArrowUp, ArrowDown, Enter, Esc), query search real-time, empty state, pemilihan item | 5 Tes      |
| `SalesPaymentCalculations.spec.ts`    | Rumus murni sisa tagihan, deteksi status pembayaran, validasi nominal, penomoran kode, terbilang rupiah | 12 Tes     |
| `SalesPaymentWorkflow.spec.ts`        | Integrasi transaksi pembayaran, validasi invoice_id, parsial payment, pelunasan, reversal audit         | 11 Tes     |
| `SalesInvoicePaymentPage.spec.ts`     | Riwayat pembayaran per-invoice, KPI card invoice, filter data, dialog pembatalan                        | 5 Tes      |
| `SalesInvoiceWorkflow.spec.ts`        | Alur penerbitan invoice per SO (Impact, Pola, KS), DPP/PPN, isolasi varian                              | 10 Tes     |

---

## 3. Verifikasi Quality Gate

Perintah verifikasi yang wajib dijalankan sebelum rilis:

```bash
# 1. Typecheck
npm --prefix app run typecheck

# 2. Test Suite
npm --prefix app test

# 3. Linter
npm --prefix app run lint

# 4. Code Formatting
npm --prefix app run format:check

# 5. Production Build
npm --prefix app run build
```

# SPRINT 7 — SURAT JALAN & PENGIRIMAN: LAPORAN PENGUJIAN & QA

## 1. Ringkasan Pengujian

Pengujian modul Pengiriman mencakup pengujian unit murni, pengujian kalkulasi, integrasi persediaan, dan pengujian interaktif UI komponen.

### Matriks File Uji Modul Pengiriman:

| No  | File Pengujian                         | Komponen / Modul                                                               | Jumlah Kasus | Status     |
| --- | -------------------------------------- | ------------------------------------------------------------------------------ | ------------ | ---------- |
| 1   | `DeliveryNoteCalculations.spec.ts`     | Logika penomoran, bulan romawi, status resolver, validasi kuantitas            | 17           | **PASSED** |
| 2   | `DeliveryNoteService.spec.ts`          | CRUD service, filtering, sisa kuantitas SO, konfirmasi bukti penerimaan        | 9            | **PASSED** |
| 3   | `DeliveryNoteStockIntegration.spec.ts` | Integrasi persediaan, pemotongan stok fisik, reversal batal, sinkronisasi SO   | 5            | **PASSED** |
| 4   | `DeliveryNoteListPage.spec.ts`         | UI 13-kolom DataTable matching Screenshot 1, toolbar, filtering, cancel dialog | 6            | **PASSED** |
| 5   | `DeliveryNoteCreateAndPickup.spec.ts`  | Form 2-kolom Screenshot 2, SO picker, spreadsheet quick actions, alur pickup   | 5            | **PASSED** |
| 6   | `DeliveryNoteDetailAndPrint.spec.ts`   | Halaman detail read-only, banner KPI, cetak dokumen logistik tanpa harga       | 5            | **PASSED** |

**Total Unit & Integration Tests Modul Pengiriman: 47 Tests (100% Passing)**

---

## 2. Cakupan Skenario Pengujian

1. **Format Penomoran Kode Surat Jalan**:
   - Varian Impact: `SJ/YY/MM/XXXX`
   - Varian Pola: `SJ/YY/PL/MM/XXXX`
   - Varian KS: `SJ/YY/ROMAN/XXXX`
   - Pengambilan Sendiri: `SJA/YY/MM/XXXX`
2. **Validasi Kuantitas Baris**:
   - Mencegah kuantitas pengiriman bernilai negatif.
   - Mencegah kuantitas pengiriman melebihi sisa pesanan SO.
   - Mencegah penyimpanan surat jalan jika tidak ada barang yang dikirim (`qty_kirim = 0`).
3. **Integrasi Stok & Idempotensi**:
   - Pemotongan kuantitas produk secara tepat di `productService`.
   - Menghindari pemotongan stok pada status DRAFT.
   - Memastikan pengembalian stok saat pembatalan dokumen.
4. **Validasi Logistik Dokumen Cetak**:
   - Memastikan kolom harga dan nilai nominal (`Rp`, `Harga`, `Subtotal`) **TIDAK MUNCUL** pada lembar cetak Surat Jalan untuk menjaga kerahasiaan komersial dari pengemudi / ekspedisi.

# Sprint 7 — Schema Audit & Mapping: Pembayaran Sales Invoice

## 1. Analisis Database Legacy MariaDB (`u1573701_smm(2).sql`)

Pada sistem legacy ERP Impact Furniture, struktur data transaksi penjualan berbasis faktur/invoice dan pembayarannya terdistribusi ke dalam dua tabel utama:

1. **`pembayaran_sales_order` (Domain: Sales Invoice)**:
   - Menyimpan entri tagihan (invoice) yang diterbitkan terhadap suatu Sales Order.
   - Field kunci:
     - `id`: Primary Key (AUTO_INCREMENT).
     - `so_id`: Foreign Key ke `sales_order.id`.
     - `kode`: Nomor dokumen invoice resmi (contoh: `INV/26/XI/0344-1`).
     - `tanggal`: Tanggal penerbitan invoice (`date`).
     - `jenis`: Jenis tagihan (`DP`, `Termin`, `Pelunasan`).
     - `total`: Total tagihan kotor invoice (DPP + PPN).
     - `subtotal`: Dasar Pengenaan Pajak (DPP).
     - `status`: Status aktif invoice (1 = Aktif, 0 = Dibatalkan).
     - `customer_id`: Relasi pelanggan.
     - `user_id`: Pencatat transaksi.

2. **`detail_pembayaran_sales_order` (Domain: Sales Payment Transaction)**:
   - Menyimpan transaksi pembayaran aktual yang diterima dari pelanggan untuk melunasi tagihan invoice.
   - Field kunci:
     - `id`: Primary Key (AUTO_INCREMENT).
     - `pembayaran_sales_order_id`: Foreign Key ke `pembayaran_sales_order.id` (**Invoice Reference MANDATORY**).
     - `so_id`: Denormalisasi referensi Sales Order untuk efisiensi audit & query laporan.
     - `metode_pembayaran`: Kanal pembayaran (`TRANSFER`, `TUNAI`, `CEK/GIRO`).
     - `bank_id`: Foreign Key ke `bank.id` (khusus metode `TRANSFER` atau `CEK/GIRO`).
     - `jumlah_pembayaran` / `jumlah`: Nilai nominal pembayaran tunai/transfer riil (dalam IDR).
     - `keterangan`: Catatan transaksi pembayaran.
     - `status`: Status pembayaran (1 = Valid/Berhasil, 0 = Dibatalkan/Reversal).
     - `created_at`: Timestamp transaksi.
     - `created_by`: ID user kasir/admin.

---

## 2. Relasi Bisnis & Foreign Key Hierarchy

Hirarki integritas data yang ditegakkan pada Impact Furniture V2 adalah:

$$\textbf{Sales Order} \xrightarrow{1 : N} \textbf{Sales Invoice} \xrightarrow{1 : N} \textbf{Sales Payment}$$

- **Aturan Ketat ERP**:
  1. Pembayaran **wajib** terikat langsung ke `invoice_id` (`pembayaran_sales_order_id`).
  2. Pembayaran **tidak boleh** melompati level invoice langsung ke `sales_order_id`.
  3. Satu Sales Order dapat memiliki banyak Sales Invoice (pola cicilan/termin).
  4. Satu Sales Invoice dapat dibayar bertahap melalui beberapa transaksi pembayaran (multi-payment / partial payment).
  5. Sisa tagihan invoice dihitung secara deterministik:
     $$\text{Sisa Tagihan} = \text{Total Invoice} - \sum_{\text{status}=1} \text{Nominal Pembayaran}$$

---

## 3. Kontrak Tipe TypeScript

```typescript
export type PaymentMethod = 'TRANSFER' | 'TUNAI' | 'CEK/GIRO'
export type PaymentStatus = 1 | 0

export interface SalesPayment {
  id: number
  kode: string
  invoice_id: number // FK to pembayaran_sales_order.id
  invoice_kode: string
  so_id: number // FK to sales_order.id
  so_kode: string
  variant: SalesOrderVariantKey
  customer_id?: number
  customer_nama: string
  tanggal: string
  metode_pembayaran: PaymentMethod
  bank_id: number | null
  bank_nama: string | null
  bank_rekening: string | null
  jumlah: number
  keterangan: string | null
  bukti_bayar: string | null
  status: PaymentStatus
  alasan_batal?: string | null
  created_at: string
  created_by: number
  created_by_nama: string
  updated_at?: string | null
  updated_by?: number | null
  is_posted_to_finance: boolean
}
```

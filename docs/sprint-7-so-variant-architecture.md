# SPRINT 7 — SALES ORDER VARIANT ARCHITECTURE

## 1. PENDEKATAN ARSITEKTUR

Untuk memenuhi kebutuhan bisnis Impact Furniture V2 tanpa duplikasi kode (DRY principle), modul Sales Order dirancang menggunakan **Shared Core with Variant Discriminators**:

```
[UI Routing Layer]
   /sales/so-impact   --->  SalesOrderListPage (variant: 'impact')
   /sales/so-pola     --->  SalesOrderListPage (variant: 'pola')
   /sales/so-ks       --->  SalesOrderListPage (variant: 'ks')

[Shared Components Layer]
   SalesOrderSpreadsheet
   SalesOrderAdditionalCosts
   SalesOrderSummary
   SalesOrderNotaDocument
   SalesOrderInvoiceDocument
   SalesOrderProductPicker

[State & Composable Layer]
   useSalesOrderForm(variant, isEdit)
   salesOrderCalculations
   salesOrderValidation

[Service & Repository Layer]
   SalesOrderTransactionService (Filtering by order_type & strict cross-variant boundary check)
```

---

## 2. VARIANT MATRIX

| Atribut Konfigurasi  | SO IMPACT                        | SO POLA                      | SO KS                     |
| -------------------- | -------------------------------- | ---------------------------- | ------------------------- |
| **Key**              | `impact`                         | `pola`                       | `ks`                      |
| **SQL `order_type`** | `'PPN'`                          | `'NON_PPN'`                  | `'NON_PPN_2'`             |
| **Label Menu**       | SO Impact                        | SO Pola                      | SO KS                     |
| **Judul Lengkap**    | Sales Order Impact               | Sales Order Pola             | Sales Order KS            |
| **Route Base**       | `/sales/so-impact`               | `/sales/so-pola`             | `/sales/so-ks`            |
| **Pajak (PPN)**      | Aktif (11%)                      | Non-PPN (0%)                 | Non-PPN (0%)              |
| **Faktur Pajak**     | Didukung (`no_faktur_pajak`)     | Tidak Ada                    | Tidak Ada                 |
| **Format Nomor**     | `SO/{year}/{romawi_bulan}/{seq}` | `SO/{year}/PL/{month}/{seq}` | `SO/{year}/{month}/{seq}` |
| **Contoh Nomor**     | `SO/26/XI/0344`                  | `SO/26/PL/03/0093`           | `SO/26/01/0065`           |
| **Branding Faktur**  | PT IMPACT FURNITURE              | POLARIS FURNITURE            | IMPACT FURNITURE (KS)     |

---

## 3. SECURITY & CROSS-VARIANT ISOLATION

Sistem menerapkan proteksi ketat pada service layer:
Jika pengguna membuka URL `/sales/so-pola/1` padahal ID `1` adalah transaksi berjenis `PPN` (Impact), service method `getOrderById(1, 'pola')` akan melemparkan exception:
`Pelanggaran Isolasi Dokumen: Sales Order SO/26/XI/0344 adalah tipe 'impact', bukan 'pola'. Akses ditolak.`

Pengguna akan secara otomatis diarahkan kembali ke daftar varian yang bersangkutan disertai notifikasi toast peringatan, mencegah kebocoran atau kontaminasi data antar entitas bisnis.

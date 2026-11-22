# Procurement Full Schema Mapping

## Impact Furniture v2 ERP

---

Dokumen ini adalah ringkasan pemetaan schema database legacy MariaDB (`u1573701_smm.sql`) ke domain TypeScript frontend untuk seluruh modul Pengadaan:

| Domain                        | Tabel MariaDB               | Model TypeScript      | Field Utama                                                                                                                                                               |
| ----------------------------- | --------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purchase Order Header**     | `purchase_order`            | `PurchaseOrder`       | `id`, `kode`, `suplier_id`, `tanggal`, `keterangan`, `is_ppn`, `ppn_id`, `subtotal`, `diskon`, `total`, `status`, `status_aktif`, `status_transaksi_id`, `uuid`           |
| **Purchase Order Detail**     | `detail_purchase_order`     | `PurchaseOrderDetail` | `id`, `purchase_order_id`, `bahan_id`, `qty`, `satuan_beli_id`, `harga`, `diskon`, `subtotal`, `keterangan`                                                               |
| **Penerimaan Barang Header**  | `penerimaan_barang`         | `GoodsReceipt`        | `id`, `kode`, `purchase_order_id`, `no_surat_jalan`, `gudang_id`, `tanggal`, `nama_pengirim`, `status`, `status_aktif`, `nilai_pb`, `subtotal`, `diskon`, `total`, `uuid` |
| **Penerimaan Barang Detail**  | `detail_penerimaan_barang`  | `GoodsReceiptDetail`  | `id`, `penerimaan_barang_id`, `bahan_id`, `qty_pesan`, `qty_terima`, `satuan_beli_id`, `harga_satuan`, `diskon` _(subtotal & keterangan UI-only)_                         |
| **Buku Stok Bahan**           | `histori_stok_bahan`        | `HistoriStokBahan`    | `id`, `bahan_id`, `keterangan`, `tanggal`, `created_by`, `kode`, `masuk`, `keluar`, `tbl`, `tbl_id`                                                                       |
| **Pembayaran Tagihan Header** | `pembayaran_tagihan`        | `BillPayment`         | `id`, `kode`, `no_tagihan`, `penagih`, `suplier_id`, `tanggal`, `jatuh_tempo`, `status`, `status_aktif`, `subtotal`, `total`, `total_bayar`, `uuid`                       |
| **Pembayaran Tagihan Detail** | `detail_pembayaran_tagihan` | `BillPaymentDetail`   | `id`, `pembayaran_tagihan_id`, `metode_pembayaran`, `bank_id`, `jumlah`, `keterangan`                                                                                     |
| **Relasi PB & PT**            | `detail_pb_pt`              | `DetailPbPt`          | `id`, `pb_id`, `pt_id`                                                                                                                                                    |

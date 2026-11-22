/**
 * IMPACT FURNITURE V2 - SPRINT 4 TASK 6 & 7
 * GOODS RECEIPTS SEED FIXTURES
 *
 * Mapped to `penerimaan_barang` and `detail_penerimaan_barang` legacy MariaDB schemas.
 */

import type { GoodsReceipt, GoodsReceiptDetail } from '../types/goods-receipt.types'

export const INITIAL_MOCK_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 1,
    kode: 'PB/30-12-24-0001',
    purchase_order_id: 52,
    no_surat_jalan: 'SJ-JTI-8891',
    gudang_id: 1000, // Gudang Utama
    tanggal: '2024-12-30',
    nama_pengirim: 'Bambang Supriyadi (Ekspedisi Surya)',
    keterangan: 'Penerimaan Kayu Jati Solid dari PT Sumber Kayu Abadi - Kayu kering dan mulus',
    status: 1, // Diterima / Final
    created_at: '2024-12-30 08:30:00',
    created_by: 1,
    updated_at: '2024-12-30 09:15:00',
    updated_by: 1,
    status_aktif: 1,
    total_pembayaran: 0.0,
    nilai_pb: 6750000.0,
    is_ppn: 0,
    ppn_id: null,
    subtotal: 6750000.0,
    diskon: 0.0,
    total: 6750000.0,
    total_ppn: 0.0,
    uuid: 'pb-uuid-0001-aaaa-1111'
  },
  {
    id: 2,
    kode: 'PB/31-12-24-0002',
    purchase_order_id: 53,
    no_surat_jalan: 'SJ-BMA-4421',
    gudang_id: 1000, // Gudang Utama
    tanggal: '2024-12-31',
    nama_pengirim: 'Agus Santoso (Driver PT BMA)',
    keterangan: 'Pengiriman tahap 1 busa super yellow 600 lembar dari 1000 lembar pesanan',
    status: 1, // Diterima / Final
    created_at: '2024-12-31 10:15:00',
    created_by: 1,
    updated_at: '2024-12-31 11:00:00',
    updated_by: 1,
    status_aktif: 1,
    total_pembayaran: 0.0,
    nilai_pb: 111000000.0, // 600 * 185000
    is_ppn: 1,
    ppn_id: 1,
    subtotal: 111000000.0,
    diskon: 0.0,
    total: 123210000.0, // 111000000 + 11% (12210000)
    total_ppn: 12210000.0,
    uuid: 'pb-uuid-0002-bbbb-2222'
  },
  {
    id: 3,
    kode: 'PB/02-01-25-0003',
    purchase_order_id: 54,
    no_surat_jalan: 'SJ-TKS-1092',
    gudang_id: 1000,
    tanggal: '2025-01-02',
    nama_pengirim: 'Hadi Ekspedisi',
    keterangan: 'Draft penerimaan kain fabric grey oxford',
    status: 0, // Draft
    created_at: '2025-01-02 14:00:00',
    created_by: 1,
    updated_at: '2025-01-02 14:00:00',
    updated_by: 1,
    status_aktif: 1,
    total_pembayaran: 0.0,
    nilai_pb: 19500000.0, // 300 * 65000
    is_ppn: 0,
    ppn_id: null,
    subtotal: 19500000.0,
    diskon: 0.0,
    total: 19500000.0,
    total_ppn: 0.0,
    uuid: 'pb-uuid-0003-cccc-3333'
  }
]

export const INITIAL_MOCK_GOODS_RECEIPT_DETAILS: GoodsReceiptDetail[] = [
  // Detail for PB 1 (PO 52 - Kayu Jati)
  {
    id: 1,
    penerimaan_barang_id: 1,
    bahan_id: 1, // Kayu Jati Solid Grade A
    qty_pesan: 15,
    qty_terima: 15,
    satuan_beli_id: 1, // Batang
    harga_satuan: 450000.0,
    diskon: 0
  },
  // Detail for PB 2 (PO 53 - Busa Super Yellow tahap 1)
  {
    id: 2,
    penerimaan_barang_id: 2,
    bahan_id: 2, // Busa density 32 super yellow
    qty_pesan: 1000,
    qty_terima: 600,
    satuan_beli_id: 2, // Lembar
    harga_satuan: 185000.0,
    diskon: 0
  },
  // Detail for PB 3 (PO 54 - Kain Fabric Grey Oxford)
  {
    id: 3,
    penerimaan_barang_id: 3,
    bahan_id: 3, // Kain Fabric Grey Oxford
    qty_pesan: 300,
    qty_terima: 300,
    satuan_beli_id: 3, // Meter
    harga_satuan: 65000.0,
    diskon: 0
  }
]

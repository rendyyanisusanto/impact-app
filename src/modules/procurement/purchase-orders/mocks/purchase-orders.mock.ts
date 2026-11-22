import type {
  PurchaseOrder,
  PurchaseOrderDetail,
  StatusTransaksi
} from '../types/purchase-order.types'

export const MOCK_STATUS_TRANSAKSI: StatusTransaksi[] = [
  { id: 1, status_transaksi: 'CASH' },
  { id: 2, status_transaksi: 'JATUH TEMPO' }
]

export const INITIAL_MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 52,
    kode: 'PO/30-12-24-3832',
    suplier_id: 1, // CV Kayu Jati Perkasa
    tanggal: '2024-12-30',
    keterangan: 'Pengadaan kayu jati batch akhir tahun',
    is_ppn: 0,
    ppn_id: null,
    subtotal: 6750000.0,
    diskon: 0.0,
    total_ppn: 0.0,
    total: 6750000.0,
    status: 1, // Disetujui
    status_aktif: 1,
    status_transaksi_id: 2, // JATUH TEMPO
    uuid: 'ec45f6d7-3e64-42d9-937c-16219831018f',
    created_at: '2024-12-30 04:23:50',
    created_by: 1,
    updated_at: '2024-12-30 06:40:55',
    updated_by: 1
  },
  {
    id: 53,
    kode: 'PO/30-12-24-1573',
    suplier_id: 2, // PT Busa Mandiri Abadi
    tanggal: '2024-12-30',
    keterangan: 'Busa density 32 super yellow 1000 lembar',
    is_ppn: 1,
    ppn_id: 1,
    subtotal: 185000000.0,
    diskon: 5000000.0,
    total_ppn: 19800000.0,
    total: 199800000.0,
    status: 1, // Disetujui
    status_aktif: 1,
    status_transaksi_id: 2, // JATUH TEMPO
    uuid: '465ed66c-1474-4b73-8b51-b594d4ab6649',
    created_at: '2024-12-30 04:25:53',
    created_by: 1,
    updated_at: '2024-12-30 06:40:51',
    updated_by: 1
  },
  {
    id: 54,
    kode: 'PO/31-12-24-01',
    suplier_id: 3, // Toko Besi & Engsel Jaya
    tanggal: '2024-12-31',
    keterangan: 'Pengadaan engsel sendok dan rel laci',
    is_ppn: 0,
    ppn_id: null,
    subtotal: 24000000.0,
    diskon: 0.0,
    total_ppn: 0.0,
    total: 24000000.0,
    status: 0, // Draft
    status_aktif: 1,
    status_transaksi_id: 1, // CASH
    uuid: 'a52ea788-7b36-439a-8dd4-7f0a82b336a3',
    created_at: '2024-12-31 03:49:24',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 55,
    kode: 'PO/31-12-24-919',
    suplier_id: 1, // CV Kayu Jati Perkasa
    tanggal: '2024-12-31',
    keterangan: 'Kayu jati tambahan',
    is_ppn: 1,
    ppn_id: 1,
    subtotal: 7200000.0,
    diskon: 200000.0,
    total_ppn: 770000.0,
    total: 7770000.0,
    status: 0, // Draft
    status_aktif: 1,
    status_transaksi_id: 2, // JATUH TEMPO
    uuid: 'ef453bc0-b3fd-468b-b6c6-ed23ba00bb14',
    created_at: '2024-12-31 04:11:06',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 56,
    kode: 'PO/15-01-26-001',
    suplier_id: 4, // UD Sumber Makmur
    tanggal: '2026-01-15',
    keterangan: 'Top coat finishing melamine gloss',
    is_ppn: 0,
    ppn_id: null,
    subtotal: 600000.0,
    diskon: 0.0,
    total_ppn: 0.0,
    total: 600000.0,
    status: 1, // Disetujui
    status_aktif: 1,
    status_transaksi_id: 1, // CASH
    uuid: 'c7b68380-fdb7-455b-8a9a-3faafcc01552',
    created_at: '2026-01-15 09:30:00',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 57,
    kode: 'PO/20-01-26-002',
    suplier_id: 2, // PT Busa Mandiri Abadi
    tanggal: '2026-01-20',
    keterangan: 'Busa density 32 stok cadangan',
    is_ppn: 1,
    ppn_id: 1,
    subtotal: 37000000.0,
    diskon: 0.0,
    total_ppn: 4070000.0,
    total: 41070000.0,
    status: 0, // Draft
    status_aktif: 1,
    status_transaksi_id: 2, // JATUH TEMPO
    uuid: '9ede5373-758a-4f03-ba07-808b1f087d19',
    created_at: '2026-01-20 14:15:00',
    created_by: 1,
    updated_at: null,
    updated_by: null
  }
]

export const INITIAL_MOCK_PURCHASE_ORDER_DETAILS: PurchaseOrderDetail[] = [
  // Details for PO 52
  {
    id: 118,
    purchase_order_id: 52,
    bahan_id: 1, // Kayu Jati Solid Grade A
    qty: 15,
    satuan_beli_id: 1, // Kubik (m3)
    harga: 450000.0,
    diskon: 0,
    subtotal: 6750000.0,
    keterangan: 'Batch kering oven MC 12%'
  },
  // Details for PO 53
  {
    id: 119,
    purchase_order_id: 53,
    bahan_id: 2, // Busa Density 32
    qty: 1000,
    satuan_beli_id: 5, // Dus / Karton
    harga: 185000.0,
    diskon: 0,
    subtotal: 185000000.0,
    keterangan: 'Density super yellow'
  },
  // Details for PO 54
  {
    id: 120,
    purchase_order_id: 54,
    bahan_id: 3, // Cat Finishing Melamine Gloss
    qty: 100,
    satuan_beli_id: 3, // Pail (20L)
    harga: 120000.0,
    diskon: 0,
    subtotal: 12000000.0,
    keterangan: 'Melamine gloss'
  },
  {
    id: 121,
    purchase_order_id: 54,
    bahan_id: 1,
    qty: 25,
    satuan_beli_id: 1,
    harga: 480000.0,
    diskon: 0,
    subtotal: 12000000.0,
    keterangan: 'Kayu jati cadangan'
  },
  // Details for PO 55
  {
    id: 122,
    purchase_order_id: 55,
    bahan_id: 1,
    qty: 16,
    satuan_beli_id: 1,
    harga: 450000.0,
    diskon: 0,
    subtotal: 7200000.0,
    keterangan: 'Kebutuhan workshop B'
  },
  // Details for PO 56
  {
    id: 123,
    purchase_order_id: 56,
    bahan_id: 3,
    qty: 5,
    satuan_beli_id: 3,
    harga: 120000.0,
    diskon: 0,
    subtotal: 600000.0,
    keterangan: 'Finishing kilap'
  },
  // Details for PO 57
  {
    id: 124,
    purchase_order_id: 57,
    bahan_id: 2,
    qty: 200,
    satuan_beli_id: 5,
    harga: 185000.0,
    diskon: 0,
    subtotal: 37000000.0,
    keterangan: 'Busa untuk kursi sofa'
  }
]

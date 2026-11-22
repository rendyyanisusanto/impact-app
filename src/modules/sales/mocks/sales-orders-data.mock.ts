import type {
  SalesOrder,
  DetailSalesOrder,
  KomponenSalesOrder,
  SalesPerson,
  MasterPpn
} from '../types/sales-order.types'
import type { SalesInvoice } from '../types/sales-invoice.types'
import type { HistoriTable } from '../types/sales-history.types'

export const INITIAL_MOCK_SALES_PERSONS: SalesPerson[] = [
  { id: 118, nik: '66', nama: 'YANTO', no_hp: '081234567801' },
  { id: 119, nik: '67', nama: 'DODO', no_hp: '081234567802' },
  { id: 120, nik: '68', nama: 'ABAS', no_hp: '081234567803' }
]

export const INITIAL_MOCK_PPN: MasterPpn[] = [
  { id: 1, kode: 'PPN-6277925', nama: 11, status: 1, is_active: 1 },
  { id: 2, kode: 'PPN-8646330', nama: 10, status: 1, is_active: 0 }
]

export const INITIAL_MOCK_SALES_ORDERS: SalesOrder[] = [
  // 1. SO IMPACT (order_type: 'PPN') - Matching Legacy Screenshot 2
  {
    id: 1,
    customer_id: 1, // Hotel Grand Pelangi
    kode: 'SO/26/XI/0344',
    tanggal: '2026-11-01',
    keterangan: 'Pesanan set meja & kursi meeting hotel batch 1',
    is_ppn: 1,
    ppn_id: 1,
    subtotal: 7500000,
    diskon: 0,
    total_ppn: 825000,
    status: 1, // SUCCEEDED
    total: 8325000,
    status_produksi: 0,
    status_aktif: 1,
    count_print: 2,
    no_faktur_pajak: '010.002-26.89123456',
    sales_id: 118, // Yanto
    order_type: 'PPN',
    created_at: '2026-11-01 09:30:00',
    created_by: 1
  },
  {
    id: 2,
    customer_id: 2, // PT Meja Bersama
    kode: 'SO/26/XI/0345',
    tanggal: '2026-11-01',
    keterangan: 'Pengadaan workstation kantor divisi finance',
    is_ppn: 1,
    ppn_id: 1,
    subtotal: 12000000,
    diskon: 5,
    total_ppn: 1254000,
    status: 0, // DRAFT
    total: 12654000,
    status_produksi: 1,
    status_aktif: 1,
    count_print: 0,
    no_faktur_pajak: '010.002-26.89123457',
    sales_id: 119, // Dodo
    order_type: 'PPN',
    created_at: '2026-11-01 10:15:00',
    created_by: 1
  },

  // 2. SO POLA (order_type: 'NON_PPN')
  {
    id: 3,
    customer_id: 3, // Kantor Cabang Bank Artha
    kode: 'SO/26/PL/03/0093',
    tanggal: '2026-11-01',
    keterangan: 'Pemesanan mebel customer direct cabang Surabaya',
    is_ppn: 0,
    ppn_id: null,
    subtotal: 4800000,
    diskon: 0,
    total_ppn: 0,
    status: 1, // SUCCEEDED
    total: 4900000, // Includes 100k ongkir
    status_produksi: 0,
    status_aktif: 1,
    count_print: 1,
    no_faktur_pajak: null,
    sales_id: 118, // Yanto
    order_type: 'NON_PPN',
    created_at: '2026-11-01 08:45:00',
    created_by: 1
  },
  {
    id: 4,
    customer_id: 1,
    kode: 'SO/26/PL/03/0094',
    tanggal: '2026-11-01',
    keterangan: 'Pesanan tambahan kursi cadangan seminar',
    is_ppn: 0,
    ppn_id: null,
    subtotal: 2400000,
    diskon: 0,
    total_ppn: 0,
    status: 0, // DRAFT
    total: 2400000,
    status_produksi: 0,
    status_aktif: 1,
    count_print: 0,
    no_faktur_pajak: null,
    sales_id: 120, // Abas
    order_type: 'NON_PPN',
    created_at: '2026-11-01 11:00:00',
    created_by: 1
  },

  // 3. SO KS (order_type: 'NON_PPN_2')
  {
    id: 5,
    customer_id: 2,
    kode: 'SO/26/01/0065',
    tanggal: '2026-11-01',
    keterangan: 'Distribusi retail furniture wilayah Timur',
    is_ppn: 0,
    ppn_id: null,
    subtotal: 6500000,
    diskon: 0,
    total_ppn: 0,
    status: 1, // SUCCEEDED
    total: 6500000,
    status_produksi: 0,
    status_aktif: 1,
    count_print: 3,
    no_faktur_pajak: null,
    sales_id: 120, // Abas
    order_type: 'NON_PPN_2',
    created_at: '2026-11-01 08:00:00',
    created_by: 1
  }
]

export const INITIAL_MOCK_DETAIL_SALES_ORDERS: DetailSalesOrder[] = [
  // Details for SO 1 (SO/26/XI/0344)
  {
    id: 101,
    sales_order_id: 1,
    produk_id: 43, // IC - 74 Kursi Kantor Mesh
    qty: 15,
    harga: 250000,
    diskon: 0,
    subtotal: 3750000,
    status_produksi: 0, // Ready Stock
    keterangan: 'Warna Hitam Standar'
  },
  {
    id: 102,
    sales_order_id: 1,
    produk_id: 44, // AK - C4 Kursi Tunggu Bandara 4 Dudukan
    qty: 5,
    harga: 750000,
    diskon: 0,
    subtotal: 3750000,
    status_produksi: 1, // Perlu Produksi
    keterangan: 'Finishing Chrome Silver'
  },

  // Details for SO 2 (SO/26/XI/0345)
  {
    id: 103,
    sales_order_id: 2,
    produk_id: 43,
    qty: 40,
    harga: 300000,
    diskon: 5,
    subtotal: 11400000,
    status_produksi: 1,
    keterangan: 'Khusus Ruang Kerja'
  },

  // Details for SO 3 (SO/26/PL/03/0093)
  {
    id: 104,
    sales_order_id: 3,
    produk_id: 43,
    qty: 16,
    harga: 300000,
    diskon: 0,
    subtotal: 4800000,
    status_produksi: 0,
    keterangan: 'Ambil di Gudang'
  },

  // Details for SO 4 (SO/26/PL/03/0094)
  {
    id: 105,
    sales_order_id: 4,
    produk_id: 43,
    qty: 8,
    harga: 300000,
    diskon: 0,
    subtotal: 2400000,
    status_produksi: 0,
    keterangan: 'Siap kirim'
  },

  // Details for SO 5 (SO/26/01/0065)
  {
    id: 106,
    sales_order_id: 5,
    produk_id: 44,
    qty: 10,
    harga: 650000,
    diskon: 0,
    subtotal: 6500000,
    status_produksi: 0,
    keterangan: 'Pengiriman via truk ekspedisi'
  }
]

export const INITIAL_MOCK_KOMPONEN_SALES_ORDERS: KomponenSalesOrder[] = [
  // Biaya Tambahan for SO 1
  {
    id: 201,
    sales_order_id: 1,
    komponen: 'ONGKOS KIRIM SURABAYA',
    jumlah: 150000
  },
  // Biaya Tambahan for SO 3
  {
    id: 202,
    sales_order_id: 3,
    komponen: 'ONGKIR GRESIK',
    jumlah: 100000
  }
]

// Mock payment link for tracking paid amounts
export const INITIAL_MOCK_PAYMENTS: Record<number, number> = {
  1: 8325000, // SO 1 LUNAS
  2: 0, // SO 2 BELUM BAYAR
  3: 2500000, // SO 3 SEBAGIAN (dari total 4.900.000)
  4: 0, // SO 4 BELUM BAYAR
  5: 6500000 // SO 5 LUNAS
}

// Mock delivery status
export const INITIAL_MOCK_DELIVERIES: Record<number, 'BELUM_KIRIM' | 'TERKIRIM'> = {
  1: 'TERKIRIM',
  2: 'BELUM_KIRIM',
  3: 'TERKIRIM',
  4: 'BELUM_KIRIM',
  5: 'TERKIRIM'
}

// Initial Mock Sales Invoices
export const INITIAL_MOCK_INVOICES: SalesInvoice[] = [
  {
    id: 1001,
    so_id: 1,
    kode: 'INV/26/XI/0344-1',
    tanggal: '2026-11-01',
    jenis: 'DP',
    subtotal: 3750000,
    total_ppn: 412500,
    total: 4162500,
    no_faktur_pajak: '010.002-26.89123456',
    terbayar: 4162500,
    status_pembayaran: 'LUNAS',
    status: 1,
    keterangan: 'Tagihan Uang Muka (DP) 50%',
    created_at: '2026-11-01 09:40:00',
    created_by: 1,
    created_by_nama: 'Super Admin'
  },
  {
    id: 1002,
    so_id: 1,
    kode: 'INV/26/XI/0344-2',
    tanggal: '2026-11-01',
    jenis: 'Pelunasan',
    subtotal: 3750000,
    total_ppn: 412500,
    total: 4162500,
    no_faktur_pajak: '010.002-26.89123457',
    terbayar: 4162500,
    status_pembayaran: 'LUNAS',
    status: 1,
    keterangan: 'Tagihan Pelunasan Sisa Pesanan',
    created_at: '2026-11-01 10:00:00',
    created_by: 1,
    created_by_nama: 'Super Admin'
  },
  {
    id: 1003,
    so_id: 3,
    kode: 'INV/26/PL/03/0093-1',
    tanggal: '2026-11-01',
    jenis: 'DP',
    subtotal: 2500000,
    total_ppn: 0,
    total: 2500000,
    no_faktur_pajak: null,
    terbayar: 1500000,
    status_pembayaran: 'SEBAGIAN',
    status: 1,
    keterangan: 'Tagihan Uang Muka DP 50% (Non-PPN Pola)',
    created_at: '2026-11-01 08:50:00',
    created_by: 1,
    created_by_nama: 'Super Admin'
  },
  {
    id: 1004,
    so_id: 3,
    kode: 'INV/26/PL/03/0093-2',
    tanggal: '2026-11-01',
    jenis: 'Pelunasan',
    subtotal: 2400000,
    total_ppn: 0,
    total: 2400000,
    no_faktur_pajak: null,
    terbayar: 0,
    status_pembayaran: 'BELUM_BAYAR',
    status: 1,
    keterangan: 'Tagihan Pelunasan Sisa Pesanan (Non-PPN Pola)',
    created_at: '2026-11-01 09:15:00',
    created_by: 1,
    created_by_nama: 'Super Admin'
  }
]

// Initial Mock History Records (histori_table)
export const INITIAL_MOCK_HISTORI: HistoriTable[] = [
  {
    id: 1,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'CREATE',
    keterangan:
      'Tambah sales order pada tanggal 01-Nov-2026 dengan kode SO/26/XI/0344 dengan status SUCCESSED/TERTUTUP',
    created_at: '2026-11-01 09:30:00',
    table_id: 1,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 2,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'PRINT',
    keterangan: 'Print Faktur Penjualan',
    created_at: '2026-11-01 09:35:00',
    table_id: 1,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 3,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'INVOICE_CREATE',
    keterangan: 'Penerbitan Invoice INV/26/XI/0344-1 (DP) sebesar Rp 4.162.500',
    created_at: '2026-11-01 09:40:00',
    table_id: 1,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 4,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'INVOICE_CREATE',
    keterangan: 'Penerbitan Invoice INV/26/XI/0344-2 (Pelunasan) sebesar Rp 4.162.500',
    created_at: '2026-11-01 10:00:00',
    table_id: 1,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 5,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'CREATE',
    keterangan:
      'Tambah sales order pada tanggal 01-Nov-2026 dengan kode SO/26/XI/0345 dengan status DRAFT/TERBUKA',
    created_at: '2026-11-01 10:15:00',
    table_id: 2,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 6,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'CREATE',
    keterangan:
      'Tambah sales order pada tanggal 01-Nov-2026 dengan kode SO/26/PL/03/0093 dengan status SUCCESSED/TERTUTUP',
    created_at: '2026-11-01 08:45:00',
    table_id: 3,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 7,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'INVOICE_CREATE',
    keterangan: 'Penerbitan Invoice INV/26/PL/03/0093-1 (DP) sebesar Rp 2.500.000',
    created_at: '2026-11-01 08:50:00',
    table_id: 3,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 8,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'CREATE',
    keterangan:
      'Tambah sales order pada tanggal 01-Nov-2026 dengan kode SO/26/PL/03/0094 dengan status DRAFT/TERBUKA',
    created_at: '2026-11-01 11:00:00',
    table_id: 4,
    user_id: 1,
    user_nama: 'Super Admin'
  },
  {
    id: 9,
    table: 'sales_order',
    tanggal: '2026-11-01',
    metode: 'CREATE',
    keterangan:
      'Tambah sales order pada tanggal 01-Nov-2026 dengan kode SO/26/01/0065 dengan status SUCCESSED/TERTUTUP',
    created_at: '2026-11-01 08:00:00',
    table_id: 5,
    user_id: 1,
    user_nama: 'Super Admin'
  }
]
